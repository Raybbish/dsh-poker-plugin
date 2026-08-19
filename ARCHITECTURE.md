# dsh-poker — Architecture

## 1. Overview & trust boundary

```
 browser window (client half)              dsh host process (host half)
┌──────────────────────────────┐          ┌──────────────────────────────────┐
│ lib/client.js                │          │ dsh-poker (cordis plugin row)     │
│  lobby / table UI            │  WS      │  /poker/ws  PokerGateway          │
│  session in localStorage     │ ───────► │  TableService (authoritative)     │
│  renders SERVER snapshots    │ ◄─────── │  PokerEngine (pure rules)         │
│  sends commands only         │  JSON    │  Ledger (Play Tokens)             │
└──────────────────────────────┘          │  storage-domain unit "poker"      │
                                          └──────────────────────────────────┘
```

**Trust boundary**: the host is the *single source of truth*. It owns the deck,
the shuffle, hole cards, pot math, legality of every action, the ledger and
the timeline. The client is a dumb view: it renders snapshots and sends
commands; it never computes a rule and never sees another player's unrevealed
hole cards. A malicious/buggy client can at worst send invalid commands —
every one is schema-validated and rule-checked server-side and rejected.

The browser bundle is plain JavaScript in the harness `__ModuleLoader__`
format (served at `/plugins/dsh-poker/client.js`); the host half is
TypeScript compiled to ESM, mounted by one `cordis.patch.yml` row.

## 2. Module map

| module | responsibility | DSH dependency |
| --- | --- | --- |
| `src/engine/*` | pure poker: cards, evaluator, state machine; public `./engine` export | none |
| `src/ledger.ts` | immutable Play Token ledger | zod |
| `src/protocol.ts` | wire schemas + per-player view builders | zod |
| `src/host/table-service.ts` | tables, wallets, commands, timers, persistence | `ctx.timer` |
| `src/host/gateway.ts` | WebSocket transport, auth, broadcast | `ctx.webServer` |
| `src/host/bot-controller.ts` | optional AI decisions + legal-action validation | host-side `fetch` |
| `src/host/persistence.ts` | storage-domain spec (`poker` unit) | `ctx.storageDomain` |
| `src/host/index.ts` | cordis plugin entry (`name/inject/apply`) | cordis |
| `src/client/entry.ts`, `i18n.ts`, `store.ts`, `components/*`, `poker.css` | localized browser UI source | seed words `react` |

Lifecycle: the plugin `apply()` opens the storage domain, boots the
`TableService`, starts `BotController` behind a configurable decision-provider
seam, and starts the gateway. An environment key configures that provider at
boot; a same-origin loopback browser may replace it at runtime. UI-supplied
credentials live only in the provider closure and are excluded from snapshots,
storage, logs and the ledger. Every resource (domain handle, upgrade route,
change subscription, heartbeat interval, sockets, turn timers and bot
schedules) is registered through `ctx.effect` disposers and released on
unmount.

The browser half follows the same lifecycle contract through a two-method host
surface (`get` + `effect`): CSS is installed only while mounted, and unmount
cancels reconnect timers, detaches WebSocket callbacks and closes the socket.

`scripts/build.mjs` bundles the client TS/TSX/CSS graph from
`src/client/entry.ts` and wraps it as the distributed `lib/client.js`
`__ModuleLoader__` module.

## 3. Distribution (profile bundle)

The package declares itself a **profile bundle** the same way the shipped
`@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-web-app` bundles do:

```json
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
```

`dsh plugin --profile web add <pkg>` (a thin pnpm forwarder) reconciles the
profile manifest afterwards: a dependency whose `package.json` declares
`dsh.bundle.patch` is appended to `dsh.profile.bundles`, so the bundle's
`cordis.patch.yml` — which contains the single `- insert: [poker row]` — is
composed as a boot layer automatically. Users never edit `cordis.patch.yml`;
`scripts/install-test.sh` verifies the whole flow (npm pack → fresh DSH_HOME →
tarball install → `--dump-config` asserts the poker row appears exactly once →
boot a temporary `dsh web` → run the smoke test).

## 4. Poker engine (state machine)

`PokerEngine` operates on `TableState` and an explicit `HandState`:

