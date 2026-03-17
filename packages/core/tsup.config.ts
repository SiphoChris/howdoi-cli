import { defineConfig } from "tsup";
import { cpSync, chmodSync, readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = pkg.version as string;

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  format: ["esm"],
  target: "node18",
  // Inject version as a constant at the top of the bundle via banner
  banner: {
    js: `#!/usr/bin/env node\nconst __HOWDOI_VERSION__ = ${JSON.stringify(version)};`,
  },
  clean: true,
  minify: false,
  bundle: true,
  external: ["@inquirer/prompts"],
  onSuccess: async () => {
    cpSync("./package.json", "./dist/package.json");
    chmodSync("dist/cli.js", 0o755);
    console.log(`✓ Built howdoi v${version}`);
    console.log("✓ chmod +x dist/cli.js");
  },
});