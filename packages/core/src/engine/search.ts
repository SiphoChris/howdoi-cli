import Fuse from "fuse.js";
import type { ToolEntry, SearchResult } from "./types.js";

interface IntentIndex {
  intent: string;
  tool: ToolEntry;
  isExampleIntent: boolean;
}

export class SearchEngine {
  private fuse: Fuse<IntentIndex>;
  private intentFuse: Fuse<{ intent: string }>;
  private index: IntentIndex[];
  private exampleIntents: string[];

  constructor(tools: ToolEntry[]) {
    this.index = [];

    for (const tool of tools) {
      const exampleIntents = new Set(tool.examples.map((e) => e.intent));

      this.index.push({ intent: tool.tool, tool, isExampleIntent: false });
      this.index.push({ intent: tool.description, tool, isExampleIntent: false });

      for (const intent of tool.intents) {
        this.index.push({
          intent,
          tool,
          isExampleIntent: exampleIntents.has(intent),
        });
      }
    }

    this.fuse = new Fuse(this.index, {
      keys: ["intent"],
      threshold: 0.45,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    });

    this.exampleIntents = [
      ...new Set(
        this.index
          .filter((i) => i.isExampleIntent)
          .map((i) => i.intent)
      ),
    ].sort();

    this.intentFuse = new Fuse(
      this.exampleIntents.map((i) => ({ intent: i })),
      {
        keys: ["intent"],
        threshold: 0.35,
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
      }
    );
  }

  search(query: string): SearchResult[] {
    const raw = this.fuse.search(query);
    const seen = new Map<string, SearchResult>();

    for (const r of raw) {
      const toolName = r.item.tool.tool;
      const score = r.score ?? 1;

      if (!seen.has(toolName) || score < (seen.get(toolName)!.score)) {
        seen.set(toolName, {
          tool: r.item.tool,
          matchedIntent: r.item.isExampleIntent ? r.item.intent : undefined,
          score,
        });
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.score - b.score);
  }

  suggestIntents(query: string): string[] {
    if (!query || query.trim().length < 2) return this.exampleIntents.slice(0, 10);
    return this.intentFuse.search(query).slice(0, 10).map((r) => r.item.intent);
  }

  getAllIntents(): string[] {
    return this.exampleIntents;
  }

  getToolsByCategory(): Map<string, ToolEntry[]> {
    const map = new Map<string, ToolEntry[]>();
    const seen = new Set<string>();

    for (const entry of this.index) {
      const tool = entry.tool;
      if (seen.has(tool.tool)) continue;
      seen.add(tool.tool);

      const list = map.get(tool.category) ?? [];
      list.push(tool);
      map.set(tool.category, list);
    }

    return map;
  }
}
