# Security Policy

## Supported versions

Security fixes are provided for the latest release on the default branch.
This project is pre-1.0; users should upgrade to the newest patch release
before reporting a problem.

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue. Use
GitHub's **Security → Report a vulnerability** flow for this repository. If
private vulnerability reporting is not available yet, contact the maintainer
privately and allow reasonable time for a fix before public disclosure.

Include the affected version, impact, reproduction steps and any suggested
mitigation. Do not include real API keys, identity tokens or private game data.

## Deployment boundary

`dsh-poker` is designed for a loopback-only DSH Web instance and Play Tokens.
Do not expose the DSH listener on `0.0.0.0`, a LAN or the public internet
without adding deployment-specific authentication, TLS, rate limiting and
access controls.

The optional AI player uses the operator's paid API account. For interactive
local play, the operator may enter a key through **AI settings**. That command
is accepted only from a same-origin browser whose socket peer and requested
Host are both loopback. The key is passed directly into an in-memory provider
closure: it is never written to table state, snapshots, the ledger, logs,
browser storage or profile files, and the browser receives only a configured /
not-configured boolean. The in-memory key is lost when `dsh web` restarts.

For unattended startup, use `DEEPSEEK_API_KEY`. Avoid the `deepseekApiKey`
profile field because profile configuration is persisted. Review provider
usage and allow only trusted local players to add AI seats; each AI turn may
consume paid provider tokens.

Room deletion is also limited to a same-origin loopback browser. It requires a
two-step UI confirmation, cancels any unfinished hand, refunds each seat's
currently owned table chips through idempotent ledger entries, and uses a
durable deletion tombstone so restart cannot expose a partially deleted room.
