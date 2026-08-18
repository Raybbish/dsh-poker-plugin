/**
 * Texas Hold'em engine — an explicit, deterministic state machine.
 *
 * The engine owns EVERY rule: blind posting, dealing, action legality,
 * minimum raises, all-in semantics (including the "short all-in does not
 * reopen betting" rule and the big-blind option), side pots, showdown
 * evaluation, timeout auto-actions and the hand lifecycle. It never touches
 * the network, DSH or the UI, and it never leaks private cards into events
 * or logs.
 *
 * Invariants (asserted by tests):
 *  - sum(seat stacks) + sum(pots) is constant across a hand
 *    (modulo buy-in/cash-out, which are ledger events outside the engine);
 *  - every accepted action is legal for the acting player;
 *  - a folded or excluded player never appears in a pot eligibility set;
 *  - every pot has at least one eligible player.
 */
import { ActionType, LegalAction, Pot, TableState } from "./types.js";
import { Rng } from "./cards.js";
export declare class EngineError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export interface RevealEntry {
    playerId: string;
    nickname: string;
    /** Empty when the hand was mucked (single contender). */
    cards: string[];
    handLabel: string;
}
export interface WinnerEntry {
    playerId: string;
    nickname: string;
    amount: number;
    handLabel: string;
}
export interface EngineEvent {
    kind: "hand-start" | "action" | "street" | "showdown" | "hand-end" | "log";
    text: string;
    at: number;
    handId?: string;
    /** Public action info (no private cards). */
    action?: {
        playerId: string;
        type: ActionType;
        amount: number;
        allIn: boolean;
    };
    /** Public showdown reveal (cards are public at showdown by rule). */
    reveal?: RevealEntry[];
    winners?: WinnerEntry[];
    /** Per-player table-stack deltas across the hand (for the audit ledger). */
    results?: {
        playerId: string;
        seat: number;
        stackBefore: number;
        stackAfter: number;
    }[];
}
export interface EngineOutcome {
    events: EngineEvent[];
    changed: boolean;
}
export interface EngineOptions {
    rng?: Rng;
    now?: () => number;
}
export declare class PokerEngine {
    private readonly rng;
    private readonly now;
    constructor(options?: EngineOptions);
    /** Start a new hand on `state` when at least two players can participate. */
    startHand(state: TableState): EngineOutcome;
    /** Legal actions for the player at `seat`, or [] when it is not their turn. */
    legalActions(state: TableState, seat: number): LegalAction[];
    /**
     * Apply one player action. Throws EngineError when illegal. Mutates `state`
     * (including street advances and showdowns when the action closes a round).
     */
    applyAction(state: TableState, seat: number, type: ActionType, amount?: number): EngineOutcome;
    /**
     * Fold a player who left mid-hand (works even when it is not their turn).
     * Their committed chips stay in the pots. Advances the round/hand when the
     * fold closes it.
     */
    removePlayer(state: TableState, playerId: string, reason: string): EngineOutcome;
    /**
     * Timeout rule (deterministic and testable): when the acting player's
     * deadline has passed, auto-fold when facing a bet, otherwise check.
     */
    autoAct(state: TableState, at?: number): EngineOutcome;
    /** The displayed pots (main + side) derived from committed + current bets. */
    buildPots(state: TableState): Pot[];
    /**
     * Total chips on the table (stacks + everything committed). Handles players
     * seated but not in the current hand (e.g. joined mid-hand): their seat
     * stack counts directly.
     */
    totalChips(state: TableState): number;
    private logEvent;
    private wager;
    private postBlind;
    private requireInteger;
    private indexOf;
    private playerAtSeat;
    private nextOccupiedSeat;
    /** First non-folded, non-all-in, non-excluded player after `from` (clockwise). */
    private firstActiveAfter;
    private armTurn;
    private advanceIfRoundClosed;
    private completeStreet;
    private resetRound;
    /** Deal the rest of the board when everyone is all-in. */
    private runOut;
    private endHandBySurvivor;
    private runShowdown;
    private finishHand;
    /** Compare two seats by clockwise order starting just LEFT of the dealer (odd-chip tiebreak). */
    private seatOrderFrom;
    private assertConservation;
}
/**
 * Build main + side pots from per-player contributions, plus refunds of any
 * uncalled chips that sit above the top eligible contribution (they go back to
 * their contributors — this keeps chip conservation total even in the
 * defensive case). Folded/excluded players may contribute chips but are never
 * eligible. Every pot has at least one eligible player.
 */
export declare function buildPotsFrom(contributors: {
    playerId: string;
    amount: number;
    folded: boolean;
}[]): {
    pots: Pot[];
    refunds: {
        playerId: string;
        amount: number;
    }[];
};
