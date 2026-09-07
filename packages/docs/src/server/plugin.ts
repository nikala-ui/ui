import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import type { Plugin, ViteDevServer } from "vite";
import { scanContent, scanContentDirectories } from "../core/content-scanner.js";
import { buildSidebarTree } from "../core/route-tree.js";
import { compileMdx } from "../mdx/compiler.js";
import { loadConfig } from "../config.js";
import type { DocsConfig, PageData } from "../types.js";

export interface NikalaDocsPluginOptions {
  docsDir?: string;
  configRoot?: string;
  configFile?: string;
  config?: DocsConfig;
}

const VIRTUAL_CONFIG_ID = "virtual:nikala-docs-config";
const RESOLVED_CONFIG_ID = "\0" + VIRTUAL_CONFIG_ID;

const VIRTUAL_TREE_ID = "virtual:nikala-docs-tree";
const RESOLVED_TREE_ID = "\0" + VIRTUAL_TREE_ID;

const VIRTUAL_ROUTES_ID = "virtual:nikala-docs-routes";
const RESOLVED_ROUTES_ID = "\0" + VIRTUAL_ROUTES_ID;

const VIRTUAL_COMPONENTS_ID = "virtual:nikala-docs-components";
const RESOLVED_COMPONENTS_ID = "\0" + VIRTUAL_COMPONENTS_ID;

const VIRTUAL_THEME_ID = "virtual:nikala-docs-theme";
const RESOLVED_THEME_ID = "\0" + VIRTUAL_THEME_ID;

const VIRTUAL_SHIKI_ID = "virtual:nikala-docs-shiki-stub";
const RESOLVED_SHIKI_ID = "\0" + VIRTUAL_SHIKI_ID;

const CONFIG_FILENAMES = new Set([
  "docs.config.ts",
  "docs.config.js",
  "docs.config.mjs",
  "nikala.docs.config.ts",
  "nikala.docs.config.js",
  "nikala.docs.config.mjs",
  // Backward compatibility for older docs projects.
  "nikala.config.ts",
  "nikala.config.js",
]);

function findConfigFile(rootDir: string): string | undefined {
  return [...CONFIG_FILENAMES]
    .map((filename) => path.join(rootDir, filename))
    .find((file) => fs.existsSync(file));
}

function getTailwindSourceDirectives(rootDir: string, docsDir: string): string {
  const sources: string[] = [];
  const bundledCoreSource = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../vendor/core-src");
  if (fs.existsSync(bundledCoreSource)) sources.push(bundledCoreSource);
  sources.push(path.resolve(rootDir, "src"));

  const themesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../themes");
  if (fs.existsSync(themesDir)) sources.push(themesDir);
  if (docsDir && fs.existsSync(docsDir)) sources.push(docsDir);

  return sources
    .map((src) => `@source "${src}";`)
    .join("\n");
}

function getComponentSourceDir(rootDir: string): string {
  const localSource = path.resolve(rootDir, "src/components/ui");
  if (fs.existsSync(localSource)) return localSource;

  const bundledSource = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../vendor/core-src/registry/components/ui");
  if (fs.existsSync(bundledSource)) return bundledSource;

  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../core/src/registry/components/ui");
}

function collectComponentExports(directory: string): Array<{ name: string; file: string }> {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:tsx?|jsx?)$/.test(entry.name) && !/^index\./.test(entry.name))
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      const source = fs.readFileSync(file, "utf8");
      const names = new Set<string>();
      for (const match of source.matchAll(/export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_$]*)/g)) {
        names.add(match[1]);
      }
      for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const name of match[1].split(",")) {
          const exported = name.trim().split(/\s+as\s+/).at(-1);
          if (exported && /^[A-Z][A-Za-z0-9_$]*$/.test(exported)) names.add(exported);
        }
      }
      return [...names].sort().map((name) => ({ name, file }));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function collectSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(file);
    return entry.isFile() && /\.(?:tsx?|jsx?)$/.test(entry.name) ? [file] : [];
  });
}

function resolveComponentFile(directory: string, importPath: string): string | undefined {
  const base = path.join(directory, importPath);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx"].map((extension) => base + extension),
    ...["index.ts", "index.tsx", "index.js", "index.jsx"].map((entry) => path.join(base, entry)),
  ];
  return candidates.find((file) => fs.existsSync(file));
}

