// packages/docs/src/core/content-scanner.ts
import path from "node:path";
import fs from "fs-extra";
import matter from "gray-matter";
import type { Frontmatter, PageData, TocItem } from "../types.js";

function isWhitespace(character: string): boolean {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return code === 9 || code === 10 || code === 11 || code === 12 || code === 13 || code === 32;
}

function isSlugCharacter(character: string): boolean {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || character === "_" || character === "-";
}

export function slugify(text: string): string {
  let result = "";
  for (const character of text.toLowerCase()) {
    if (isWhitespace(character)) {
      result += "-";
    } else if (isSlugCharacter(character)) {
      result += character;
    }
  }

  let start = 0;
  let end = result.length;
  while (start < end && result[start] === "-") start += 1;
  while (end > start && result[end - 1] === "-") end -= 1;
  return result.slice(start, end);
}

function parseHeading(line: string, minLevel: number, maxLevel: number): { level: number; text: string } | undefined {
  const trimmed = line.trim();
  let level = 0;
  while (level < trimmed.length && trimmed[level] === "#") level += 1;
  if (level < minLevel || level > maxLevel || !isWhitespace(trimmed[level])) return undefined;

  let start = level;
  while (start < trimmed.length && isWhitespace(trimmed[start])) start += 1;
  if (start === trimmed.length) return undefined;
  return { level, text: trimmed.slice(start).trim() };
}

function stripMarkdownLinks(text: string): string {
  let result = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] !== "[") {
      result += text[index++];
      continue;
    }

    const labelEnd = text.indexOf("]", index + 1);
    const linkStart = labelEnd + 1;
    if (labelEnd < 0 || text[linkStart] !== "(") {
      result += text[index++];
      continue;
    }

    const linkEnd = text.indexOf(")", linkStart + 1);
    if (linkEnd < 0) {
      result += text[index++];
      continue;
    }

    result += text.slice(index + 1, labelEnd);
    index = linkEnd + 1;
  }
  return result;
}

function stripMarkdownDecorators(text: string): string {
  let result = "";
  for (const character of text) {
    if (character !== "*" && character !== "_" && character !== "`") result += character;
  }
  return result;
}

export function extractToc(content: string): TocItem[] {
  const headings: TocItem[] = [];
  const slugCounts = new Map<string, number>();
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Match H2 and H3 headings: ## Title or ### Title
    const match = parseHeading(trimmed, 2, 3);
    if (match) {
      const level = match.level;
      let text = match.text;

      // Clean inline markdown links, bold, code wrappers
      text = stripMarkdownDecorators(stripMarkdownLinks(text));

      const baseId = slugify(text);
      if (baseId) {
        const occurrence = slugCounts.get(baseId) ?? 0;
        const id = occurrence === 0 ? baseId : `${baseId}-${occurrence}`;
        slugCounts.set(baseId, occurrence + 1);
        headings.push({
          id,
          text,
          depth: level,
        });
      }
    }
  }

  return headings;
}

export function extractTitle(content: string, fallback: string): string {
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = parseHeading(trimmed, 1, 1);
    if (match) {
      return stripMarkdownDecorators(match.text);
    }
  }

  return fallback;
}

export function filePathToUrl(relativeFilePath: string): string {
  let cleanPath = relativeFilePath.replace(/\\/g, "/");
  cleanPath = cleanPath.replace(/\.(mdx?)$/, "");

  if (cleanPath === "index" || cleanPath === "") {
    return "/";
  }

  if (cleanPath.endsWith("/index")) {
    cleanPath = cleanPath.slice(0, -6);
  }

  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

export function formatTitleFromFilename(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  if (base === "index") return "Overview";
  return base
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function parseMdxFile(filePath: string, contentDir: string): Promise<PageData> {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const frontmatter = (parsed.data || {}) as Frontmatter;
  const relativePath = path.relative(contentDir, filePath);
  const url = filePathToUrl(relativePath);
  const fallbackTitle = formatTitleFromFilename(filePath);
  const title = frontmatter.title || extractTitle(parsed.content, fallbackTitle);
  const toc = extractToc(parsed.content);

  return {
    slug: url === "/" ? "index" : url.slice(1).replace(/\//g, "-"),
    url,
    filePath,
    frontmatter,
    toc,
    title,
    description: frontmatter.description,
  };
}

export async function scanContent(contentDir: string): Promise<PageData[]> {
  if (!(await fs.pathExists(contentDir))) {
    return [];
  }

  const results: PageData[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        const page = await parseMdxFile(fullPath, contentDir);
        results.push(page);
      }
    }
  }

  await walk(contentDir);

  // Sort by URL depth and alphabetical order
  return results.sort((a, b) => {
    if (a.url === "/") return -1;
    if (b.url === "/") return 1;
    return a.url.localeCompare(b.url);
  });
}

export async function scanContentDirectories(contentDir: string): Promise<string[]> {
  if (!(await fs.pathExists(contentDir))) return [];

  const directories = new Set<string>();
  async function walk(dir: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      directories.add(path.relative(contentDir, fullPath).replace(/\\/g, "/"));
      await walk(fullPath);
    }
  }

  await walk(contentDir);
  return [...directories].sort();
}
