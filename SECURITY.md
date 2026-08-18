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

The optional AI player uses the operator's paid API account. Keep the API key
in `DEEPSEEK_API_KEY`, review provider usage, and only allow trusted local
players to add AI seats.
