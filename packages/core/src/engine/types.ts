export interface Example {
  intent: string;
  title: string;
  command: string;
  os?: "linux" | "macos" | "linux-only" | "macos-only";
}

export interface ToolEntry {
  tool: string;
  category: string;
  description: string;
  package: string;
  intents: string[];
  examples: Example[];
}

export interface SearchResult {
  tool: ToolEntry;
  matchedIntent: string | undefined;
  score: number;
}

export interface KnowledgeBaseManifest {
  name: string;
  dataDir: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "file-management": "File Management",
  "text-processing": "Text Processing",
  "file-inspection": "File Inspection",
  "git":             "Git",
  "ssh":             "SSH",
  "docker":          "Docker",
  "networking":      "Networking",
};

export const CATEGORY_ORDER = [
  "file-management",
  "text-processing",
  "file-inspection",
  "git",
  "ssh",
  "docker",
  "networking",
];

// Which categories belong to which package — used by --list grouping
export const PACKAGE_CATEGORY_MAP: Record<string, string[]> = {
  "@howdoi-cli/unix":       ["file-management", "text-processing", "file-inspection"],
  "@howdoi-cli/git":        ["git"],
  "@howdoi-cli/ssh":        ["ssh"],
  "@howdoi-cli/docker":     ["docker"],
  "@howdoi-cli/networking": ["networking"],
};