function collectStaticComponentFiles(componentDir: string, themeDirs: string[]): Set<string> {
  const staticFiles = new Set<string>();
  const pending = themeDirs.flatMap((directory) => collectSourceFiles(directory));

  while (pending.length) {
    const file = pending.pop()!;
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/from\s+["']@\/components\/ui\/([^"']+)["']/g)) {
      const importedFile = resolveComponentFile(componentDir, match[1]);
      if (importedFile && !staticFiles.has(importedFile)) {
        staticFiles.add(importedFile);
        pending.push(importedFile);
      }
    }
    for (const match of source.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)) {
      const importedFile = resolveComponentFile(path.dirname(file), match[1]);
      if (importedFile && importedFile.startsWith(`${path.resolve(componentDir)}${path.sep}`) && !staticFiles.has(importedFile)) {
        staticFiles.add(importedFile);
        pending.push(importedFile);
      }
    }
  }

  return staticFiles;
}

export function nikalaDocsPlugin(options: NikalaDocsPluginOptions = {}): Plugin {
  // Vite's root is the docs engine client directory. It is not the user's
  // project root, so content/config paths must always resolve from configRoot.
  let rootDir = path.resolve(options.configRoot || process.cwd());
  let docsDir = options.docsDir ? path.resolve(rootDir, options.docsDir) : path.resolve(rootDir, "docs");
  let resolvedConfig: DocsConfig = options.config || { title: "Nikala Docs" };
  let cachedPages: PageData[] = [];

  return {
    name: "vite-plugin-nikala-docs",
    enforce: "pre",

    async configResolved(viteConfig) {
      // Keep Vite's internal root separate from the consuming project's root.
      // Otherwise a relative contentDir could resolve under packages/docs.
      rootDir = path.resolve(options.configRoot || process.cwd());
      if (!options.docsDir) {
        // The config is authoritative for new projects; keep legacy auto-detection.
        const fs = await import("fs-extra");
        if (!options.config) {
          resolvedConfig = await loadConfig(options.configRoot || rootDir);
        }
        if (resolvedConfig.contentDir) {
          docsDir = path.resolve(rootDir, resolvedConfig.contentDir);
        } else if (await fs.pathExists(path.resolve(rootDir, "docs"))) {
          docsDir = path.resolve(rootDir, "docs");
        } else if (await fs.pathExists(path.resolve(rootDir, "content"))) {
          docsDir = path.resolve(rootDir, "content");
        } else {
          docsDir = rootDir;
        }
      } else {
        docsDir = path.resolve(rootDir, options.docsDir);
      }

    },

    resolveId(id, importer) {
      if (id === "shiki" || id.startsWith("shiki/")) {
        if (importer && (importer.includes("/mdx/") || importer.includes("\\mdx\\"))) {
          return null;
        }
        return RESOLVED_SHIKI_ID;
      }
      if (id === VIRTUAL_CONFIG_ID) return RESOLVED_CONFIG_ID;
      if (id === VIRTUAL_TREE_ID) return RESOLVED_TREE_ID;
      if (id === VIRTUAL_ROUTES_ID) return RESOLVED_ROUTES_ID;
      if (id === VIRTUAL_COMPONENTS_ID) return RESOLVED_COMPONENTS_ID;
      if (id === VIRTUAL_THEME_ID) return RESOLVED_THEME_ID;
      return null;
    },

    async load(id) {
      if (id === RESOLVED_SHIKI_ID) {
        return `
export const createHighlighter = async () => null;
export const bundledLanguages = {};
export const bundledThemes = {};
export default { createHighlighter, bundledLanguages, bundledThemes };
`;
      }

      if (id === RESOLVED_CONFIG_ID) {
        const configFile = findConfigFile(rootDir);
        if (!configFile) return `export default ${JSON.stringify(resolvedConfig)};`;

        return `
import userConfig from ${JSON.stringify(configFile)};
const defaults = ${JSON.stringify(resolvedConfig)};
const config = {
  ...defaults,
  ...userConfig,
  navigation: {
    ...defaults.navigation,
    ...userConfig.navigation,
    sidebar: { ...defaults.navigation?.sidebar, ...userConfig.navigation?.sidebar },
  },
  theme: { ...defaults.theme, ...userConfig.theme },
  shiki: {
    ...defaults.shiki,
    ...userConfig.shiki,
    themes: { ...defaults.shiki?.themes, ...userConfig.shiki?.themes },
  },
  search: { ...defaults.search, ...userConfig.search },
};
export default config;
`;
      }

      if (id === RESOLVED_TREE_ID) {
        cachedPages = await scanContent(docsDir);
        const directories = await scanContentDirectories(docsDir);
        const tree = buildSidebarTree(cachedPages, directories);
        return `
export const pages = ${JSON.stringify(cachedPages)};
export const tree = ${JSON.stringify(tree)};
export default { pages, tree };
`;
      }

      if (id === RESOLVED_ROUTES_ID) {
        cachedPages = await scanContent(docsDir);
        const routeEntries = cachedPages.map((page) =>
          `  ${JSON.stringify(page.url)}: () => import(${JSON.stringify(page.filePath)})`
        );

        return `
export const routes = {
${routeEntries.join(",\n")}
};
export default routes;
`;
      }

      if (id === RESOLVED_COMPONENTS_ID) {
        const componentDir = getComponentSourceDir(rootDir);
        const themeDirs = [
          path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../themes/default"),
          path.resolve(rootDir, "src/themes/default"),
        ];
        if (resolvedConfig.theme?.path) {
          const configuredTheme = path.resolve(rootDir, resolvedConfig.theme.path);
          themeDirs.push(fs.existsSync(configuredTheme) && fs.statSync(configuredTheme).isDirectory()
            ? configuredTheme
            : path.dirname(configuredTheme));
        }
        const staticFiles = collectStaticComponentFiles(componentDir, themeDirs);
        const modules = new Map<string, { index: number; file: string; isStatic: boolean }>();
        const exports = collectComponentExports(getComponentSourceDir(rootDir));
        for (const { file } of exports) {
          const existing = modules.get(file);
          if (!existing) modules.set(file, { index: modules.size, file, isStatic: staticFiles.has(file) });
        }
        const moduleEntries = [...modules.values()];
        const imports = moduleEntries.map(({ index, file }) =>
          modules.get(file)!.isStatic
            ? `import * as componentModule${index} from ${JSON.stringify(file)};`
            : `const componentModule${index} = () => import(${JSON.stringify(file)});`
        );
        const entries = exports.map(({ name, file }) => {
          const module = modules.get(file)!;
          return module.isStatic
            ? `  ${JSON.stringify(name)}: componentModule${module.index}[${JSON.stringify(name)}]`
            : `  ${JSON.stringify(name)}: lazy(() => componentModule${module.index}().then((module) => ({ default: module[${JSON.stringify(name)}] })))`;
        });

        return `
import { lazy } from "solid-js";
${imports.join("\n")}
const components = {
${entries.join(",\n")}
};
export default components;
`;
      }

      if (id === RESOLVED_THEME_ID) {
        const configuredPath = resolvedConfig.theme?.path;
        if (!configuredPath) {
          const defaultEntry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../themes/default/index.js");
          return `import defaultTheme from ${JSON.stringify(defaultEntry)}; export const theme = defaultTheme; export default theme;`;
        }

        const requestedPath = path.resolve(options.configRoot || rootDir, configuredPath);
        const candidates = [
          requestedPath,
          path.join(requestedPath, "index.ts"),
          path.join(requestedPath, "index.tsx"),
          path.join(requestedPath, "index.js"),
          path.join(requestedPath, "index.jsx"),
        ];
        const themeEntry = candidates.find((candidate) => fs.existsSync(candidate));
        if (!themeEntry) throw new Error(`[nikala-docs] Theme path does not exist: ${requestedPath}`);
        return `import configuredTheme from ${JSON.stringify(themeEntry)}; export const theme = configuredTheme.default || configuredTheme; export default theme;`;
      }

      return null;
    },

    async transform(code, id, transformOptions) {
      const cssId = id.split("?", 1)[0];
      const packagedCss = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client/style.css");
      const baseCss = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client/base.css");
      const configuredCss = resolvedConfig.css
        ? path.resolve(rootDir, resolvedConfig.css)
        : packagedCss;
      if (cssId === packagedCss || cssId === configuredCss) {
        if (cssId === packagedCss && configuredCss !== packagedCss) {
          const sourceDirectives = getTailwindSourceDirectives(rootDir, docsDir);
          return {
            code: sourceDirectives + "\n@import " + JSON.stringify(configuredCss.replace(/\\/g, "/")) + ";\n@import " + JSON.stringify(baseCss.replace(/\\/g, "/")) + ";",
            map: null,
          };
        }

        const sourceDirectives = getTailwindSourceDirectives(rootDir, docsDir);

        return {
          code: `@import "tailwindcss";\n${sourceDirectives}\n${code.replace('@import "tailwindcss";', "")}`,
          map: null,
        };
      }

      // Compile Markdown / MDX files to SolidJS JSX
      if (/\.(md|mdx)$/.test(id)) {
        const isSsr = Boolean(transformOptions?.ssr);
        const result = await compileMdx(code, {
          filePath: id,
          development: !isSsr && process.env.NODE_ENV !== "production",
          shiki: resolvedConfig.shiki,
        });

        return {
          code: result.code,
          map: null,
        };
      }
      return null;
    },

    configureServer(server: ViteDevServer) {
      // Vite's root is the packaged client directory, so the consuming
      // project's config/content files are outside its default watch scope.
      // Register them explicitly for dev reloads.
      const configFiles = [...CONFIG_FILENAMES]
        .map((filename) => path.join(rootDir, filename))
        .filter((file) => fs.existsSync(file));
      if (configFiles.length) server.watcher.add(configFiles);
      if (docsDir && fs.existsSync(docsDir)) server.watcher.add(docsDir);
      const componentsDir = getComponentSourceDir(rootDir);
      if (componentsDir && fs.existsSync(componentsDir)) server.watcher.add(componentsDir);
      const configuredCss = resolvedConfig.css
        ? path.resolve(rootDir, resolvedConfig.css)
        : undefined;
      if (configuredCss && fs.existsSync(configuredCss)) server.watcher.add(configuredCss);

      let reloadTimer: ReturnType<typeof setTimeout> | undefined;

      const invalidateVirtualModules = (includeConfig = false, includeComponents = false) => {
        const modTree = server.moduleGraph.getModuleById(RESOLVED_TREE_ID);
        const modRoutes = server.moduleGraph.getModuleById(RESOLVED_ROUTES_ID);
        if (modTree) server.moduleGraph.invalidateModule(modTree);
        if (modRoutes) server.moduleGraph.invalidateModule(modRoutes);

        if (includeComponents) {
          const modComponents = server.moduleGraph.getModuleById(RESOLVED_COMPONENTS_ID);
          if (modComponents) server.moduleGraph.invalidateModule(modComponents);
        }

        if (includeConfig) {
          const modConfig = server.moduleGraph.getModuleById(RESOLVED_CONFIG_ID);
          const modTheme = server.moduleGraph.getModuleById(RESOLVED_THEME_ID);
          if (modConfig) server.moduleGraph.invalidateModule(modConfig);
          if (modTheme) server.moduleGraph.invalidateModule(modTheme);
        }

        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = undefined;
          server.ws.send({ type: "full-reload" });
        }, 75);
      };

      // Watch content directory for file additions or removals
      server.watcher.on("add", (file) => {
        if (/\.(md|mdx)$/.test(file)) {
          invalidateVirtualModules();
          return;
        }
        if (componentsDir && path.resolve(file).startsWith(`${path.resolve(componentsDir)}${path.sep}`)) {
          invalidateVirtualModules(false, true);
        }
      });

      server.watcher.on("unlink", (file) => {
        if (/\.(md|mdx)$/.test(file)) {
          invalidateVirtualModules();
          return;
        }
        if (componentsDir && path.resolve(file).startsWith(`${path.resolve(componentsDir)}${path.sep}`)) {
          invalidateVirtualModules(false, true);
        }
      });

      server.watcher.on("change", async (file) => {
        if (/\.(md|mdx)$/.test(file)) {
          invalidateVirtualModules();
          return;
        }
        if (componentsDir && path.resolve(file).startsWith(`${path.resolve(componentsDir)}${path.sep}`)) {
          invalidateVirtualModules(false, true);
          return;
        }
        if (CONFIG_FILENAMES.has(path.basename(file))) {
          if (!options.config) {
            resolvedConfig = await loadConfig(rootDir);
            if (resolvedConfig.contentDir) {
              docsDir = path.resolve(rootDir, resolvedConfig.contentDir);
            }
          }
          invalidateVirtualModules(true);
          return;
        }
        if (configuredCss && path.resolve(file) === configuredCss) {
          const cssModule = server.moduleGraph.getModuleById(configuredCss);
          if (cssModule) server.moduleGraph.invalidateModule(cssModule);
          invalidateVirtualModules();
        }
      });
    },

    handleHotUpdate({ file, server }) {
      const configuredCss = resolvedConfig.css
        ? path.resolve(rootDir, resolvedConfig.css)
        : undefined;
      if (configuredCss && path.resolve(file) === configuredCss) {
        const cssModules = server.moduleGraph.getModulesByFile(configuredCss);
        for (const module of cssModules || []) {
          server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
        return [];
      }
      return undefined;
    },
  };
}
