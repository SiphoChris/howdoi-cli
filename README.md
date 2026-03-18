# howdoi

**Intent-based command discovery for the terminal.**

You know what you want to do. You just don't remember the exact command.
`howdoi` meets you there — describe your intent, get real copy-paste-ready examples instantly.
No internet. No LLM at runtime. Everything runs locally.

```
$ howdoi search for string in file

 TEXT   grep  Search for patterns in files and directories
────────────────────────────────────────────────────────

  ▸ Search for a string in a file
    grep "error" app.log

  ▸ Recursive, case-insensitive with line numbers
    grep -rni "pattern" .

────────────────────────────────────────────────────────
```

---

## Install

### npm (recommended)

Always install `@howdoi-cli/core` first — this registers the `howdoi` binary. Then install whichever knowledge bases you need.

```bash
# Step 1 — install the binary
npm install -g @howdoi-cli/core

# Step 2 — install knowledge bases
npm install -g @howdoi-cli/unix        # file management, text processing
npm install -g @howdoi-cli/git         # git workflows
npm install -g @howdoi-cli/ssh         # SSH keys, agent, config, tunnels
npm install -g @howdoi-cli/docker      # containers, images, compose
npm install -g @howdoi-cli/networking  # curl, dig, ping, ports
```

Or install everything at once:

```bash
npm install -g @howdoi-cli/core @howdoi-cli/all
```

### bun

Same as npm — install core first, then knowledge bases:

```bash
bun add -g @howdoi-cli/core
bun add -g @howdoi-cli/unix
bun add -g @howdoi-cli/git
```

> **Note:** bun blocks postinstall scripts by default. Run `bun pm -g trust @howdoi-cli/unix` to allow them, or skip it — howdoi discovers data via node_modules as a fallback and works either way.

> **Note:** Make sure bun's global bin directory is in your PATH:
> ```bash
> echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
> ```

---

## Usage

```bash
# Describe your intent — results are instant
howdoi search for string in file
howdoi undo last commit
howdoi add ssh key to agent
howdoi run container in background
howdoi check open ports

# Jump straight to a tool's examples
howdoi grep
howdoi git stash
howdoi ssh-keygen
howdoi docker

# Browse interactively by category
howdoi

# List all available tools grouped by package
howdoi --list
howdoi --list unix
howdoi --list git

# Check installed version
howdoi --version
```

---

## Update

```bash
# npm
npm update -g @howdoi-cli/all          # if installed via /all
npm update -g @howdoi-cli/unix @howdoi-cli/git   # if installed individually

# bun
bun add -g @howdoi-cli/unix@latest
```

---

## How it works

Each knowledge base package ships YAML files containing intent phrases and examples.
On install, data is copied to `~/.local/share/howdoi/` via a postinstall script.
The core engine loads all installed knowledge bases at runtime, builds a Fuse.js index,
and matches your query against intent phrases — all locally, no network, instant startup.

If postinstall didn't run (e.g. blocked by bun), the engine falls back to discovering
data directly from `node_modules`. Either way it works.

```
howdoi add ssh key to agent
          ↓
  fuzzy match intent index
          ↓
  ssh-agent → "add ssh key to agent"
          ↓
  render relevant examples
```

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@howdoi-cli/core` | Engine + binary — **install this first** | `npm i -g @howdoi-cli/core` |
| `@howdoi-cli/unix` | File management, text processing, inspection | `npm i -g @howdoi-cli/unix` |
| `@howdoi-cli/git` | Git workflows | `npm i -g @howdoi-cli/git` |
| `@howdoi-cli/ssh` | SSH keys, agent, config, tunnels | `npm i -g @howdoi-cli/ssh` |
| `@howdoi-cli/docker` | Docker containers, images, compose | `npm i -g @howdoi-cli/docker` |
| `@howdoi-cli/networking` | curl, dig, ping, ports | `npm i -g @howdoi-cli/networking` |
| `@howdoi-cli/all` | Everything above | `npm i -g @howdoi-cli/all` |

---

## OS-specific examples

Some commands behave differently on Linux vs macOS. Where it matters, examples are tagged:

- `[linux only]` — Linux-specific flag or tool
- `[macos only]` — macOS-specific flag or tool
- No tag — works on both

---

## Contributing

### Adding examples to an existing tool

Edit the relevant YAML file under `packages/<kb>/data/` and add to the `examples` array:

```yaml
- intent: your intent phrase
  title: Human-readable title
  command: the-command --with flags
  os: linux-only   # optional: linux-only | macos-only
```

### Adding a new tool

Create a new YAML file in the appropriate package:

```yaml
tool: mytool
category: unix          # or git, ssh, docker, networking
description: One-line description
package: "@howdoi-cli/unix"
intents:
  - natural phrase for what this does
  - another way to say the same thing
  - yet another phrasing
examples:
  - intent: natural phrase for what this does
    title: Descriptive title
    command: mytool --flag argument
```

Then rebuild: `bun run build:core`

### Adding a new knowledge base package

1. Copy an existing package folder (e.g. `packages/ssh`) as a template
2. Update `package.json` name, description, and keywords
3. Replace the `data/` folder with your YAML files
4. Add it as a dependency in `packages/all/package.json`
5. Submit a PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

### Intent writing tips

- Write intents as someone would naturally say them, not as documentation
- Aim for 8–15 intent phrases per tool — variety helps fuzzy matching
- Think of all phrasings: "delete file", "remove file", "erase file"

---

## Monorepo structure

```
howdoi-cli/
├── packages/
│   ├── core/               # Engine, renderer, binary (@howdoi-cli/core)
│   │   └── src/
│   │       ├── cli/        # Entry point
│   │       ├── engine/     # Loader, search, types
│   │       └── renderer/   # Chalk display
│   ├── unix/               # @howdoi-cli/unix
│   │   └── data/
│   │       ├── file-management/
│   │       ├── text-processing/
│   │       └── file-inspection/
│   ├── git/                # @howdoi-cli/git
│   │   └── data/git/
│   ├── ssh/                # @howdoi-cli/ssh
│   │   └── data/ssh/
│   ├── docker/             # @howdoi-cli/docker
│   │   └── data/docker/
│   ├── networking/         # @howdoi-cli/networking
│   │   └── data/networking/
│   └── all/                # @howdoi-cli/all (meta package)
├── scripts/
│   └── postinstall.mjs     # Copies data to ~/.local/share/howdoi/ on install
└── package.json            # Bun workspace root
```

---

## Development

```bash
git clone https://github.com/SiphoChris/howdoi-cli.git
cd howdoi-cli
bun install

# Build core
bun run build:core

# Run in dev mode (no build needed)
bun run dev -- search for string in file
bun run dev -- grep
bun run dev -- --list
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full development guide.

---

## License

MIT — see [LICENSE](./LICENSE)
