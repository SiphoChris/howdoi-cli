# Publishing guide

Releases are automated via GitHub Actions. Once set up, you never need to run `npm publish` manually.

---

## One-time setup — npm token

The release workflow needs an npm token to publish packages.

**1. Generate the token**

- Go to [npmjs.com](https://npmjs.com) → your profile → Access Tokens
- Click **Generate New Token** → choose **Automation** (works with 2FA)
- Copy the token

**2. Add it to GitHub**

- Go to your repo → **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `NPM_TOKEN`
- Value: paste your token
- Click **Add secret**

That's it. You never touch it again.

---

## How to release

**1. Make your changes and merge PRs to main as normal**

**2. Bump versions in the packages you changed**

```bash
# Patch — bug fixes, new examples, new intent phrases
cd packages/core && npm version patch && cd ../..
cd packages/unix && npm version patch && cd ../..

# Minor — new tools added to a knowledge base
cd packages/git && npm version minor && cd ../..

# Or bump all packages at once
for pkg in core unix git ssh docker networking all; do
  cd packages/$pkg && npm version patch && cd ../..
done
```

**3. Commit the version bumps**

```bash
git add .
git commit -m "chore: release v1.0.1"
```

**4. Tag and push**

```bash
git tag v1.0.1
git push && git push --tags
```

That's it. The release workflow triggers automatically, builds core, runs smoke tests, and publishes all packages to npm in the correct order.

---

## What the release workflow does

1. Checks out the code
2. Installs dependencies with Bun
3. Builds `@howdoi-cli/core`
4. Runs smoke tests — if anything fails, nothing gets published
5. Publishes packages in dependency order: `core` → `unix` → `git` → `ssh` → `docker` → `networking` → `all`

If a package is already at that version on npm, npm skips it with a harmless warning. No errors.

---

## What the CI workflow does

Runs on every push to `main` and every pull request. It:

1. Installs dependencies
2. Builds core
3. Runs smoke tests (`--version`, `--help`, `grep`, `search for string in file`, `--list`)

If the build or any test fails, the PR is blocked from merging. This is your safety net — broken code never reaches main.

---

## Versioning policy

- **Patch** (`1.0.0` → `1.0.1`) — bug fixes, new examples, new intent phrases, typo fixes
- **Minor** (`1.0.0` → `1.1.0`) — new tools added to an existing knowledge base
- **Major** (`1.0.0` → `2.0.0`) — breaking changes to core (schema changes, removed flags)

All packages version independently. Bump only what changed, plus `all` (so `npm update -g @howdoi-cli/all` picks up everything).

---

## Checking a release

After the workflow completes:

```bash
# Verify on npm
npm view @howdoi-cli/core
npm view @howdoi-cli/unix

# Test a fresh install
npm install -g @howdoi-cli/unix
howdoi --version
howdoi grep
```

---

## If something goes wrong

If the workflow fails mid-publish (e.g. core published but unix failed):

1. Fix the issue
2. Re-run the failed job from GitHub Actions — already-published packages will be skipped, the rest will publish
3. No need to unpublish or revert anything
