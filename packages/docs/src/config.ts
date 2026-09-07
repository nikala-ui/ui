// packages/docs/src/config.ts
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "fs-extra";
import type { DocsConfig } from "./types.js";

export const DEFAULT_DOCS_CONFIG: Required<Pick<DocsConfig, "title" | "description" | "contentDir" | "sidebar">> & DocsConfig = {
  title: "Nikala Docs",
  description: "Documentation built with Nikala UI",
  favicon: "/favicon.ico",
  contentDir: "docs",
  sidebar: "auto",
  navigation: {
    layout: "sidebar",
    sidebar: {
      header: true,
      footer: false,
      headerSubtitle: "Documentation",
      footerText: "Documentation",
    },
  },
  theme: {
    accentColor: "wine",
    grayColor: "zinc",
    defaultMode: "system",
  },
  shiki: {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    langs: [
      "typescript",
      "javascript",
      "tsx",
      "jsx",
      "bash",
      "json",
      "css",
      "html",
    ],
  },
  search: {
    enabled: true,
    provider: "local",
  },
};

export function defineDocsConfig(config: DocsConfig): DocsConfig {
  return config;
}

const CONFIG_FILENAMES = [
  "docs.config.ts",
  "docs.config.js",
  "docs.config.mjs",
  "nikala.docs.config.ts",
  "nikala.docs.config.js",
  "nikala.docs.config.mjs",
  // Backward compatibility for projects created before docs.config.ts.
  "nikala.config.ts",
  "nikala.config.js",
];

export const loadConfig = resolveDocsConfig;

export async function resolveDocsConfig(cwd: string = process.cwd()): Promise<DocsConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = path.join(cwd, filename);
    if (await fs.pathExists(fullPath)) {
      try {
        // Config is reloaded by the dev watcher without restarting the
        // process. Bust Bun/Node's ESM module cache so changed values apply.
        const mod = await import(`${pathToFileURL(fullPath).href}?t=${Date.now()}`);
        const resolvedUserConfig: DocsConfig = mod.default || mod.config || {};
        return {
          ...DEFAULT_DOCS_CONFIG,
          ...resolvedUserConfig,
          theme: {
          ...DEFAULT_DOCS_CONFIG.theme,
          ...resolvedUserConfig.theme,
        },
          navigation: {
            ...DEFAULT_DOCS_CONFIG.navigation,
            ...resolvedUserConfig.navigation,
            sidebar: {
              ...DEFAULT_DOCS_CONFIG.navigation?.sidebar,
              ...resolvedUserConfig.navigation?.sidebar,
            },
          },
          shiki: {
            ...DEFAULT_DOCS_CONFIG.shiki,
            ...resolvedUserConfig.shiki,
            themes: {
              ...DEFAULT_DOCS_CONFIG.shiki?.themes,
              ...resolvedUserConfig.shiki?.themes,
            },
          },
          search: {
            ...DEFAULT_DOCS_CONFIG.search,
            ...resolvedUserConfig.search,
          },
        };
      } catch (error) {
        console.warn(`[nikala-docs] Failed to load config from ${filename}:`, error);
      }
    }
  }

  return DEFAULT_DOCS_CONFIG;
}
