/**
 * Test helpers: an in-memory storage domain and a fake Cordis context with a
 * recordable timer, so the TableService is fully deterministic in tests.
 */
import type { KvTable } from "@deepseek-ai/dsh-storage-domain";

export class MemoryTable implements KvTable<string, unknown> {
  private readonly map = new Map<string, unknown>();

  get(key: string): unknown {
    return this.map.get(key);
  }

  entries(): IterableIterator<[string, unknown]> {
    return this.map.entries();
  }

  keys(): IterableIterator<string> {
    return this.map.keys();
  }

  get size(): number {
    return this.map.size;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.map.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.map.delete(key);
  }

  async update(key: string, fn: (current: unknown) => unknown): Promise<unknown> {
    const current = this.map.get(key);
    if (current === undefined) throw new Error("missing-key");
    const next = fn(current);
    this.map.set(key, next);
    return next;
  }
}

/** In-memory domain with the same shape the service expects (cast at use site). */
export class MemoryDomain {
  readonly name = "poker";
  readonly global = undefined;
  readonly tables: Record<string, MemoryTable> = {
    tables: new MemoryTable(),
    ledger: new MemoryTable(),
    players: new MemoryTable(),
  };

  table(name: string): KvTable<string, unknown> {
    const table = this.tables[name];
    if (table === undefined) throw new Error(`no such table ${name}`);
    return table as KvTable<string, unknown>;
  }

  async close(): Promise<void> {
    /* no-op */
  }
}

/** A controllable clock for deterministic time-based tests. */
export class FakeClock {
  private current: number;
  constructor(start = 1_000_000) {
    this.current = start;
  }
  now(): number {
    return this.current;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

interface RecordedTimeout {
  cb: () => void;
  delay: number;
  cancelled: boolean;
}

/** Fake Cordis context: a timer that records disposers and never really fires. */
export class FakeCtx {
  readonly timeouts: RecordedTimeout[] = [];
  readonly intervals: { cb: () => void; delay: number; cancelled: boolean }[] = [];

  readonly timer = {
    timeout: (cb: () => void, delay: number): (() => void) => {
      const record: RecordedTimeout = { cb, delay, cancelled: false };
      this.timeouts.push(record);
      return () => {
        record.cancelled = true;
      };
    },
    interval: (cb: () => void, delay: number): (() => void) => {
      const record = { cb, delay, cancelled: false };
      this.intervals.push(record);
      return () => {
        record.cancelled = true;
      };
    },
    throttle: () => () => {},
    debounce: () => () => {},
  };

  readonly logger = {
    info: (..._args: unknown[]) => {},
    error: (..._args: unknown[]) => {},
    warn: (..._args: unknown[]) => {},
    debug: (..._args: unknown[]) => {},
  };

  /** Fire the most recent un-cancelled timeout (tests the timeout path). */
  fireLatestTimeout(): void {
    const record = [...this.timeouts].reverse().find((t) => !t.cancelled);
    if (record === undefined) throw new Error("no pending timeout");
    record.cancelled = true;
    record.cb();
  }

  get pendingTimeoutCount(): number {
    return this.timeouts.filter((t) => !t.cancelled).length;
  }
}
