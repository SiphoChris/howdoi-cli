# Development guide

Everything you need to work on howdoi locally.

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- Node.js ≥ 18 (for the built binary)
- Git

## Setup

```bash
git clone https://github.com/SiphoChris/howdoi-cli.git
cd howdoi-cli
bun install
```

This installs dependencies for all packages via Bun workspaces.

> **Note:** bun will run postinstall scripts for each knowledge base package during `bun install`. In a monorepo workspace these are automatically skipped — the scripts detect the workspace context and exit cleanly. If you see a "Blocked 1 postinstall" warning, that's bun's default security behaviour for untrusted scripts. It doesn't affect dev mode since the loader reads data directly from the packages.

---

## Running in dev mode

```bash
# Run core directly with Bun (no build needed)
bun run dev -- search for string in file
bun run dev -- grep
bun run dev -- undo last commit
bun run dev -- add ssh key to agent
bun run dev -- --list
bun run dev -- --list unix
bun run dev -- --version
bun run dev -- --help
bun run dev            # guided browser
```

Dev mode reads YAML data from the packages directly — no postinstall or XDG setup needed.

---

## Project structure

```
howdoi-cli/
├── packages/
│   ├── core/                        # @howdoi-cli/core
│   │   ├── src/
│   │   │   ├── cli/
│   │   │   │   └── index.ts         # Entry point — arg parsing, modes
│   │   │   ├── engine/
│   │   │   │   ├── types.ts         # Shared TypeScript interfaces
│   │   │   │   ├── loader.ts        # XDG data discovery + YAML loading
│   │   │   │   └── search.ts        # Fuse.js search engine
│   │   │   └── renderer/
│   │   │       └── display.ts       # Chalk-powered card renderer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── unix/                        # @howdoi-cli/unix
│   │   ├── data/
│   │   │   ├── file-management/     # ls, find, cp, mv, rm, mkdir...
│   │   │   ├── text-processing/     # grep, sed, awk, sort, uniq...
│   │   │   └── file-inspection/     # tree, stat, du, df
│   │   ├── postinstall.mjs
│   │   └── package.json
│   │
│   ├── git/                         # @howdoi-cli/git
│   │   ├── data/git/                # log, diff, stash, rebase, reset...
│   │   ├── postinstall.mjs
│   │   └── package.json
│   │
│   ├── ssh/                         # @howdoi-cli/ssh
│   │   ├── data/ssh/                # ssh, ssh-agent, ssh-keygen, ssh-config
│   │   ├── postinstall.mjs
│   │   └── package.json
│   │
│   ├── docker/                      # @howdoi-cli/docker
│   │   ├── data/docker/             # docker, docker-compose
│   │   ├── postinstall.mjs
│   │   └── package.json
│   │
│   ├── networking/                  # @howdoi-cli/networking
│   │   ├── data/networking/         # curl, dig, ping, ss
│   │   ├── postinstall.mjs
│   │   └── package.json
│   │
│   └── all/                         # @howdoi-cli/all (meta package, no code)
│       └── package.json
│
├── scripts/
│   └── postinstall.mjs              # Shared install script (copies data to XDG)
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Build + smoke test on every PR and push to main
│   │   └── release.yml          # Publish all packages on version tag push
│   ├── ISSUE_TEMPLATE/          # Bug report, missing result, new KB request
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md
├── DEVELOPMENT.md
├── PUBLISHING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── README.md
├── package.json                     # Bun workspace root
└── tsconfig.json                    # Shared TS config
```

---

## How data discovery works

When `howdoi` runs, the loader looks for installed knowledge bases in two places:

**1. XDG data directory (primary)**

Each knowledge base copies its YAML data to `~/.local/share/howdoi/<pkg-name>/` on install via `postinstall.mjs`. Core reads from there at runtime. This works reliably across all package managers and install locations.

**2. node_modules scan (fallback)**

If the XDG directory is empty (e.g. postinstall was skipped), core walks up from `__dirname` looking for `node_modules/@howdoi-cli/*` packages with a `howdoi.dataDir` field in their `package.json`.

**In dev mode**, the loader falls through to the node_modules scan, which finds the packages in the monorepo's own `node_modules` symlinks. This means dev mode works without any XDG setup.

---

## Building

```bash
# Build core (required before publishing or testing the built binary)
bun run build:core

# Test the built binary
node packages/core/dist/cli.js grep
node packages/core/dist/cli.js search for string in file
node packages/core/dist/cli.js --list
node packages/core/dist/cli.js --list unix
node packages/core/dist/cli.js --version
```

The build:
1. Bundles `src/cli/index.ts` → `dist/cli.js` via tsup (ESM)
2. Inlines the version string from `package.json` at build time via `define` — no runtime file reads
3. Copies `package.json` into `dist/` as a belt-and-suspenders fallback
4. Externalises `@inquirer/prompts` (CJS, can't be bundled into ESM)
5. Adds `#!/usr/bin/env node` shebang
6. Sets `chmod +x`

---

## YAML schema

Every tool file follows this structure:

```yaml
tool: grep                           # the actual command name
category: text-processing            # maps to a CATEGORY_LABELS entry in types.ts
description: Short one-line description
package: "@howdoi-cli/unix"          # which npm package this lives in

intents:                             # phrases users might type
  - search for string in file
  - find text in file
  - look for pattern in directory
  # 8–15 phrases recommended

examples:
  - intent: search for string in file  # must match one of the intents above
    title: Search for a string in a file
    command: grep "pattern" file.txt
    os: linux-only                     # optional: linux-only | macos-only
```

---

## Adding a new category

If you add a knowledge base with a new category not in the existing list:

1. Add the label to `CATEGORY_LABELS` in `packages/core/src/engine/types.ts`
2. Add it to `CATEGORY_ORDER` in the same file
3. Rebuild core: `bun run build:core`

---

## Linting / type checking

```bash
# Type check core
cd packages/core && bunx tsc --noEmit
```

There's no linter configured yet — PRs adding eslint + prettier are welcome.
