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
export const ledgerEntrySchema = z.object({
    transactionId: z.string().min(1),
    playerId: z.string().min(1),
    tableId: z.string().nullable(),
    handId: z.string().nullable(),
    amount: z.number().int(),
    reason: z.enum(["grant", "buy-in", "cash-out", "hand-result"]),
    createdAt: z.number().int(),
});
export class LedgerError extends Error {
    code;
    constructor(message, code = "ledger-error") {
        super(message);
        this.code = code;
        this.name = "LedgerError";
    }
}
/** Whether an entry changes the player's wallet (audit-only hand results do not). */
export function walletDelta(entry) {
    return entry.reason === "hand-result" ? 0 : entry.amount;
}
export class Ledger {
    entries = new Map();
    /** playerId → sum of wallet deltas. */
    balances = new Map();
    /** Rebuild balances from entries (used after loading persisted entries). */
    rebuild(entries) {
        this.entries.clear();
        this.balances.clear();
        for (const entry of entries) {
            if (!Number.isInteger(entry.amount))
                throw new LedgerError(`non-integer amount ${entry.amount}`, "non-integer");
            if (this.entries.has(entry.transactionId))
                throw new LedgerError(`duplicate transactionId ${entry.transactionId}`, "duplicate");
            this.entries.set(entry.transactionId, entry);
            this.balances.set(entry.playerId, (this.balances.get(entry.playerId) ?? 0) + walletDelta(entry));
        }
    }
    /**
     * Append one entry. Idempotent: an existing transactionId is ignored and
     * false is returned. Throws on non-integer amounts.
     */
    add(entry) {
        if (!Number.isInteger(entry.amount))
            throw new LedgerError(`non-integer amount ${entry.amount}`, "non-integer");
        if (this.entries.has(entry.transactionId))
            return false;
        this.entries.set(entry.transactionId, entry);
        this.balances.set(entry.playerId, (this.balances.get(entry.playerId) ?? 0) + walletDelta(entry));
        return true;
    }
    /** Current wallet balance of a player (0 when unknown). */
    balanceOf(playerId) {
        return this.balances.get(playerId) ?? 0;
    }
    has(transactionId) {
        return this.entries.has(transactionId);
    }
    entriesFor(playerId) {
        return [...this.entries.values()].filter((e) => e.playerId === playerId);
    }
    all() {
        return [...this.entries.values()].sort((a, b) => a.createdAt - b.createdAt || a.transactionId.localeCompare(b.transactionId));
    }
    get size() {
        return this.entries.size;
    }
}
//# sourceMappingURL=ledger.js.map