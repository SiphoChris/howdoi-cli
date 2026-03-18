import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import yaml from "js-yaml";
import type { ToolEntry } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * XDG data directory where knowledge base packages copy their data on install.
 * Each package writes to ~/.local/share/howdoi/<package-name>/
 */
function getXdgDataDir(): string {
  const xdgBase = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  return join(xdgBase, "howdoi");
}

/**
 * Fallback: scan node_modules for installed @howdoi-cli/* packages
 * that have a howdoi.dataDir field in their package.json.
 */
function discoverFromNodeModules(): string[] {
  const dataDirs: string[] = [];

  const candidates = [
    join(__dirname, "..", "..", "..", ".."),        // global: node_modules/@howdoi-cli/core/dist -> ../../../../
    join(__dirname, "..", "..", "..", "..", ".."),  // deeper nesting
  ];

  for (const base of candidates) {
    const scope = join(base, "node_modules", "@howdoi-cli");
    if (!existsSync(scope)) continue;

    for (const pkg of readdirSync(scope)) {
      if (pkg === "core") continue;
      const pkgJson = join(scope, pkg, "package.json");
      if (!existsSync(pkgJson)) continue;

      try {
        const manifest = JSON.parse(readFileSync(pkgJson, "utf-8"));
        const dataDir = manifest?.howdoi?.dataDir;
        if (dataDir) {
          dataDirs.push(join(scope, pkg, dataDir));
        }
      } catch {
        // skip malformed packages
      }
    }
  }

  return dataDirs;
}

function loadFromDir(dataDir: string, tools: ToolEntry[]): void {
  if (!existsSync(dataDir)) return;

  const categories = readdirSync(dataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const category of categories) {
    const categoryDir = join(dataDir, category);
    const files = readdirSync(categoryDir).filter((f) => f.endsWith(".yaml"));

    for (const file of files) {
      try {
        const raw = readFileSync(join(categoryDir, file), "utf-8");
        const parsed = yaml.load(raw) as ToolEntry;
        tools.push(parsed);
      } catch {
        // skip malformed yaml
      }
    }
  }
}

export function loadAllTools(): ToolEntry[] {
  const tools: ToolEntry[] = [];

  // Primary: XDG data directory
  const xdgDir = getXdgDataDir();
  if (existsSync(xdgDir)) {
    for (const pkg of readdirSync(xdgDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      loadFromDir(join(xdgDir, pkg.name), tools);
    }
  }

  // Fallback: node_modules discovery
  if (tools.length === 0) {
    for (const dir of discoverFromNodeModules()) {
      loadFromDir(dir, tools);
    }
  }

  if (tools.length === 0) {
    console.error(
      "\nNo knowledge bases found. Install one to get started:\n\n" +
      "  npm install -g @howdoi-cli/unix\n" +
      "  npm install -g @howdoi-cli/git\n"
    );
    process.exit(1);
  }

  return tools;
}
