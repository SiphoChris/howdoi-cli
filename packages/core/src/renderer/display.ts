import chalk from "chalk";
import type { ToolEntry, Example } from "../engine/types.js";
import { CATEGORY_LABELS, CATEGORY_ORDER, PACKAGE_CATEGORY_MAP } from "../engine/types.js";

function rule(width = 56): string {
  return chalk.dim("─".repeat(width));
}

function badge(category: string): string {
  const labels: Record<string, string> = {
    "file-management": chalk.bgYellow.black(" FILE "),
    "text-processing":  chalk.bgCyan.black(" TEXT "),
    "file-inspection":  chalk.bgMagenta.black(" INSPECT "),
    "git":              chalk.bgRed.black(" GIT "),
    "ssh":              chalk.bgBlue.black(" SSH "),
    "docker":           chalk.bgBlue.black(" DOCKER "),
    "networking":       chalk.bgGreen.black(" NET "),
  };
  return labels[category] ?? chalk.bgWhite.black(` ${category.toUpperCase()} `);
}

function osBadge(os?: Example["os"]): string {
  if (!os) return "";
  const labels: Record<string, string> = {
    "linux":       chalk.dim(" [linux/macos]"),
    "macos":       chalk.dim(" [linux/macos]"),
    "linux-only":  chalk.yellow(" [linux only]"),
    "macos-only":  chalk.yellow(" [macos only]"),
  };
  return labels[os] ?? "";
}

export function renderToolCard(tool: ToolEntry, intentFilter?: string): void {
  const examples = intentFilter
    ? tool.examples.filter((e) => e.intent === intentFilter)
    : tool.examples;

  const displayExamples = examples.length > 0 ? examples : tool.examples;

  console.log();
  console.log(
    `${badge(tool.category)}  ${chalk.bold.white(tool.tool)}  ${chalk.dim(tool.description)}`
  );
  console.log(rule());

  for (const example of displayExamples) {
    renderExample(example);
  }

  console.log(rule());
  console.log();
}

export function renderExample(example: Example): void {
  console.log();
  console.log(`  ${chalk.dim("▸")} ${chalk.white(example.title)}${osBadge(example.os)}`);
  console.log(`    ${chalk.green.bold(example.command)}`);
}

export function renderNoResults(query: string): void {
  console.log();
  console.log(chalk.yellow("  No results found for: ") + chalk.bold(`"${query}"`));
  console.log(chalk.dim("  Try rephrasing — e.g. 'search file for text' or 'undo last commit'"));
  console.log(chalk.dim("  Or browse with: howdoi (no args)"));
  console.log();
}

export function renderWelcome(): void {
  console.log();
  console.log(chalk.bold.white("  howdoi") + chalk.dim(" — intent-based command discovery"));
  console.log(chalk.dim("  ") + rule(52));
  console.log();
}

export function renderList(
  tools: ToolEntry[],
  packageFilter?: string
): void {
  // Build: package → category → tools
  const packageMap = new Map<string, Map<string, ToolEntry[]>>();

  for (const tool of tools) {
    const pkg = tool.package ?? "unknown";

    // Apply package filter if given (match short name or full scoped name)
    if (packageFilter) {
      const short = pkg.replace("@howdoi-cli/", "");
      if (short !== packageFilter && pkg !== packageFilter) continue;
    }

    if (!packageMap.has(pkg)) packageMap.set(pkg, new Map());
    const catMap = packageMap.get(pkg)!;

    if (!catMap.has(tool.category)) catMap.set(tool.category, []);
    catMap.get(tool.category)!.push(tool);
  }

  const filteredTools = packageFilter
    ? tools.filter(t => {
        const short = (t.package ?? "").replace("@howdoi-cli/", "");
        return short === packageFilter || t.package === packageFilter;
      })
    : tools;
  const packageCount = packageMap.size;

  if (packageMap.size === 0) {
    console.log();
    if (packageFilter) {
      console.log(chalk.yellow(`  No tools found for package: `) + chalk.bold(`"${packageFilter}"`));
      console.log(chalk.dim(`  Available packages: ${Object.keys(PACKAGE_CATEGORY_MAP).map(p => p.replace("@howdoi-cli/", "")).join(", ")}`));
    } else {
      console.log(chalk.yellow("  No tools found."));
    }
    console.log();
    return;
  }

  console.log();

  // Render packages in a consistent order
  const packageOrder = Object.keys(PACKAGE_CATEGORY_MAP);
  const sortedPackages = [...packageMap.keys()].sort(
    (a, b) => packageOrder.indexOf(a) - packageOrder.indexOf(b)
  );

  for (const pkg of sortedPackages) {
    const catMap = packageMap.get(pkg)!;

    // Package header
    console.log(chalk.bold.white(`  ${pkg}`));
    console.log(chalk.dim("  " + "─".repeat(50)));

    // Categories in canonical order
    const sortedCats = [...catMap.keys()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    );

    for (const cat of sortedCats) {
      const catTools = catMap.get(cat)!;
      console.log();
      console.log(`    ${chalk.bold.yellow(CATEGORY_LABELS[cat] ?? cat)}`);

      for (const tool of catTools) {
        console.log(
          `      ${chalk.green(tool.tool.padEnd(22))} ${chalk.dim(tool.description)}`
        );
      }
    }

    console.log();
  }

  // Summary footer
  console.log(
    chalk.dim(`  ${filteredTools.length} tool${filteredTools.length !== 1 ? "s" : ""} across ${packageCount} package${packageCount !== 1 ? "s" : ""}`)
  );
  console.log();
}
