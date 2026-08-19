import { freshDeck, CryptoRng } from "./cards.js";
import { compareHands, describeHand, evaluateBest } from "./evaluator.js";
export class EngineError extends Error {
    code;
    constructor(message, code = "illegal-action") {
        super(message);
        this.code = code;
        this.name = "EngineError";
    }
}
const MAX_LOG_ENTRIES = 100;
function defaultNow() {
    return Date.now();
}
export class PokerEngine {
    rng;
    now;
    constructor(options = {}) {
        this.rng = options.rng ?? new CryptoRng();
        this.now = options.now ?? defaultNow;
    }
    // ── public lifecycle ──────────────────────────────────────────────────────
    /** Start a new hand on `state` when at least two players can participate. */
    startHand(state) {
        const events = [];
        if (state.hand !== null)
            throw new EngineError("hand already in progress", "hand-in-progress");
        const participants = [];
        for (let seatIndex = 0; seatIndex < state.seats.length; seatIndex++) {
            const seat = state.seats[seatIndex];
            if (seat !== null && seat !== undefined && seat.stack > 0)
                participants.push({ seat, seatIndex });
        }
        if (participants.length < 2) {
            events.push(this.logEvent(state, "Waiting for at least 2 players to start a hand."));
            return { events, changed: false };
        }
        state.handNumber += 1;
        const dealerSeat = this.nextOccupiedSeat(state, state.dealerSeat);
        state.dealerSeat = dealerSeat;
        // Heads-up: the dealer is the small blind (standard rule); otherwise the
        // small blind is the first occupied seat left of the dealer.
        const sbSeat = participants.length === 2 ? dealerSeat : this.nextOccupiedSeat(state, dealerSeat);
        const bbSeat = this.nextOccupiedSeat(state, sbSeat);
        const hand = {
            handId: `${state.tableId}-h${state.handNumber}-${this.now()}`,
            handNumber: state.handNumber,
            phase: "preflop",
            deck: freshDeck(this.rng),
            holeCardsByPlayer: {},
            community: [],
            players: [],
            pots: [],
            toCall: 0,
            minRaise: state.bigBlind,
            currentTurnSeat: -1,
            turnDeadlineAt: 0,
            lastAggressorIdx: -1,
            street: 0,
            startedAt: this.now(),
        };
        for (const { seat, seatIndex } of participants) {
            const hp = {
                seat: seatIndex,
                playerId: seat.playerId,
                nickname: seat.nickname,
                holeCards: [],
                startingStack: seat.stack,
                stack: seat.stack,
                bet: 0,
                committed: 0,
                folded: false,
                allIn: false,
                acted: false,
                excluded: false,
            };
            hand.players.push(hp);
            hand.holeCardsByPlayer[seat.playerId] = hp.holeCards;
        }
        // Post blinds (short stacks go all-in).
        const sbPlayer = this.playerAtSeat(hand, sbSeat);
        const bbPlayer = this.playerAtSeat(hand, bbSeat);
        if (sbPlayer === undefined || bbPlayer === undefined) {
            throw new EngineError("blind seats missing (invariant)", "seat-invariant");
        }
        this.postBlind(hand, sbPlayer, Math.min(state.smallBlind, sbPlayer.stack));
        this.postBlind(hand, bbPlayer, Math.min(state.bigBlind, bbPlayer.stack));
        hand.toCall = bbPlayer.bet;
        hand.minRaise = state.bigBlind;
        // Deal two hole cards each, starting left of the dealer.
        for (let i = 0; i < 2; i++) {
            for (const hp of hand.players)
                hp.holeCards.push(hand.deck.shift());
        }
        // First actor: first active player after the big blind (heads-up: the SB/dealer).
        hand.currentTurnSeat = this.firstActiveAfter(hand, bbSeat);
        state.hand = hand;
        this.armTurn(state, hand);
        events.push(this.logEvent(state, `Hand #${state.handNumber} started — dealer: ${sbPlayer.nickname}. Blinds ${state.smallBlind}/${state.bigBlind}.`, hand.handId));
        return { events, changed: true };
    }
    /** Legal actions for the player at `seat`, or [] when it is not their turn. */
    legalActions(state, seat) {
        const hand = state.hand;
        if (hand === null)
            return [];
        const p = this.playerAtSeat(hand, seat);
        if (p === undefined)
            return [];
        if (p.folded || p.allIn || p.excluded || hand.currentTurnSeat !== seat || p.stack === 0)
            return [];
        const maxTo = p.stack + p.bet;
        if (hand.toCall === 0) {
            const actions = [{ type: "check" }];
            const minBet = Math.max(state.bigBlind, 1);
            if (p.stack >= minBet)
                actions.push({ type: "bet", min: minBet, max: p.stack });
            actions.push({ type: "allin" });
            return actions;
        }
        const need = hand.toCall - p.bet;
        const actions = need > 0 ? [{ type: "fold" }, { type: "call", amount: Math.min(need, p.stack) }] : [{ type: "check" }];
        // A raise is legal only when betting is open for this player: they have not
        // yet acted (BB option / not acted / reopened by a full raise) and can make
        // a full raise. A short all-in raise does NOT reopen betting.
        const minRaiseTo = hand.toCall + hand.minRaise;
        if (!p.acted && maxTo >= minRaiseTo) {
            actions.push({ type: "raise", min: minRaiseTo, max: maxTo });
        }
        actions.push({ type: "allin" });
        return actions;
    }
    /**
     * Apply one player action. Throws EngineError when illegal. Mutates `state`
     * (including street advances and showdowns when the action closes a round).
     */
    applyAction(state, seat, type, amount) {
        const events = [];
        const hand = state.hand;
        if (hand === null)
            throw new EngineError("no hand in progress", "no-hand");
        const p = this.playerAtSeat(hand, seat);
        if (p === undefined)
            throw new EngineError("player not in hand", "not-in-hand");
        if (p.folded || p.excluded)
            throw new EngineError("player is not active", "not-active");
        if (p.allIn)
            throw new EngineError("player is all-in", "all-in");
        if (hand.currentTurnSeat !== seat)
            throw new EngineError("not your turn", "not-your-turn");
        const before = this.totalChips(state);
        const prevToCall = hand.toCall;
        const prevMinRaise = hand.minRaise;
        let paid = 0;
        let newLevel = null;
        switch (type) {
            case "fold": {
                p.folded = true;
                events.push(this.logEvent(state, `${p.nickname} folds.`, hand.handId));
                break;
            }
            case "check": {
                if (hand.toCall > 0 && p.bet < hand.toCall) {
                    throw new EngineError("cannot check when facing a bet", "illegal-check");
                }
                events.push(this.logEvent(state, `${p.nickname} checks.`, hand.handId));
                break;
            }
            case "call": {
                const need = hand.toCall - p.bet;
                if (need <= 0) {
                    events.push(this.logEvent(state, `${p.nickname} checks.`, hand.handId));
                    break;
                }
                paid = Math.min(need, p.stack);
                this.wager(p, paid);
                events.push(this.logEvent(state, p.stack === 0 ? `${p.nickname} calls all-in (${paid}).` : `${p.nickname} calls ${paid}.`, hand.handId));
                break;
            }
            case "bet": {
                if (hand.toCall !== 0)
                    throw new EngineError("cannot bet when facing a bet", "illegal-bet");
                const total = this.requireInteger(amount, "bet amount");
                if (total < Math.max(state.bigBlind, 1) || total > p.stack) {
                    throw new EngineError(`bet must be between ${Math.max(state.bigBlind, 1)} and ${p.stack}`, "illegal-amount");
                }
                paid = total;
                this.wager(p, paid);
                newLevel = total;
                events.push(this.logEvent(state, `${p.nickname} bets ${total}.`, hand.handId));
                break;
            }
            case "raise": {
                if (hand.toCall === 0)
                    throw new EngineError("cannot raise without a bet to raise", "illegal-raise");
                const total = this.requireInteger(amount, "raise amount");
                const minTo = hand.toCall + hand.minRaise;
                const maxTo = p.stack + p.bet;
                if (total < minTo || total > maxTo) {
                    throw new EngineError(`raise must be between ${minTo} and ${maxTo}`, "illegal-amount");
                }
                if (p.acted)
                    throw new EngineError("betting is not open for this player (short all-in did not reopen)", "illegal-raise");
                paid = total - p.bet;
                this.wager(p, paid);
                newLevel = total;
                events.push(this.logEvent(state, `${p.nickname} raises to ${total}.`, hand.handId));
                break;
            }
            case "allin": {
                paid = p.stack;
                this.wager(p, paid);
                newLevel = p.bet;
                events.push(this.logEvent(state, `${p.nickname} is all-in for ${p.bet}.`, hand.handId));
                break;
            }
            default: {
                throw new EngineError(`unknown action ${String(type)}`, "illegal-action");
            }
        }
        // A full raise reopens betting for everyone else; a short all-in raise only
        // moves toCall. minRaise advances only on full raises.
        if (newLevel !== null && newLevel > prevToCall) {
            const increment = newLevel - prevToCall;
            if (increment >= prevMinRaise) {
                hand.minRaise = Math.max(prevMinRaise, increment);
                hand.lastAggressorIdx = this.indexOf(hand, p.playerId);
                for (const other of hand.players) {
                    if (other.playerId !== p.playerId && !other.folded && !other.allIn && !other.excluded)
                        other.acted = false;
                }
            }
            hand.toCall = newLevel;
        }
        p.lastAction = { type, amount: paid, at: this.now() };
        p.acted = true;
        this.advanceIfRoundClosed(state, events);
        this.assertConservation(state, before);
        return { events, changed: true };
    }
    /**
     * Fold a player who left mid-hand (works even when it is not their turn).
     * Their committed chips stay in the pots. Advances the round/hand when the
     * fold closes it.
     */
    removePlayer(state, playerId, reason) {
        const hand = state.hand;
        if (hand === null)
            return { events: [], changed: false };
        const p = hand.players.find((x) => x.playerId === playerId);
        if (p === undefined || p.folded || p.excluded)
            return { events: [], changed: false };
        const before = this.totalChips(state);
        p.folded = true;
        p.acted = true;
        const events = [this.logEvent(state, `${p.nickname} left the hand (${reason}).`, hand.handId)];
        this.advanceIfRoundClosed(state, events);
        this.assertConservation(state, before);
        return { events, changed: true };
    }
    /**
     * Timeout rule (deterministic and testable): when the acting player's
     * deadline has passed, auto-fold when facing a bet, otherwise check.
     */
    autoAct(state, at) {
        const now = at ?? this.now();
        const hand = state.hand;
        if (hand === null)
            return { events: [], changed: false };
        if (hand.turnDeadlineAt === 0 || now < hand.turnDeadlineAt)
            return { events: [], changed: false };
        const p = this.playerAtSeat(hand, hand.currentTurnSeat);
        if (p === undefined || p.folded || p.allIn || p.excluded)
            return { events: [], changed: false };
        const before = this.totalChips(state);
        const type = hand.toCall > 0 ? "fold" : "check";
        const events = [];
        if (type === "fold") {
            p.folded = true;
            events.push(this.logEvent(state, `${p.nickname} auto-folds (timeout).`, hand.handId));
        }
        else {
            events.push(this.logEvent(state, `${p.nickname} auto-checks (timeout).`, hand.handId));
        }
        p.lastAction = { type, amount: 0, at: now };
        p.acted = true;
        this.advanceIfRoundClosed(state, events);
        this.assertConservation(state, before);
        return { events, changed: true };
    }
    /** The displayed pots (main + side) derived from committed + current bets. */
    buildPots(state) {
        const hand = state.hand;
        if (hand === null)
            return [];
        return buildPotsFrom(hand.players.map((p) => ({
            playerId: p.playerId,
            amount: p.committed + p.bet,
            folded: p.folded || p.excluded,
        }))).pots;
    }
    /**
     * Total chips on the table (stacks + everything committed). Handles players
     * seated but not in the current hand (e.g. joined mid-hand): their seat
     * stack counts directly.
     */
    totalChips(state) {
        let total = 0;
        const hand = state.hand;
        for (let i = 0; i < state.seats.length; i++) {
            const seat = state.seats[i];
            if (seat === null || seat === undefined)
                continue;
            const hp = hand?.players.find((p) => p.playerId === seat.playerId);
            if (hp !== undefined)
                total += hp.stack + hp.committed + hp.bet;
            else
                total += seat.stack;
        }
        return total;
    }
    // ── private ───────────────────────────────────────────────────────────────
    logEvent(state, text, handId) {
        const at = this.now();
        const entry = { at, text, ...(handId !== undefined ? { handId } : {}) };
        state.log.push(entry);
        if (state.log.length > MAX_LOG_ENTRIES)
            state.log.splice(0, state.log.length - MAX_LOG_ENTRIES);
        return { kind: "log", text, at, ...(handId !== undefined ? { handId } : {}) };
    }
    wager(p, amount) {
        if (amount < 0 || amount > p.stack)
            throw new EngineError(`invalid wager ${amount}`, "illegal-amount");
        p.stack -= amount;
        p.bet += amount;
        if (p.stack === 0)
            p.allIn = true;
    }
    postBlind(hand, p, amount) {
        if (amount < 0 || amount > p.stack)
            throw new EngineError("invalid blind", "illegal-blind");
        p.stack -= amount;
        p.bet += amount;
        if (p.stack === 0)
            p.allIn = true;
        // Blinds are forced bets, not actions: the player keeps the right to
        // raise when it is their turn (the big blind's option is implied).
    }
    requireInteger(value, what) {
        if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new EngineError(`${what} must be an integer`, "illegal-amount");
        }
        return value;
    }
    indexOf(hand, playerId) {
        return hand.players.findIndex((p) => p.playerId === playerId);
    }
    playerAtSeat(hand, seat) {
        return hand.players.find((p) => p.seat === seat);
    }
    nextOccupiedSeat(state, from) {
        for (let i = 1; i <= state.maxSeats; i++) {
            const seat = (from + i + state.maxSeats) % state.maxSeats;
            const s = state.seats[seat];
            if (s !== null && s !== undefined && s.stack > 0)
                return seat;
        }
        return -1;
    }
    /** First non-folded, non-all-in, non-excluded player after `from` (clockwise). */
    firstActiveAfter(hand, from) {
        const players = hand.players; // seat-ascending by construction
        const fromIdx = players.findIndex((p) => p.seat === from);
        if (fromIdx < 0)
            return -1;
        for (let i = 1; i <= players.length; i++) {
            const p = players[(fromIdx + i) % players.length];
            if (p !== undefined && !p.folded && !p.allIn && !p.excluded)
                return p.seat;
        }
        return -1;
    }
    armTurn(state, hand) {
        hand.turnDeadlineAt = hand.currentTurnSeat >= 0 ? this.now() + state.actionTimeoutMs : 0;
    }
    advanceIfRoundClosed(state, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        const remaining = hand.players.filter((p) => !p.folded && !p.excluded);
        if (remaining.length <= 1) {
            this.endHandBySurvivor(state, events);
            return;
        }
        const active = remaining.filter((p) => !p.allIn);
        if (active.length === 0) {
            // Everyone all-in: run out the board and go to showdown.
            this.runOut(state, events);
            return;
        }
        const roundClosed = active.every((p) => p.acted) && active.every((p) => p.bet === hand.toCall || hand.toCall === 0);
        if (!roundClosed) {
            hand.currentTurnSeat = this.firstActiveAfter(hand, hand.currentTurnSeat);
            this.armTurn(state, hand);
            return;
        }
        this.completeStreet(state, events);
    }
    completeStreet(state, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        // Fold street bets into committed totals.
        for (const p of hand.players) {
            p.committed += p.bet;
            p.bet = 0;
        }
        hand.pots = this.buildPots(state);
        if (hand.phase === "river") {
            this.runShowdown(state, events);
            return;
        }
        if (hand.phase === "preflop") {
            hand.phase = "flop";
            hand.street = 3;
            hand.community.push(...hand.deck.splice(0, 3));
            events.push(this.logEvent(state, "Flop dealt.", hand.handId));
        }
        else if (hand.phase === "flop") {
            hand.phase = "turn";
            hand.street = 4;
            hand.community.push(...hand.deck.splice(0, 1));
            events.push(this.logEvent(state, "Turn dealt.", hand.handId));
        }
        else {
            hand.phase = "river";
            hand.street = 5;
            hand.community.push(...hand.deck.splice(0, 1));
            events.push(this.logEvent(state, "River dealt.", hand.handId));
        }
        this.resetRound(state);
        const remaining = hand.players.filter((p) => !p.folded && !p.excluded);
        const active = remaining.filter((p) => !p.allIn);
        if (active.length === 0) {
            this.runOut(state, events);
            return;
        }
        hand.currentTurnSeat = this.firstActiveAfter(hand, state.dealerSeat);
        this.armTurn(state, hand);
    }
    resetRound(state) {
        const hand = state.hand;
        if (hand === null)
            return;
        hand.toCall = 0;
        hand.minRaise = state.bigBlind;
        hand.lastAggressorIdx = -1;
        for (const p of hand.players) {
            p.acted = p.folded || p.allIn || p.excluded;
        }
    }
    /** Deal the rest of the board when everyone is all-in. */
    runOut(state, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        for (const p of hand.players) {
            p.committed += p.bet;
            p.bet = 0;
        }
        if (hand.street < 3) {
            hand.street = 3;
            hand.phase = "flop";
            hand.community.push(...hand.deck.splice(0, 3));
            events.push(this.logEvent(state, "All-in runout: flop dealt.", hand.handId));
        }
        if (hand.street < 4) {
            hand.street = 4;
            hand.phase = "turn";
            hand.community.push(...hand.deck.splice(0, 1));
            events.push(this.logEvent(state, "Turn dealt.", hand.handId));
        }
        if (hand.street < 5) {
            hand.street = 5;
            hand.phase = "river";
            hand.community.push(...hand.deck.splice(0, 1));
            events.push(this.logEvent(state, "River dealt.", hand.handId));
        }
        this.runShowdown(state, events);
    }
    endHandBySurvivor(state, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        const survivor = hand.players.find((p) => !p.folded && !p.excluded);
        const { pots, refunds } = buildPotsFrom(hand.players.map((p) => ({ playerId: p.playerId, amount: p.committed + p.bet, folded: p.folded || p.excluded })));
        const total = pots.reduce((s, pot) => s + pot.amount, 0) + refunds.reduce((s, r) => s + r.amount, 0);
        const winners = [];
        if (survivor !== undefined) {
            survivor.stack += total;
            winners.push({ playerId: survivor.playerId, nickname: survivor.nickname, amount: total, handLabel: "" });
            events.push(this.logEvent(state, `${survivor.nickname} wins ${total} — everyone else folded.`, hand.handId));
        }
        this.finishHand(state, winners, events);
    }
    runShowdown(state, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        hand.phase = "showdown";
        for (const p of hand.players) {
            p.committed += p.bet;
            p.bet = 0;
        }
        const { pots, refunds } = buildPotsFrom(hand.players.map((p) => ({ playerId: p.playerId, amount: p.committed, folded: p.folded || p.excluded })));
        hand.pots = pots;
        const revealed = [];
        const winners = [];
        // Refund uncalled chips above the top eligible contribution back to their
        // contributors (defensive; unreachable in normal play, keeps conservation).
        for (const refund of refunds) {
            const target = hand.players.find((p) => p.playerId === refund.playerId);
            if (target !== undefined) {
                target.stack += refund.amount;
                target.committed -= refund.amount;
            }
        }
        for (const pot of pots) {
            const eligible = pot.eligiblePlayerIds
                .map((id) => hand.players.find((p) => p.playerId === id))
                .filter((p) => p !== undefined);
            if (eligible.length === 0)
                continue;
            const values = new Map();
            for (const player of eligible) {
                values.set(player.playerId, evaluateBest([...player.holeCards, ...hand.community]));
            }
            const bestValue = [...values.values()].reduce((best, v) => (compareHands(v, best) > 0 ? v : best));
            const winnersOfPot = eligible.filter((player) => compareHands(values.get(player.playerId), bestValue) === 0);
            // Multi-way pots reveal every contender's hand (public at showdown);
            // a lone contender is mucked and nothing is revealed.
            if (eligible.length > 1) {
                for (const player of eligible) {
                    if (!revealed.some((r) => r.playerId === player.playerId)) {
                        revealed.push({
                            playerId: player.playerId,
                            nickname: player.nickname,
                            cards: player.holeCards.map((c) => `${c.rank}${"cdhs"[c.suit]}`),
                            handLabel: describeHand(values.get(player.playerId)),
                        });
                    }
                }
            }
            else if (eligible.length === 1) {
                const only = eligible[0];
                if (!revealed.some((r) => r.playerId === only.playerId)) {
                    revealed.push({
                        playerId: only.playerId,
                        nickname: only.nickname,
                        cards: [],
                        handLabel: describeHand(values.get(only.playerId)),
                    });
                }
            }
            // Split the pot among tied winners; odd chips go to the earliest seat
            // clockwise from the dealer.
            const share = Math.floor(pot.amount / winnersOfPot.length);
            let remainder = pot.amount % winnersOfPot.length;
            const ordered = [...winnersOfPot].sort((a, b) => this.seatOrderFrom(state.dealerSeat, a.seat, b.seat));
            for (const winner of ordered) {
                const extra = remainder > 0 ? 1 : 0;
                remainder -= extra;
                winner.stack += share + extra;
                winners.push({
                    playerId: winner.playerId,
                    nickname: winner.nickname,
                    amount: share + extra,
                    handLabel: describeHand(values.get(winner.playerId)),
                });
            }
        }
        const totals = new Map();
        for (const w of winners)
            totals.set(w.playerId, (totals.get(w.playerId) ?? 0) + w.amount);
        const summary = [...totals.entries()]
            .map(([id, amount]) => `${hand.players.find((x) => x.playerId === id)?.nickname ?? id} wins ${amount}`)
            .join("; ");
        if (summary)
            events.push(this.logEvent(state, `Showdown: ${summary}.`, hand.handId));
        hand.showdownRevealed = true;
        events.push({ kind: "showdown", text: "Showdown", at: this.now(), handId: hand.handId, reveal: revealed, winners });
        this.finishHand(state, winners, events);
    }
    finishHand(state, winners, events) {
        const hand = state.hand;
        if (hand === null)
            return;
        hand.finishedAt = this.now();
        // Return stacks to seats and record per-player deltas for the audit ledger.
        const results = [];
        for (const p of hand.players) {
            const seat = state.seats[p.seat];
            if (seat !== null && seat !== undefined)
                seat.stack = p.stack;
            results.push({
                playerId: p.playerId,
                seat: p.seat,
                stackBefore: p.startingStack ?? p.stack + p.committed,
                stackAfter: p.stack,
            });
        }
        const winById = new Map();
        for (const w of winners)
            winById.set(w.playerId, (winById.get(w.playerId) ?? 0) + w.amount);
        const handId = hand.handId;
        state.lastShowdown = {
            handNumber: hand.handNumber,
            handId,
            reveal: (events.find((e) => e.kind === "showdown")?.reveal ?? []),
            winners: winners.map((w) => ({ ...w })),
            at: hand.finishedAt,
        };
        state.hand = null;
        events.push({
            kind: "hand-end",
            text: `Hand #${hand.handNumber} finished.`,
            at: this.now(),
            handId,
            winners: [...winById.entries()].map(([playerId, amount]) => {
                const p = hand.players.find((x) => x.playerId === playerId);
                return { playerId, nickname: p?.nickname ?? playerId, amount, handLabel: "" };
            }),
            results,
        });
    }
    /** Compare two seats by clockwise order starting just LEFT of the dealer (odd-chip tiebreak). */
    seatOrderFrom(dealerSeat, a, b) {
        const distA = (a - dealerSeat - 1 + 100) % 100;
        const distB = (b - dealerSeat - 1 + 100) % 100;
        return distA - distB;
    }
    assertConservation(state, before) {
        const after = this.totalChips(state);
        if (before !== after) {
            throw new EngineError(`chip conservation violated: ${before} -> ${after}`, "conservation");
        }
    }
}
/**
 * Build main + side pots from per-player contributions, plus refunds of any
 * uncalled chips that sit above the top eligible contribution (they go back to
 * their contributors — this keeps chip conservation total even in the
 * defensive case). Folded/excluded players may contribute chips but are never
 * eligible. Every pot has at least one eligible player.
 */
export function buildPotsFrom(contributors) {
    const levels = [...new Set(contributors.map((c) => c.amount))].sort((a, b) => a - b);
    const pots = [];
    const refunds = [];
    let prev = 0;
    for (const level of levels) {
        const shares = contributors.map((c) => ({
            playerId: c.playerId,
            share: Math.max(0, Math.min(c.amount, level) - prev),
        }));
        const slice = shares.reduce((sum, s) => sum + s.share, 0);
        if (slice === 0)
            continue;
        const eligible = contributors.filter((c) => !c.folded && c.amount >= level).map((c) => c.playerId);
        if (eligible.length > 0) {
            pots.push({ amount: slice, eligiblePlayerIds: eligible });
        }
        else {
            for (const s of shares) {
                if (s.share > 0)
                    refunds.push({ playerId: s.playerId, amount: s.share });
            }
        }
        prev = level;
    }
    return { pots, refunds };
}
//# sourceMappingURL=engine.js.map