```
idle ──(≥2 connected, incl. ≥1 human)──► preflop ──► flop ──► turn ──► river ──► showdown
  ▲                                │  blinds + deal                    │
  └──────────(hand end)────────────┴───────────────────────────────────┘
```

- **Explicit rules in the engine only**: blind posting (short stacks go
  all-in; heads-up dealer = SB), the big-blind option, minimum-raise
  progression (`minRaise` grows by the last full raise), the "short all-in
  raise does not reopen betting" rule, `acted` tracking per street, round
  closure when every active player has matched `toCall`.
- **Side pots**: `buildPotsFrom` slices contributions by level; folded
  players contribute chips but are never eligible; chips above the top
  eligible level are *refunded* to their contributors (uncalled bets), which
  keeps conservation total. Odd chips in split pots go to the first player
  left of the button.
- **All-in runouts**: when every remaining player is all-in, the board is
  dealt to the river and the hand goes straight to showdown.
- **Showdown**: reveal only for multi-way pots (public by rule); a lone
  contender is mucked with no card reveal. Winners' hole cards never appear
  in the event log before the showdown event.
- **Timeout rule** (deterministic and testable): when the acting player's
  deadline passes, auto-**fold** if facing a bet, otherwise auto-**check**.
- **Conservation invariant**: `totalChips(table)` (live stacks + street bets +
  committed) is asserted before/after every engine mutation.

Security: the deck is shuffled with `node:crypto` randomBytes + rejection
sampling (`CryptoRng`) — never `Math.random`. Hole cards and the deck exist
only in `HandState` on the host.

Production uses `CryptoRng`; tests and external simulators may inject
`seededRng` through `PokerEngine` or `TableService` for reproducible runs.

## 5. Ledger (Play Tokens)

Every wallet-affecting change is one immutable entry:

```ts
{ transactionId, playerId, tableId, handId, amount, reason, createdAt }
// amount: signed integer; reasons: grant | buy-in | cash-out | hand-result
```

- `grant` (+10,000) on first identity use; `buy-in` (−n) moves wallet→table;
  `cash-out` (+n) moves table→wallet; `hand-result` records each player's
  table-stack delta per hand (audit-only, sums to zero per hand, so `handId`
  is populated).
- **Idempotency**: `Ledger.add` is keyed on `transactionId`; a duplicate is a
  no-op returning `false`. Hand-result ids are `hand-<handId>-<playerId>`.
- **Integers only**: non-integer amounts are rejected.
- **Conservation**: `totalSystemChips() = Σ wallet deltas + Σ table escrow`
  is constant (grants are the only creation; everything else moves chips).

## 6. Command protocol (WebSocket, `/poker/ws`)

Client → server (zod-validated on the host):

| message | purpose |
| --- | --- |
| `joinLobby` | subscribe to the lobby view |
| `createTable {name, maxSeats}` | new table |
| `joinTable {tableId, nickname, buyIn, playerId?, token?}` | seat a player (reuse identity when token provided) |
| `addBot {tableId}` | add one server-controlled AI seat (requires a seated human and configured provider) |
| `leaveTable {tableId}` | fold mid-hand / leave; cash out at hand end |
| `action {commandId, playerId, tableId, expectedVersion, action, amount?}` | one poker action |
| `resume {playerId, token, tableId}` | reconnect: reattach seat, restore snapshot |
| `requestSnapshot {tableId}` | force re-sync |
| `ping` | heartbeat |

Server → client: `welcome`, `lobby`, `joined` (identity issued once),
`snapshot` (per-player view), `wallet` (pushed on change), `error`, `pong`.

**Consistency**: accepted table mutations bump `table.version`. Poker `action`
messages carry the version the client last saw; a mismatch is rejected with
`stale-version` and the client re-syncs from the next pushed snapshot. Their
`commandId` values are deduplicated per player (bounded history), so retrying
an `action` after a dropped response never applies that action twice. Other
mutating requests (`createTable`, `joinTable`, `addBot`, `leaveTable` and
`resume`) use `requestId` for response correlation; they do not share the
action command's version fence or deduplication history. All mutations are
processed through a per-service serialized queue (mutation → durable write →
broadcast), so two poker actions racing on the same version cannot both apply
and chip math stays atomic.

