# Contributing to howdoi

First — thank you. howdoi is only as good as the examples it ships with, and that's a community effort.

There are three ways to contribute, from easiest to most involved:

1. **Add examples to an existing tool** — a YAML edit
2. **Add a new tool to an existing knowledge base** — a new YAML file
3. **Add a new knowledge base package** — a new package in the monorepo

All three are welcome. No TypeScript knowledge required for 1 and 2.

---

## Before you start

```bash
# Fork and clone the repo
git clone https://github.com/SiphoChris/howdoi-cli.git
cd howdoi-cli

# Install dependencies
bun install

# Build core
bun run build:core

# Test it works
bun run dev -- grep
bun run dev -- search for string in file
```

---

## 1. Adding examples to an existing tool

Find the right YAML file under `packages/<kb>/data/` and add to the `examples` array.

**Example — adding a new grep example:**

```yaml
# packages/unix/data/text-processing/grep.yaml

examples:
  # ... existing examples ...

  - intent: search for string in file        # must match an intent phrase above
    title: Search with context lines around match
    command: grep -C 3 "error" app.log
    os: linux-only                           # optional — only if platform-specific
```

**Rules:**
- `intent` must exactly match one of the phrases in the `intents` list above
- `title` should be short and human-readable — sentence case, no period
- `command` must be real and copy-paste ready
- Use realistic placeholders: `file.txt`, `app.log`, `dir/`, `user@hostname`
- `os` is optional. Use `linux-only` or `macos-only` where behaviour genuinely differs

**Test your change:**
```bash
bun run dev -- search for string in file
```

---

## 2. Adding a new tool

Create a new `.yaml` file in the appropriate category folder.

**Which package and folder?**

| Content | Package | Folder |
|---------|---------|--------|
| File ops, permissions | `packages/unix` | `data/file-management/` |
| Text processing | `packages/unix` | `data/text-processing/` |
| File inspection | `packages/unix` | `data/file-inspection/` |
| Git commands | `packages/git` | `data/git/` |
| SSH, keys, agent | `packages/ssh` | `data/ssh/` |
| Docker, compose | `packages/docker` | `data/docker/` |
| curl, ping, DNS | `packages/networking` | `data/networking/` |

**Full YAML schema:**

```yaml
tool: mytool                          # the actual command name
category: text-processing             # folder name — file-management | text-processing | file-inspection | git | ssh | docker | networking
description: One-line description of what it does
package: "@howdoi-cli/unix"           # which npm package this belongs to

intents:                              # natural language phrases users might type
  - do the main thing with a file
  - another way to say the same thing
  - yet another phrasing
  - verb noun phrasing
  - noun verb phrasing
  # aim for 8–15 intents per tool

examples:
  - intent: do the main thing with a file    # must match one of the intents above
    title: Descriptive title for this example
    command: mytool --flag argument
    os: linux-only                           # optional

  - intent: another way to say the same thing
    title: Another example
    command: mytool --other-flag value
```

**Intent writing tips:**
- Write intents as someone would naturally say them, not as documentation
- Think of every way someone might phrase the same goal:
  - "delete file", "remove file", "erase file"
  - "search for string", "find text in file", "look for pattern"
- Include phrasing with and without the tool name
- More intents = better fuzzy matching = fewer "no results" moments
- Every `intent` in `examples` must appear in the `intents` list

**Test your new tool:**
```bash
bun run dev -- <one of your intent phrases>
bun run dev -- mytool        # exact tool name lookup
```

---

## 3. Adding a new knowledge base package

This is for adding an entirely new domain (e.g. `@howdoi-cli/kubernetes`, `@howdoi-cli/vim`).

**Steps:**

### 1. Create the package folder

```bash
mkdir -p packages/mypackage/data/mypackage
```

### 2. Create `package.json`

```json
{
  "name": "@howdoi-cli/mypackage",
  "version": "1.0.0",
  "description": "MyPackage knowledge base for howdoi.",
  "type": "module",
  "files": ["data", "postinstall.mjs", "README.md", "LICENSE"],
  "scripts": {
    "postinstall": "node postinstall.mjs",
    "publish:npm": "npm publish"
  },
  "publishConfig": { "access": "public" },
  "howdoi": {
    "type": "knowledge-base",
    "dataDir": "data"
  },
  "dependencies": {
    "@howdoi-cli/core": "^1.0.0"
  },
  "engines": { "node": ">=18.0.0" },
  "license": "MIT"
}
```

### 3. Copy the postinstall script

```bash
cp scripts/postinstall.mjs packages/mypackage/postinstall.mjs
```

### 4. Add your YAML data files

```bash
# packages/mypackage/data/mypackage/mytool.yaml
```

Follow the YAML schema above. Use your package name as the `category`.

### 5. Add a category label in core

Edit `packages/core/src/engine/types.ts`:

```ts
export const CATEGORY_LABELS: Record<string, string> = {
  // ... existing labels ...
  "mypackage": "My Package",
};

export const CATEGORY_ORDER = [
  // ... existing order ...
  "mypackage",
];
```

### 6. Add to `@howdoi-cli/all`

Edit `packages/all/package.json` and add your package to `dependencies`.

### 7. Write a README and copy the LICENSE

```bash
cp LICENSE packages/mypackage/LICENSE
# Write packages/mypackage/README.md
```

### 8. Build and test

```bash
bun run build:core
bun run dev -- <your intent phrase>
```

### 9. Submit a PR

Open a pull request with a clear description of what the knowledge base covers and why it belongs in the official `@howdoi-cli` org.

---

## Pull request checklist

Before submitting:

- [ ] YAML is valid (no syntax errors)
- [ ] All `intent` fields in `examples` match a phrase in the `intents` list
- [ ] Commands are real and copy-paste ready
- [ ] Titles are sentence case, short, and descriptive
- [ ] Platform-specific examples have an `os` tag
- [ ] Tested with `bun run dev -- <intent phrase>`
- [ ] New tools have at least 5 examples and 8 intent phrases

---

## Code style

The engine and renderer live in `packages/core/src/`. If you're touching TypeScript:

- Bun + TypeScript — no transpilation needed in dev
- `bun run build:core` to build
- Keep the engine dependency-light — Fuse.js, js-yaml, chalk, @inquirer/prompts only

---

## Questions

Open an issue or start a discussion on GitHub. We're friendly.
