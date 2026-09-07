// packages/docs/src/mdx/highlighter.ts
import {
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from "shiki";
import { createBundledHighlighter } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ShikiConfig } from "../types.js";

let highlighterPromise: Promise<Highlighter> | null = null;
let activeShikiConfig: ShikiConfig | null = null;

const DEFAULT_BASE_LANGS: BundledLanguage[] = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "bash",
  "json",
  "css",
  "html",
  "markdown",
  "mdx",
  "rust",
  "python",
  "yaml",
  "toml",
  "sql",
  "diff",
];

const languageLoaders = {
  typescript: () => import("@shikijs/langs/typescript"),
  javascript: () => import("@shikijs/langs/javascript"),
  tsx: () => import("@shikijs/langs/tsx"),
  jsx: () => import("@shikijs/langs/jsx"),
  bash: () => import("@shikijs/langs/shellscript"),
  json: () => import("@shikijs/langs/json"),
  css: () => import("@shikijs/langs/css"),
  html: () => import("@shikijs/langs/html"),
  markdown: () => import("@shikijs/langs/markdown"),
  mdx: () => import("@shikijs/langs/mdx"),
  rust: () => import("@shikijs/langs/rust"),
  python: () => import("@shikijs/langs/python"),
  yaml: () => import("@shikijs/langs/yaml"),
  toml: () => import("@shikijs/langs/toml"),
  sql: () => import("@shikijs/langs/sql"),
  diff: () => import("@shikijs/langs/diff"),
  c: () => import("@shikijs/langs/c"),
  cpp: () => import("@shikijs/langs/cpp"),
  go: () => import("@shikijs/langs/go"),
  mermaid: () => import("@shikijs/langs/mermaid"),
  dockerfile: () => import("@shikijs/langs/docker"),
  zig: () => import("@shikijs/langs/zig"),
} as const;

const DEFAULT_LIGHT_THEME: BundledTheme = "github-light";
const DEFAULT_DARK_THEME: BundledTheme = "github-dark";

const themeLoaders = {
  "github-light": () => import("@shikijs/themes/github-light"),
  "github-dark": () => import("@shikijs/themes/github-dark"),
} as const;

const createDocsHighlighter = createBundledHighlighter({
  langs: languageLoaders,
  themes: themeLoaders,
  engine: () => createJavaScriptRegexEngine(),
});

export function configureDocsHighlighter(config: ShikiConfig): void {
  activeShikiConfig = config;
  highlighterPromise = null; // Re-initialize with new configuration
}

export async function getDocsHighlighter(config?: ShikiConfig): Promise<Highlighter> {
  const currentConfig = config || activeShikiConfig;

  if (!highlighterPromise) {
    const lightTheme = (currentConfig?.themes?.light as BundledTheme) || DEFAULT_LIGHT_THEME;
    const darkTheme = (currentConfig?.themes?.dark as BundledTheme) || DEFAULT_DARK_THEME;
    const initialLangs = (currentConfig?.langs as BundledLanguage[]) || DEFAULT_BASE_LANGS;

    highlighterPromise = createDocsHighlighter({
      themes: [lightTheme, darkTheme],
      langs: initialLangs,
    }) as Promise<Highlighter>;
  }

  return highlighterPromise;
}

/**
 * Ensures a language is loaded in Shiki on-demand.
 * If the language is bundled in Shiki, loads it dynamically.
 * Returns the resolved language identifier or "text" as fallback.
 */
export async function ensureLanguage(highlighter: Highlighter, rawLang: string): Promise<string> {
  const normalized = normalizeLangAlias(rawLang);

  if (!normalized || normalized === "text" || normalized === "txt" || normalized === "plain") {
    return "text";
  }

  const loaded = highlighter.getLoadedLanguages();
  if (loaded.includes(normalized)) {
    return normalized;
  }

  if (normalized in languageLoaders) {
    try {
      await highlighter.loadLanguage(normalized as keyof typeof languageLoaders);
      return normalized;
    } catch (err) {
      console.warn(`[nikala-docs] Failed to dynamically load Shiki language "${normalized}":`, err);
    }
  }

  return "text";
}

/**
 * Ensures a theme is loaded in Shiki on-demand.
 */
export async function ensureTheme(highlighter: Highlighter, themeName: string): Promise<string> {
  const loaded = highlighter.getLoadedThemes();
  if (loaded.includes(themeName)) {
    return themeName;
  }

  if (themeName in themeLoaders) {
    try {
      await highlighter.loadTheme(themeName as keyof typeof themeLoaders);
      return themeName;
    } catch (err) {
      console.warn(`[nikala-docs] Failed to dynamically load Shiki theme "${themeName}":`, err);
    }
  }

  return DEFAULT_DARK_THEME;
}

function normalizeLangAlias(lang: string): string {
  const l = lang.toLowerCase().trim();
  switch (l) {
    case "shell":
    case "sh":
    case "zsh":
      return "bash";
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "py":
      return "python";
    case "rs":
      return "rust";
    case "yml":
      return "yaml";
    case "md":
      return "markdown";
    case "rb":
      return "ruby";
    case "cs":
      return "csharp";
    default:
      return l;
  }
}

export interface HighlightOptions {
  lang?: string;
  filename?: string;
  themeLight?: string;
  themeDark?: string;
}

export async function highlightCode(code: string, options: HighlightOptions = {}): Promise<string> {
  const highlighter = await getDocsHighlighter();
  const rawLang = options.lang || "text";
  const targetLang = await ensureLanguage(highlighter, rawLang);

  const themeLight = options.themeLight
    ? await ensureTheme(highlighter, options.themeLight)
    : (activeShikiConfig?.themes?.light as BundledTheme) || DEFAULT_LIGHT_THEME;

  const themeDark = options.themeDark
    ? await ensureTheme(highlighter, options.themeDark)
    : (activeShikiConfig?.themes?.dark as BundledTheme) || DEFAULT_DARK_THEME;

  return highlighter.codeToHtml(code.trimEnd(), {
    lang: targetLang,
    themes: {
      light: themeLight,
      dark: themeDark,
    },
    defaultColor: false,
  });
}
