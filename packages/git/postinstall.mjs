#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { homedir } from "os";

// process.argv[1] is always the path of the running script — reliable across
// all package managers and working directories
const scriptDir = dirname(resolve(process.argv[1]));
const pkgJsonPath = join(scriptDir, "package.json");

if (!existsSync(pkgJsonPath)) {
  process.exit(0);
}

const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
const pkgName = pkgJson.name.replace("@howdoi-cli/", "");

// Skip in monorepo dev context — check for workspace root two levels up
const monoRootPkg = resolve(scriptDir, "..", "..", "package.json");
if (existsSync(monoRootPkg)) {
  try {
    const root = JSON.parse(readFileSync(monoRootPkg, "utf-8"));
    if (root.workspaces) {
      console.log(`[howdoi] Dev mode — skipping XDG install for ${pkgJson.name}`);
      process.exit(0);
    }
  } catch { /* continue */ }
}

const srcData = join(scriptDir, "data");
if (!existsSync(srcData)) {
  process.exit(0);
}

const xdgBase = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
const dest = join(xdgBase, "howdoi", pkgName);

try {
  mkdirSync(dest, { recursive: true });
  cpSync(srcData, dest, { recursive: true });
  console.log(`[howdoi] ✓ ${pkgJson.name}@${pkgJson.version} → ${dest}`);
} catch (err) {
  console.warn(`[howdoi] Warning: could not copy data: ${err.message}`);
  console.warn(`[howdoi] howdoi will still work via node_modules fallback.`);
}
