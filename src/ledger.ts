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
  constructor(
    message: string,
    readonly code: string = "ledger-error",
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

/** Whether an entry changes the player's wallet (audit-only hand results do not). */
export function walletDelta(entry: LedgerEntry): number {
  return entry.reason === "hand-result" ? 0 : entry.amount;
}

export class Ledger {
  private readonly entries = new Map<string, LedgerEntry>();
  /** playerId → sum of wallet deltas. */
  private readonly balances = new Map<string, number>();

  /** Rebuild balances from entries (used after loading persisted entries). */
  rebuild(entries: Iterable<LedgerEntry>): void {
    this.entries.clear();
    this.balances.clear();
    for (const entry of entries) {
      if (!Number.isInteger(entry.amount)) throw new LedgerError(`non-integer amount ${entry.amount}`, "non-integer");
      if (this.entries.has(entry.transactionId)) throw new LedgerError(`duplicate transactionId ${entry.transactionId}`, "duplicate");
      this.entries.set(entry.transactionId, entry);
      this.balances.set(entry.playerId, (this.balances.get(entry.playerId) ?? 0) + walletDelta(entry));
    }
  }

  /**
   * Append one entry. Idempotent: an existing transactionId is ignored and
   * false is returned. Throws on non-integer amounts.
   */
  add(entry: LedgerEntry): boolean {
    if (!Number.isInteger(entry.amount)) throw new LedgerError(`non-integer amount ${entry.amount}`, "non-integer");
    if (this.entries.has(entry.transactionId)) return false;
    this.entries.set(entry.transactionId, entry);
    this.balances.set(entry.playerId, (this.balances.get(entry.playerId) ?? 0) + walletDelta(entry));
    return true;
  }

  /** Current wallet balance of a player (0 when unknown). */
  balanceOf(playerId: string): number {
    return this.balances.get(playerId) ?? 0;
  }

  has(transactionId: string): boolean {
    return this.entries.has(transactionId);
  }

  entriesFor(playerId: string): LedgerEntry[] {
    return [...this.entries.values()].filter((e) => e.playerId === playerId);
  }

  all(): LedgerEntry[] {
    return [...this.entries.values()].sort((a, b) => a.createdAt - b.createdAt || a.transactionId.localeCompare(b.transactionId));
  }

  get size(): number {
    return this.entries.size;
  }
}
