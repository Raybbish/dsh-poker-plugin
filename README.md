# `dsh-poker` — Poker Plugin for DSH

A community-built **game center** for the DSH Web UI (`dsh web`): a local,
multiplayer **Texas Hold'em MVP** playable from multiple browser windows on
the same machine. Play Tokens only — no wallet, no real money, no public
network.

> **Unofficial community plugin.** This project is not affiliated with,
> sponsored by, or endorsed by DeepSeek. It uses its own name and visual
> identity. No deposits, prizes, withdrawals, cash-out, or real-money wagering
> are supported.

```
┌──────────────────────────────────────────────────────────────┐
│ dsh web (127.0.0.1:3080)                                     │
│  sidebar footer:  ♠ Poker   ← game center entry              │
│  overlay:         lobby → dark poker table                    │
│                                                              │
│  Host (same process)                                         │
│   dsh-poker (cordis plugin)                                  │
│    ├─ TableService   authoritative state, commands, timers   │
│    ├─ PokerEngine    pure Texas Hold'em state machine        │
│    ├─ Ledger         Play Token ledger (immutable, integer)  │
│    ├─ storage-domain poker unit  ($DSH_HOME/storages/poker.json) │
│    └─ /poker/ws      WebSocket gateway (realtime)            │
└──────────────────────────────────────────────────────────────┘
```

## Features (MVP)

- **Lobby** — create a table (2–10 seats), join by list or by room ID (copy
  button), nickname + buy-in, wallet display.
- **Chinese / English modes** — switch the complete interface from the room
  bar, lobby and actions through results, errors and hand history. The browser
  remembers the selected language.
- **Expressive table UI** — the sidebar and table expose the host Agent's
  thinking / idle state; AI seats have stable visual characters and localized
  thought lines across idle, observing, thinking, acting and reacting states.
  Dealing, chips moving to the pot, folding, pot changes, turns and winner
  payouts are animated while still respecting `prefers-reduced-motion`.
- **Complete raise sizing** — choose minimum, half-pot, three-quarter-pot,
  pot or maximum, drag the legal range slider, or enter an exact raise-to
  amount. Every value is normalized to the server-provided legal bounds; on
  mobile the controls become a touch-friendly bottom sheet.
- **Optional AI players** — add one or more server-side bots before or during
  a game. Each bot calls a user-configured API with only its private player
  view; every
  response is validated against the engine's legal actions before it applies.
  When the last human deliberately leaves, the current hand is settled without
  further AI requests and the table returns to idle. A dropped connection
  pauses the hand for resumption; no AI requests or timeout actions run while
  no human is connected.
- **Real poker rules** — blinds 5/10, hole cards, flop/turn/river, showdown,
  fold/check/call/bet/raise/all-in, minimum-raise progression, side pots,
  uncalled-bet refunds, odd-chip tiebreak, big-blind option, heads-up rules,
  short-all-in "does not reopen betting" rule.
- **Play Tokens** — each new player gets **10,000**; buy-in defaults to
  **1,000**. Every wallet change is an immutable ledger entry
  (`transactionId, playerId, tableId, handId, amount, reason, createdAt`),
  integer-only, idempotent. Hand results are recorded as audit entries.