**Privacy**: snapshots are built per connection by `buildTableView(state,
viewerId, engine)` — the viewer's own hole cards are included, every other
seat's `holeCards` field is absent, and `deck`/`token`/applied-command history
never leave the host. Identity is a per-player random token checked on every
`resume`; the gateway also binds each socket to its authenticated `playerId`.

**Identity registry**: the durable `players` table (playerId → token) is the
ONLY authoritative token store. `joinTable` identity reuse verifies the
supplied token against the registry even when the player is not seated at the
target table — a `playerId` is public (it appears in snapshots), so without
this check anyone could impersonate a seated player and spend their wallet.
`init()` reconciles pre-registry seats into the registry.

**Reconnect**: the client stores `{playerId, token, tableId}` in
`localStorage`; on WS open it sends `resume`, and the server marks the seat
connected and re-sends the snapshot (mid-hand included). A disconnected
acting player is auto-actioned by the turn timer.

**Spectating** (UI v2): `requestSnapshot {tableId}` doubles as a public
subscription — the gateway sets the connection's table view to that table and
pushes snapshots. The view is built for the requester's identity when seated,
or for viewer `""` when spectating, so a spectator receives only public
information (seats, stacks, community, log) and never any hole cards. The wire
format is unchanged; `joinLobby` clears the subscription.

## 7. Persistence

`storage-domain` unit `poker` (JSON backend at `$DSH_HOME/storages/poker.json`):
- table `tables`: one record per table — full state incl. seats, live hand
  (deck + hole cards), log, applied-command history, version.
- table `ledger`: one record per ledger entry (immutable log).
- table `players`: one durable identity record per player (`playerId` → token,
  nickname and creation time).

On boot the service replays the ledger into balances and re-hydrates every
table; all players start disconnected, turn timers are re-armed (already-past
deadlines auto-act through the normal path). Records are replaced wholesale
after each accepted command; writes are serialized per service.

## 8. Disconnect / leave rules (tested)

| situation | rule |
| --- | --- |
| socket closes while another human remains | seat marked disconnected; turn timer still auto-acts |
| final human disconnects | freeze the live hand, bots and timers for resume; lobby status becomes `paused` |
| final human deliberately leaves | settle the abandoned hand without more AI calls, cash out the human and return the table to `idle` |
| acting player's deadline passes | auto-fold if `toCall > 0`, else auto-check |
| reconnect (`resume`) | seat reattached; `leaving` cancelled |
| leave between hands | seat freed immediately, stack cashed out |
| leave mid-hand | player folded; committed chips stay in the pot; remaining stack cashed out when the hand ends |
| hand ends while disconnected | seat freed and cashed out at hand end |
| player broke (0 chips) | excluded from new hands; rebuy = leave + rejoin (same wallet) |
| `dsh web` restart | tables restored; nobody is connected; hands resume per the timeout rules |

## 9. Tests

- `test/frontend.test.ts` — renders the real browser bundle components with
  react-dom/server: loading / empty / reconnecting / spectating / error
  states, my-turn actions, waiting and showdown banners, sidebar entry,
  seat-ring geometry (desktop + compact), and CSS guards (breakpoints exist,
  the mobile block never shrinks fonts below 11 px, reduced-motion disables
  all animations).
- `test/ui-layout.test.mjs` — boots the real distributed plugin in a browser,
  checks language persistence, action submission and seat containment, and
  captures desktop, tablet and mobile screenshots.
- `test/bot.test.ts` — authorization for adding bots, multiple AI seats,
  provider request shape, legal-action clamping, safe fallbacks, pause status
  and abandoned-hand settlement.
- `test/gateway.test.ts` — same-origin browser handshakes, cross-origin and
  malformed-origin rejection, and non-browser client compatibility.
- `test/evaluator.test.ts` — table-driven ranking (royal flush → high card),
  ties, 7-card best-5, labels.
- `test/engine.test.ts` — action order (3-handed, heads-up), illegal actions,
  min-raise progression, BB option, short all-in vs full raise reopen, side
  pots, uncalled refunds, all-in runout, survivor win, timeout auto-actions,
  mid-hand leave, broke exclusion, odd-chip tiebreak, card-leak-free logs,
  conservation.
