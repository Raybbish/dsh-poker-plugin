/**
 * Persistence: the `poker` storage domain (tables + immutable ledger).
 *
 * The JSON backend (already mounted by the web profile as `storage-domain`
 * with `backend: json` at `$DSH_HOME/storages`) stores one file per domain
 * unit. The ledger is append-only by construction; table records are replaced
 * wholesale after each accepted command.
 */
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import { z } from "zod";
import { ledgerEntrySchema } from "../ledger.js";
const cardSchema = z.object({
    rank: z.number().int().min(2).max(14),
    suit: z.number().int().min(0).max(3),
});
const actionTypeSchema = z.enum(["fold", "check", "call", "bet", "raise", "allin"]);
const seatSchema = z.object({
    playerId: z.string().min(1),
    nickname: z.string().min(1),
    token: z.string().min(1),
    stack: z.number().int(),
    connected: z.boolean(),
    isBot: z.boolean().optional(),
    joinedAt: z.number().int(),
    leaving: z.boolean().optional(),
});
const potSchema = z.object({
    amount: z.number().int(),
    eligiblePlayerIds: z.array(z.string()),
});
const handPlayerSchema = z.object({
    seat: z.number().int(),
    playerId: z.string().min(1),
    nickname: z.string().min(1),
    holeCards: z.array(cardSchema),
    startingStack: z.number().int(),
    stack: z.number().int(),
    bet: z.number().int(),
    committed: z.number().int(),
    folded: z.boolean(),
    allIn: z.boolean(),
    acted: z.boolean(),
    excluded: z.boolean(),
    lastAction: z
        .object({ type: actionTypeSchema, amount: z.number().int(), at: z.number().int() })
        .optional(),
});
const handSchema = z.object({
    handId: z.string().min(1),
    handNumber: z.number().int(),
    phase: z.enum(["preflop", "flop", "turn", "river", "showdown"]),
    deck: z.array(cardSchema),
    holeCardsByPlayer: z.record(z.string(), z.array(cardSchema)),
    community: z.array(cardSchema),
    players: z.array(handPlayerSchema),
    pots: z.array(potSchema),
    toCall: z.number().int(),
    minRaise: z.number().int(),
    currentTurnSeat: z.number().int(),
    turnDeadlineAt: z.number().int(),
    lastAggressorIdx: z.number().int(),
    street: z.number().int(),
    startedAt: z.number().int(),
    finishedAt: z.number().int().optional(),
    showdownRevealed: z.boolean().optional(),
});
const logEntrySchema = z.object({
    at: z.number().int(),
    text: z.string(),
    handId: z.string().optional(),
});
const revealInfoSchema = z.object({
    playerId: z.string(),
    nickname: z.string(),
    cards: z.array(z.string()),
    handLabel: z.string(),
});
const winnerInfoSchema = z.object({
    playerId: z.string(),
    nickname: z.string(),
    amount: z.number().int(),
    handLabel: z.string(),
});
const showdownResultSchema = z.object({
    handNumber: z.number().int(),
    handId: z.string(),
    reveal: z.array(revealInfoSchema),
    winners: z.array(winnerInfoSchema),
    at: z.number().int(),
});
/** Durable identity record: the ONLY place a player's token is authoritative. */
const playerRecordSchema = z.object({
    playerId: z.string().min(1),
    token: z.string().min(1),
    nickname: z.string().min(1),
    createdAt: z.number().int(),
});
const tableStateSchema = z.object({
    tableId: z.string().min(1),
    name: z.string().min(1),
    maxSeats: z.number().int().min(2).max(10),
    smallBlind: z.number().int(),
    bigBlind: z.number().int(),
    buyIn: z.number().int(),
    version: z.number().int(),
    createdAt: z.number().int(),
    seats: z.array(seatSchema.nullable()),
    dealerSeat: z.number().int(),
    hand: handSchema.nullable(),
    handNumber: z.number().int(),
    log: z.array(logEntrySchema),
    appliedCommands: z.record(z.string(), z.array(z.string())),
    actionTimeoutMs: z.number().int(),
    lastShowdown: showdownResultSchema.nullable(),
});
export const pokerDomainSpec = defineDomain({
    name: "poker",
    version: 1,
    tables: {
        tables: domainTable(tableStateSchema),
        ledger: domainTable(ledgerEntrySchema),
        players: domainTable(playerRecordSchema),
    },
});
export { tableStateSchema };
//# sourceMappingURL=persistence.js.map