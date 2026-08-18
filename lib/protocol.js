/**
 * Wire protocol between the browser client and the host gateway.
 *
 * Client → server commands are validated server-side with zod. Server →
 * client views are built PER CONNECTION: a player's snapshot contains their
 * own hole cards and never anyone else's (see `buildTableView`).
 */
import { z } from "zod";
// ── client → server ─────────────────────────────────────────────────────────
export const clientMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("joinLobby"),
        requestId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("createTable"),
        requestId: z.string().min(1).max(64),
        name: z.string().trim().min(1).max(40),
        maxSeats: z.number().int().min(2).max(10),
    }),
    z.object({
        type: z.literal("joinTable"),
        requestId: z.string().min(1).max(64),
        tableId: z.string().min(1).max(64),
        nickname: z.string().trim().min(1).max(20),
        buyIn: z.number().int().min(1).max(1_000_000),
        /** Optional existing identity (playerId + token) to reuse the same wallet. */
        playerId: z.string().min(1).max(64).optional(),
        token: z.string().min(1).max(128).optional(),
    }),
    z.object({
        type: z.literal("addBot"),
        requestId: z.string().min(1).max(64),
        tableId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("leaveTable"),
        requestId: z.string().min(1).max(64),
        tableId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("action"),
        commandId: z.string().min(1).max(64),
        playerId: z.string().min(1).max(64),
        tableId: z.string().min(1).max(64),
        expectedVersion: z.number().int(),
        action: z.enum(["fold", "check", "call", "bet", "raise", "allin"]),
        amount: z.number().int().optional(),
    }),
    z.object({
        type: z.literal("resume"),
        requestId: z.string().min(1).max(64),
        playerId: z.string().min(1).max(64),
        token: z.string().min(1).max(128),
        tableId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("requestSnapshot"),
        requestId: z.string().min(1).max(64),
        tableId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("ping"),
        t: z.number().optional(),
    }),
]);
export function buildLobbyView(source) {
    return {
        tableId: source.tableId,
        name: source.name,
        maxSeats: source.maxSeats,
        playerCount: source.players.length,
        status: source.hasHand ? "playing" : "idle",
        smallBlind: source.smallBlind,
        bigBlind: source.bigBlind,
        buyIn: source.buyIn,
        createdAt: source.createdAt,
    };
}
/**
 * Build the snapshot for ONE viewer. The viewer's own hole cards are included;
 * every other player's hole cards are never present. Deck, tokens and
 * applied-command history are never present.
 */
export function buildTableView(state, viewerPlayerId, engine) {
    const hand = state.hand;
    const mySeat = state.seats.findIndex((s) => s?.playerId === viewerPlayerId);
    const viewerInHand = hand !== null && hand.players.some((p) => p.playerId === viewerPlayerId && !p.excluded);
    const community = hand?.community ?? [];
    const seats = [];
    const sbSeat = hand !== null ? dealerNext(state, state.dealerSeat, 1) : -1;
    const bbSeat = hand !== null ? dealerNext(state, state.dealerSeat, 2) : -1;
    for (let i = 0; i < state.maxSeats; i++) {
        const seat = state.seats[i];
        if (seat === null || seat === undefined) {
            seats.push({
                seat: i,
                playerId: "",
                nickname: "",
                stack: 0,
                bet: 0,
                folded: false,
                allIn: false,
                connected: false,
                isBot: false,
                isDealer: false,
                isSmallBlind: false,
                isBigBlind: false,
                isTurn: false,
                isMe: false,
                excluded: true,
            });
            continue;
        }
        const hp = hand?.players.find((p) => p.playerId === seat.playerId);
        const stack = hp !== undefined ? hp.stack : seat.stack;
        const bet = hp !== undefined ? hp.bet : 0;
        const folded = hp !== undefined ? hp.folded : false;
        const allIn = hp !== undefined ? hp.allIn : false;
        const excluded = hp === undefined || hp.excluded;
        const isTurn = hp !== undefined && hand !== null && hand.currentTurnSeat === i;
        const view = {
            seat: i,
            playerId: seat.playerId,
            nickname: seat.nickname,
            stack,
            bet,
            folded,
            allIn,
            connected: seat.connected,
            isBot: seat.isBot === true,
            isDealer: hand !== null && state.dealerSeat === i,
            isSmallBlind: hand !== null && sbSeat === i,
            isBigBlind: hand !== null && bbSeat === i,
            isTurn,
            isMe: seat.playerId === viewerPlayerId,
            excluded,
            lastAction: hp?.lastAction
                ? { type: hp.lastAction.type, amount: hp.lastAction.amount }
                : null,
        };
        if (viewerInHand && seat.playerId === viewerPlayerId && hp !== undefined) {
            view.holeCards = [...hp.holeCards];
        }
        seats.push(view);
    }
    return {
        tableId: state.tableId,
        name: state.name,
        version: state.version,
        handNumber: state.handNumber,
        maxSeats: state.maxSeats,
        smallBlind: state.smallBlind,
        bigBlind: state.bigBlind,
        buyIn: state.buyIn,
        phase: hand === null ? "idle" : hand.phase,
        dealerSeat: state.dealerSeat,
        seats,
        community,
        pots: hand === null ? [] : engine.buildPots(state),
        toCall: hand?.toCall ?? 0,
        minRaise: hand?.minRaise ?? state.bigBlind,
        currentTurnSeat: hand?.currentTurnSeat ?? -1,
        actionDeadlineAt: hand?.turnDeadlineAt ?? 0,
        mySeat: mySeat >= 0 ? mySeat : null,
        myHoleCards: viewerInHand ? (hand?.holeCardsByPlayer[viewerPlayerId] ?? null) : null,
        myLegalActions: mySeat >= 0 ? engine.legalActions(state, mySeat) : [],
        log: [...state.log].slice(-60),
        reveal: state.lastShowdown?.reveal ?? [],
        winners: state.lastShowdown?.winners ?? [],
        startedAt: state.createdAt,
    };
}
function dealerNext(state, from, step) {
    for (let i = 1; i <= state.maxSeats; i++) {
        const seat = (from + i + state.maxSeats) % state.maxSeats;
        const s = state.seats[seat];
        if (s !== null && s !== undefined && s.stack > 0 && --step === 0)
            return seat;
    }
    return -1;
}
//# sourceMappingURL=protocol.js.map