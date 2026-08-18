/**
 * Boot a temporary, isolated `dsh web` for browser/install tests:
 * npm pack → fresh DSH_HOME → install from the tarball → boot on a port.
 * Returns { url, port, home, cleanup() }.
 */
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DSH_SPEC = process.env.DSH_SPEC ?? "@deepseek-ai/dsh@0.1.0-rc.7";
const DSH = ["npx", "--yes", DSH_SPEC];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts }).toString();
}

export function packTarball(destDir) {
  const name = run("npm", ["pack", "--pack-destination", destDir], { cwd: ROOT })
    .trim()
    .split("\n")
    .pop();
  return join(destDir, name);
}

async function waitForPort(port, pid, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    if (pid !== undefined && !isAlive(pid)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`dsh web did not come up on port ${port}`);
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function bootTestServer(port = Number(process.env.DSH_POKER_UI_PORT ?? 31832)) {
  const work = mkdtempSync(join(tmpdir(), "dsh-poker-ui."));
  const home = join(work, "home");
  mkdirSync(home, { recursive: true });
  // Suppress the shipped "welcome notice" modal on first boot so the poker
  // entry is directly clickable (the real profile already has this setting).
  writeFileSync(join(home, "settings.yaml"), "ui-onboarding:\n  welcomeNoticeVersion: 2026-08-13.1\n");
  // Copy the local credential file (if any) so the app never opens the
  // API-key setup modal. Copied, never read or printed.
  const realHome = process.env.REAL_DSH_HOME ?? join(process.env.HOME ?? "", ".dsh");
  const credSrc = join(realHome, ".credentials.yaml");
  if (existsSync(credSrc)) copyFileSync(credSrc, join(home, ".credentials.yaml"));
  const tarball = packTarball(work);

  // fresh profile + bundle install (exactly what users do)
  run(DSH[0], DSH.slice(1).concat(["plugin", "--profile", "web", "add", "-w", `file:${tarball}`]), {
    cwd: ROOT,
    env: { ...process.env, DSH_HOME: home },
  });

  // boot dsh web
  const child = spawn(DSH[0], DSH.slice(1).concat(["--profile", "web", "--port", String(port)]), {
    cwd: ROOT,
    env: { ...process.env, DSH_HOME: home },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  try {
    await waitForPort(port, child.pid);
  } catch (err) {
    rmSync(work, { recursive: true, force: true });
    throw new Error(`${err.message}\n--- server log ---\n${log}`);
  }

  return {
    url: `http://127.0.0.1:${port}`,
    port,
    home,
    work,
    log: () => log,
    cleanup() {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      rmSync(work, { recursive: true, force: true });
    },
  };
}

export { ROOT };
