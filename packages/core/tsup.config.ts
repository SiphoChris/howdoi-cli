import { defineConfig } from "tsup";
import { cpSync, chmodSync } from "fs";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  format: ["esm"],
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
  clean: true,
  minify: false,
  bundle: true,
  external: ["@inquirer/prompts"],
  // Replace the placeholder string — tsup define needs the exact
  // quoted string as it appears in source to do the substitution
  define: {
    '"__HOWDOI_VERSION__"': JSON.stringify(pkg.version),
  },
  onSuccess: async () => {
    cpSync("./package.json", "./dist/package.json");
    chmodSync("dist/cli.js", 0o755);
    console.log(`✓ Built howdoi v${pkg.version}`);
    console.log("✓ chmod +x dist/cli.js");
  },
});