- **Realtime & consistency** — server-authoritative state, poker-action
  `commandId` dedup, `expectedVersion` fencing, WebSocket reconnect with
  snapshot resume, heartbeat, per-player private views (nobody sees anyone
  else's unrevealed hole cards), crypto-secure shuffle (never `Math.random`).
- **Disconnect rules** — while another human remains connected, the acting
  player auto-folds when facing a bet after the 30 s deadline, otherwise
  auto-checks. If the final human disconnects, the hand freezes for resume;
  seats persist across refreshes.
- **Durable state** — tables, player identities, wallets and the ledger survive
  `dsh web` restarts via the DSH storage domain.

## Requirements

- DeepSeek Harness `dsh` ≥ `0.1.0-rc.7`, run the normal way: no global
  install needed, `npx @deepseek-ai/dsh` resolves it.
- `pnpm` on `PATH` (the `dsh plugin` command forwards to pnpm).

## Install

The package is a **profile bundle** (`package.json` → `dsh.bundle.patch`, the
same mechanism `@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-web-app` use):
installing it with `dsh plugin` automatically appends it to the web profile's
`dsh.profile.bundles`, and its `cordis.patch.yml` **auto-inserts the poker
loader row** at every boot. No manual `cordis.patch.yml` editing — ever.

```bash
# 1. pack the plugin (a tarball is the distributable artifact)
npm pack

# 2. install it into the web profile (from this directory, or point at the tarball)
npx @deepseek-ai/dsh plugin --profile web add -w file:/absolute/path/to/dsh-poker
# or: npx @deepseek-ai/dsh plugin --profile web add -w file:./dsh-poker-0.1.0.tgz

# 3. restart the web UI (npx is the supported launcher)
npx @deepseek-ai/dsh web
```

That's it: the profile's `dsh.profile.bundles` now includes `dsh-poker` and
`--dump-config` shows exactly one `poker` loader row (verified by
`npm run test:install`). To tune the game config from a profile, override the
row by id in `~/.dsh/profiles/web/cordis.patch.yml` (a patch, not a second
insert):

```yaml
- id: poker
  config:
    actionTimeoutMs: 15000
```

> A running `dsh web` hot-applies profile-patch changes, but a restart is the
> supported way to pick up a new client bundle in `window.__DSH_BOOT__`.

## Play locally (multi-window multiplayer)

1. Open `http://127.0.0.1:3080` in **two browser windows** (or a window +
   an incognito window).
2. Click **♠ Poker** in the sidebar footer of both windows.
3. Window 1: enter a nickname, **Create table**. Window 2: enter a different
   nickname, then **Join** the table from the list (or copy the room ID and
   paste it into "Join by room ID").
4. A hand starts as soon as two players are seated and connected. Act when it
   is your turn; the countdown drives auto-fold/check on timeout.
5. Refresh a page mid-game: the seat and table state are restored via
   `resume`.
6. Full tables can be **watched** (spectate): the "Watch" button subscribes to
   the table's public snapshots without a seat — no hole cards are ever shown.
7. A browser running on the host can delete a room from the lobby with a
   two-step confirmation. An unfinished hand is cancelled and every seat's
   current chips are refunded before the durable room record is removed.

## Play against an AI player

For local play, open **AI 设置** in the game header—or click **＋ 加入机器人**—
and enter a DeepSeek API key. This option is available only to a same-origin
browser connected over loopback. The key is sent directly to the host process,
kept in memory only, never written to game state, the ledger, logs,
`localStorage` or profile files, and cannot be read back by the page. Enter it
again after restarting `dsh web`.

For unattended startup, supply the key to the host as an environment variable:

```bash
DEEPSEEK_API_KEY=sk-your-key npx @deepseek-ai/dsh web
```

Create and join a table, then click **＋ 加入 AI 机器人**. The first bot starts
heads-up play immediately; additional bots can fill the remaining seats and
join from the next hand. The current adapter uses a user-supplied DeepSeek API
account and defaults to `deepseek-v4-flash`. Each bot turn makes one API
request. If the API times out, fails, or returns an illegal move, the server
chooses a safe legal fallback so the table never stalls.

### AI data disclosure

When an AI seat acts, the host sends the configured API provider only the
state needed for that seat's decision: that AI seat's hole cards, community
cards, pot and betting state, stacks, player nicknames, public actions, legal
actions, and the last 10 public log entries. It never sends another player's
unrevealed hole cards. Operators are responsible for informing players and
complying with the selected provider's terms and applicable privacy law.

Optional profile overrides (the key should still remain an environment
variable):

```yaml
- id: poker
  config:
    deepseekModel: deepseek-v4-flash
    deepseekBaseUrl: https://api.deepseek.com
    botDecisionTimeoutMs: 12000
```

The UI is responsive (1440 / 1024 / 390 px) and styled with the DSH theme
tokens.

## Development

```bash
npm install          # typescript + @types (node/ws/react) + react/react-dom
npm run typecheck    # tsc --noEmit over src/ + test/
npm run build        # tsc → lib/ + dist-test/, bundles the TSX/CSS client
npm test             # build + node --test
npm run test:ui      # browser layout/actions at desktop, tablet and mobile sizes
npm run test:install # install & distribution verification (see below)
```

Layout:

```
src/
  engine/   cards.ts (secure shuffle) · evaluator.ts (hand ranking)
            engine.ts (state machine) · types.ts (domain types)
  ledger.ts immutable Play Token ledger
  protocol.ts wire schema (zod) + per-player view builders
  host/     index.ts (cordis plugin) · table-service.ts · gateway.ts
            bot-controller.ts · persistence.ts · types-augment.ts
  client/   entry.ts + i18n/store/components/styles  ← TS/TSX browser source
cordis.patch.yml       ← the profile bundle patch (auto-inserts the poker row)
test/       evaluator · engine · ledger · service · full-game · frontend · bot
            gateway · audit · simulation · package-exports · ui-layout
scripts/    build.mjs · smoke-test.mjs (end-to-end) · install-test.sh
```

`scripts/build.mjs` bundles `src/client/entry.ts` and its TSX/CSS dependencies
into the distributed `lib/client.js` `__ModuleLoader__` module.

The dependency-free engine is also a public package subpath for bot policies,
simulators and external tests:

```ts
import { PokerEngine, seededRng, evaluateBest } from "dsh-poker/engine";
```

### Install & distribution verification

`npm run test:install` packs the tarball, installs it from the tarball into a
**fresh temporary DSH_HOME** with `npx @deepseek-ai/dsh`, asserts the poker
loader row appears exactly once in `--dump-config`, boots a temporary
`dsh web`, and runs the smoke test against it.

### End-to-end smoke test

```bash
npx @deepseek-ai/dsh --profile web --port 3091 &   # or any profile with the plugin
node scripts/smoke-test.mjs ws://127.0.0.1:3091/poker/ws
```

Simulates two browser windows over WebSocket: create/join, play hands,
verifies privacy, stale-version rejection, reconnect/resume, forged-token
rejection, spectator privacy, chip conservation and cash-out.

## Configuration

The `poker` row config (all optional):

| key              | default | meaning                          |
| ---------------- | ------- | -------------------------------- |
| `smallBlind`     | `5`     | small blind (chips)              |
| `bigBlind`       | `10`    | big blind                        |
| `buyIn`          | `1000`  | default buy-in per table         |
| `maxSeats`       | `6`     | default table size (2–10)        |
| `actionTimeoutMs`| `30000` | turn deadline before auto-action |
| `startingWallet` | `10000` | Play Tokens granted per new player |
| `deepseekApiKey` | unset; falls back to `DEEPSEEK_API_KEY` | server-side AI API key |
| `deepseekBaseUrl`| `https://api.deepseek.com` | AI API base URL |
| `deepseekModel`  | `deepseek-v4-flash` | AI model name |
| `botDecisionTimeoutMs` | `12000` | AI decision request timeout |

Prefer the in-game memory-only setting for interactive local play, or the
`DEEPSEEK_API_KEY` environment variable for unattended startup. Avoid
`deepseekApiKey` because it writes the secret to a profile patch.

## Reset / data

All game data lives in the storage-domain unit `poker` (JSON backend):

```bash
rm ~/.dsh/storages/poker.json   # wipes tables, identities, wallets and the ledger
```

## Known limitations

See `ARCHITECTURE.md` → "Known limitations".

## Security

The WebSocket gateway rejects browser handshakes whose `Origin` does not match
the DSH Web host. This reduces cross-site access to the local game service, but
the plugin is still designed only for a loopback-bound, trusted local DSH
instance. Do not expose it through `0.0.0.0`, a LAN or the public internet
without additional authentication, TLS, rate limiting and access controls.

In-game AI credential configuration additionally requires both the browser and
the requested host to be loopback. Remote clients do not receive the settings
control, and the gateway rejects forged configuration messages. Any seated
player can request AI seats after the local operator has configured a provider;
each AI turn may consume paid provider tokens.

Report vulnerabilities privately according to [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) for this plugin. DSH and its dependencies are separate
projects governed by their own licenses and terms. This plugin does not modify
or fork DSH, and no upstream trademarks or logos are licensed as part of this
repository.

## Responsible use

This software is a local play-token game and is provided for entertainment and
software-development purposes. Do not add deposits, withdrawals, redeemable
prizes, paid entry, rake, or other real-money wagering features without first
obtaining jurisdiction-specific legal advice. Operators remain responsible for
API-provider terms, privacy notices, age restrictions, and local law.