- `test/ledger.test.ts` — idempotency, integer enforcement, wallet derivation,
  rebuild-from-persisted.
- `test/service.test.ts` — version fencing, commandId dedup, snapshot privacy,
  disconnect/resume, timeout auto-fold via the timer path, mid-hand leave +
  cash-out, restart recovery, conservation across joins/hands/leaves.
- `test/full-game.test.ts` — seeded random multi-hand games (with rebuys) and
  a scripted raise/all-in/side-pot hand; global conservation asserted.
- `test/simulation.test.ts` — 500 seeded, randomized 2–6 player hands; every
  action checks legal progress, termination, chip conservation and per-viewer
  card/token/deck privacy.
- `test/package-exports.test.ts` — imports the packaged `dsh-poker/engine`
  subpath and verifies its supported entry points.
- `scripts/smoke-test.mjs` — end-to-end against a real `dsh web` over WS:
  lobby, join, play, privacy, stale version, resume, forged token, cash-out.

## 10. Known limitations

- **Single process / single host**: tables live in one `dsh web` process
  (persisted across restarts, but not clustered).
- **No durable hand replay/export**: the UI has a localized recent public-log
  drawer, but snapshots expose only the latest 60 of the table's bounded 100
  log entries. There is no per-hand archive, previous-hand replay or HHV export.
- **Identity is token-only**: anyone who copies a token can act as that
  player (localhost-only trust model — acceptable for a Play Token MVP). The
  registry prevents forged-identity joins; token theft itself is out of scope.
- **No rebuy button in the UI**: a broke player must leave and rejoin.
- **Server restart mid-hand**: the hand resumes with the timeout rules;
  players who don't reconnect before the hand ends are cashed out at hand end
  (documented rule).
- **Showdown reveal**: multi-way showdowns reveal contenders' hands (standard
  poker rule) — this is a *reveal*, not a leak; unrevealed hole cards are
  never sent early or to the wrong player.

## 11. Reliability audit (TDD)

`test/audit.test.ts` was written fail-first against the shipped implementation;
every finding below has a regression test that failed before the fix and
passes after it. `scripts/smoke-test.mjs` carries the same checks end-to-end
over a real WebSocket server (22 checks).

| # | finding | severity | test (failing pre-fix) | fix |
| --- | --- | --- | --- | --- |
| 1 | `joinTable` with a known `playerId` + forged token was accepted when the victim was not seated at the target table — anyone could seat as the victim and spend their wallet | **critical** | `audit: attacker cannot impersonate a seated player…` / `real owner can rejoin…` / `impersonation still rejected after a server restart…` | durable `players` identity registry; token verified on every reuse; seats reconciled on `init()` |
| 2 | Ledger writes (grant/buy-in/cash-out/hand-result) and cash-out table writes were fire-and-forget — a crash between the in-memory balance update and the disk write could re-inflate wallets after restart | **high** | `audit: a buy-in is only acknowledged after its ledger entry is durable…` (blocked-domain test) | `recordLedger`/`cashOutSeat` are awaited inside the serialized queue: nothing is acknowledged before it is durable |
| 3 | Two clients racing the same `expectedVersion` | verified | `audit: two clients acting with the same expectedVersion…` | already correct (serialized queue + fencing) — locked in by test |
| 4 | Hidden-card leakage via snapshots/logs/errors | verified | `audit: no opponent hole card ever appears in any per-player message…` (every snapshot of a live hand for both players over a full game) | already correct — locked in by test |
| 5 | Disconnect → hand end → cash-out; duplicate leave/resume | verified | `audit: disconnected player is cashed out exactly once…` / `duplicate leaveTable…` / `duplicate resume…` | already correct — locked in by test |
| 6 | Gateway authorization (unauthenticated action, cross-player action, forged join over the wire) | verified | smoke `unauthenticated action rejected` / `forged identity rejected by joinTable` | already correct — locked in by test |

## 12. Next steps

- Durable per-hand history + replay/HHV export; table deletion and admin;
  rebuy UI; sound; additional locales beyond Chinese/English; leaderboards
  over the ledger.
