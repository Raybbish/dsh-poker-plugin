/**
 * Play Token ledger — immutable, integer-only, idempotent.
 *
 * Every wallet-affecting change is one entry. The wallet balance of a player
 * is derived by summing entries (excluding audit-only `hand-result` records,
 * which document table-internal chip movement and sum to zero per hand).
 *
 * Idempotency: `add()` is keyed on `transactionId`; re-adding the same id is
 * a no-op returning false. No floats anywhere — amounts are integers.
 */
import { z } from "zod";
export type LedgerReason = "grant" | "buy-in" | "cash-out" | "hand-result";
export interface LedgerEntry {
    /** Globally unique, idempotency key. */
    transactionId: string;
    playerId: string;
    /** Null for wallet-only events (initial grant). */
    tableId: string | null;
    /** Null outside a hand. */
    handId: string | null;
    /** Signed integer delta to the player's wallet (hand-result: table stack delta). */
    amount: number;
    reason: LedgerReason;
    createdAt: number;
}
export declare const ledgerEntrySchema: z.ZodObject<{
    transactionId: z.ZodString;
    playerId: z.ZodString;
    tableId: z.ZodNullable<z.ZodString>;
    handId: z.ZodNullable<z.ZodString>;
    amount: z.ZodNumber;
    reason: z.ZodEnum<{
        grant: "grant";
        "buy-in": "buy-in";
        "cash-out": "cash-out";
        "hand-result": "hand-result";
    }>;
    createdAt: z.ZodNumber;
}, z.core.$strip>;
export declare class LedgerError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
/** Whether an entry changes the player's wallet (audit-only hand results do not). */
export declare function walletDelta(entry: LedgerEntry): number;
export declare class Ledger {
    private readonly entries;
    /** playerId → sum of wallet deltas. */
    private readonly balances;
    /** Rebuild balances from entries (used after loading persisted entries). */
    rebuild(entries: Iterable<LedgerEntry>): void;
    /**
     * Append one entry. Idempotent: an existing transactionId is ignored and
     * false is returned. Throws on non-integer amounts.
     */
    add(entry: LedgerEntry): boolean;
    /** Current wallet balance of a player (0 when unknown). */
    balanceOf(playerId: string): number;
    has(transactionId: string): boolean;
    entriesFor(playerId: string): LedgerEntry[];
    all(): LedgerEntry[];
    get size(): number;
}
