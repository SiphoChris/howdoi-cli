import { loadAllTools } from "../engine/loader.js";
import { SearchEngine } from "../engine/search.js";
import {
  renderToolCard,
  renderNoResults,
  renderWelcome,
  renderList,
} from "../renderer/display.js";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../engine/types.js";
import chalk from "chalk";
import { select } from "@inquirer/prompts";

// HOWDOI_VERSION is a bare identifier replaced by tsup define at build time
declare const HOWDOI_VERSION: string;
const VERSION = HOWDOI_VERSION;

async function promptSelect(
  message: string,
  choices: { name: string; value: string; description?: string }[]
): Promise<string | null> {
  try {
    return await select({
      message,
      choices: choices.map((c) => ({
        name: c.description ? `${c.name}  ${chalk.dim(c.description)}` : c.name,
        value: c.value,
      })),
      pageSize: 12,
    });
  } catch {
    return null;
  }
}

async function guidedMode(engine: SearchEngine): Promise<void> {
  renderWelcome();

  const categoryMap = engine.getToolsByCategory();

  const selectedCategory = await promptSelect(
    "What area are you working in?",
    CATEGORY_ORDER.filter((c) => categoryMap.has(c)).map((c) => ({
      name: CATEGORY_LABELS[c] ?? c,
      value: c,
      description: `${categoryMap.get(c)!.length} tools`,
    }))
  );

  if (!selectedCategory) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tools = categoryMap.get(selectedCategory) ?? [];

  const selectedTool = await promptSelect(
    `Which ${CATEGORY_LABELS[selectedCategory]} tool?`,
    tools.map((t) => ({
      name: t.tool,
      value: t.tool,
      description: t.description,
    }))
  );

  if (!selectedTool) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tool = tools.find((t) => t.tool === selectedTool);
  if (tool) renderToolCard(tool);
}

function intentSearch(query: string, engine: SearchEngine): void {
  const results = engine.search(query);

  if (results.length === 0) {
    renderNoResults(query);
    return;
  }

  const top = results[0];
  renderToolCard(top.tool, top.matchedIntent);

  if (results.length > 1) {
    console.log(chalk.dim("  Also relevant:"));
    for (const r of results.slice(1, 4)) {
      console.log(
        `    ${chalk.cyan(r.tool.tool.padEnd(22))} ${chalk.dim(r.tool.description)}`
      );
    }
    console.log();
  }
}

function printVersion(): void {
  console.log(`howdoi v${VERSION}`);
}

function printHelp(): void {
  console.log();
  console.log(chalk.bold.white("  howdoi") + "  — intent-based command discovery");
  console.log();
  console.log("  " + chalk.bold("Usage"));
  console.log(`    ${chalk.green("howdoi")}                         ${chalk.dim("guided category browser")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<intent>")}               ${chalk.dim("search by what you want to do")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<tool>")}                 ${chalk.dim("show all examples for a tool")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--list")}                 ${chalk.dim("list all tools grouped by package")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--list <package>")}       ${chalk.dim("list tools for a specific package")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--version")}              ${chalk.dim("show installed version")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--help")}                 ${chalk.dim("show this help message")}`);
  console.log();
  console.log("  " + chalk.bold("Examples"));
  console.log(`    ${chalk.green("howdoi")} search for text in file`);
  console.log(`    ${chalk.green("howdoi")} undo last commit`);
  console.log(`    ${chalk.green("howdoi")} add ssh key to agent`);
  console.log(`    ${chalk.green("howdoi")} run container in background`);
  console.log(`    ${chalk.green("howdoi")} grep`);
  console.log(`    ${chalk.green("howdoi")} --list`);
  console.log(`    ${chalk.green("howdoi")} --list unix`);
  console.log(`    ${chalk.green("howdoi")} --list git`);
  console.log(`    ${chalk.green("howdoi")} --version`);
  console.log();
  console.log("  " + chalk.bold("Install knowledge bases"));
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/unix")}`);
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/git")}`);
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/ssh")}`);
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/docker")}`);
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/networking")}`);
  console.log(`    ${chalk.cyan("npm install -g @howdoi-cli/all")}  ${chalk.dim("← everything")}`);
  console.log();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // --version and --help don't need tools loaded
  if (args[0] === "--version" || args[0] === "-v") {
    printVersion();
    return;
  }

  if (args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  const tools = loadAllTools();
  const engine = new SearchEngine(tools);

  // --list [package]
  if (args[0] === "--list" || args[0] === "-l") {
    const packageFilter = args[1];
    renderWelcome();
    renderList(tools, packageFilter);
    return;
  }

  // No args → guided browser
  if (args.length === 0) {
    await guidedMode(engine);
    return;
  }

  const query = args.join(" ").trim();

  // Exact tool name → show all examples directly
  const exactTool = tools.find(
    (t) => t.tool.toLowerCase() === query.toLowerCase()
  );
  if (exactTool) {
    renderToolCard(exactTool);
    return;
  }

  intentSearch(query, engine);
}

main().catch((err) => {
  console.error(chalk.red("Error: ") + err.message);
  process.exit(1);
});