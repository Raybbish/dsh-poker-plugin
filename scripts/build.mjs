/**
 * Build: compile TypeScript (host + engine + protocol) to lib/, compile tests
 * to dist-test/, and bundle the TSX client into the DSH __ModuleLoader__
 * single-file bundle (lib/client.js) with esbuild.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsc = join(root, "node_modules", ".bin", "tsc");

function run(args) {
  execFileSync(tsc, args, { cwd: root, stdio: "inherit" });
}

rmSync(join(root, "lib"), { recursive: true, force: true });
rmSync(join(root, "dist-test"), { recursive: true, force: true });
mkdirSync(join(root, "lib"), { recursive: true });

run(["-p", "tsconfig.json"]);
run(["-p", "tsconfig.test.json"]);

// ── client bundle ────────────────────────────────────────────────────────────
// The DSH browser shell loads plugins as ONE file in the
// `window.__ModuleLoader__.load({ id, factory })` handoff. esbuild bundles the
// TSX sources into CJS with react/react-jsx-runtime kept external (they are
// platform seed words resolved by the loader's require); the wrapper then
// evaluates the bundle inside the factory scope.
await build({
  entryPoints: [join(root, "src", "client", "entry.ts")],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  loader: { ".css": "text" },
  external: ["react", "react/jsx-runtime"],
  outfile: join(root, "lib", "client.bundle.js"),
  logLevel: "warning",
});

const bundled = readFileSync(join(root, "lib", "client.bundle.js"), "utf8");
const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-poker",
  factory: (require) => {
    "use strict";
    var module = { exports: {} };
    var exports = module.exports;
${bundled}
    return module.exports;
  },
});
`;
writeFileSync(join(root, "lib", "client.js"), wrapped);
rmSync(join(root, "lib", "client.bundle.js"), { force: true });

console.log("build: lib/ + dist-test/ + lib/client.js (esbuild bundle) written");
