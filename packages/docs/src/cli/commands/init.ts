import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import pc from "picocolors";

interface RegistryFile { path: string; content: string; }
interface RegistryItem {
  name?: string;
  type?: string;
  files?: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
}

async function listSourceFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await listSourceFiles(fullPath));
    else if (entry.isFile()) result.push(fullPath);
  }
  return result;
}

async function resolveRegistryDir(): Promise<string> {
  const commandDir = path.dirname(fileURLToPath(import.meta.url));
  const bundledRegistry = path.resolve(commandDir, "../../registry");
  if (await fs.pathExists(bundledRegistry)) return bundledRegistry;
  throw new Error("Nikala Docs registry is unavailable. Rebuild @nikala-ui/docs before running init.");
}

function runNikalaInit(root: string): void {
  let cliEntry: string;
  try {
    cliEntry = fileURLToPath(import.meta.resolve("@nikala-ui/cli"));
  } catch {
    const workspaceEntry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../cli/dist/index.js");
    if (!fs.existsSync(workspaceEntry)) {
      throw new Error("@nikala-ui/cli is required to initialize a docs project. Install it before running docs init.");
    }
    cliEntry = workspaceEntry;
  }
  console.log(`  ${pc.dim("↳ Running Nikala UI init --defaults")}`);
  execFileSync(process.execPath, [cliEntry, "init", "--defaults", "--skip-dependencies"], {
    cwd: root,
    stdio: "inherit",
  });
}

function installProjectDependencies(root: string): void {
  const manager = fs.existsSync(path.join(root, "bun.lockb")) || fs.existsSync(path.join(root, "bun.lock"))
    ? "bun"
    : fs.existsSync(path.join(root, "pnpm-lock.yaml"))
      ? "pnpm"
      : fs.existsSync(path.join(root, "yarn.lock"))
        ? "yarn"
        : "bun";
  console.log(`  ${pc.dim(`↳ Installing docs dependencies with ${manager}`)}`);
  try {
    execFileSync(manager, ["install"], { cwd: root, stdio: "inherit" });
  } catch {
    throw new Error(`Docs project dependencies could not be installed. Run \`${manager} install\` in ${root}.`);
  }
}

async function copyRegistrySource(root: string): Promise<{ componentFiles: string[]; hookFiles: string[]; dependencies: string[] }> {
  const registryDir = await resolveRegistryDir();
  const componentsDir = path.join(root, "src/components/ui");
  const hooksDir = path.join(root, "src/hooks");
  const commandDir = path.dirname(fileURLToPath(import.meta.url));
  const docsComponentSources = [
    path.resolve(commandDir, "../../../src/components/mdx-components.tsx"),
    path.resolve(commandDir, "../../components/mdx-components.jsx"),
  ].filter((file) => fs.existsSync(file));
  const projectFiles = [
    ...(await listSourceFiles(path.join(root, "docs"))),
    ...(await listSourceFiles(path.join(root, "src/themes/default"))),
    ...docsComponentSources,
  ];
  const projectSource = (await Promise.all(projectFiles.map((file) => fs.readFile(file, "utf-8")))).join("\n");
  const manifests = new Map<string, RegistryItem>();
  const exports = new Map<string, string>();

  for (const filename of (await fs.readdir(registryDir)).filter((name) => name.endsWith(".json") && name !== "index.json")) {
    const item = await fs.readJson(path.join(registryDir, filename)) as RegistryItem;
    const name = item.name || filename.replace(/\.json$/, "");
    manifests.set(name, item);
    for (const file of item.files || []) {
      for (const match of file.content.matchAll(/export\s+(?:const|function|class|type|interface)\s+([A-Za-z_$][\w$]*)/g)) {
        exports.set(match[1], name);
      }
    }
  }

  const selected = new Set<string>();
  const queue: string[] = [];
  const addByExport = (name: string) => {
    const itemName = exports.get(name) || (manifests.has(name) ? name : undefined);
    if (itemName && !selected.has(itemName)) queue.push(itemName);
  };

  for (const match of projectSource.matchAll(/@\/components\/ui\/([a-z0-9-]+)/g)) addByExport(match[1]);
  for (const match of projectSource.matchAll(/@\/hooks\/([a-z0-9-]+)/g)) addByExport(match[1]);
  for (const match of projectSource.matchAll(/import\s*{([^{}]*?)}\s*from\s*["']@\/components\/ui["']/g)) {
    for (const name of match[1].split(",")) addByExport(name.trim().split(/\s+as\s+/)[0]);
  }
  for (const match of projectSource.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)) addByExport(match[1]);
  for (const match of projectSource.matchAll(/\bCore\.([A-Z][A-Za-z0-9_]*)/g)) addByExport(match[1]);

  const requiredItems: RegistryItem[] = [];
  while (queue.length) {
    const name = queue.shift()!;
    if (selected.has(name)) continue;
    const item = manifests.get(name);
    if (!item) continue;
    selected.add(name);
    requiredItems.push(item);
    for (const dependency of item.registryDependencies || []) addByExport(dependency);
    const source = (item.files || []).map((file) => file.content).join("\n");
    for (const match of source.matchAll(/@\/components\/ui\/([a-z0-9-]+)/g)) addByExport(match[1]);
    for (const match of source.matchAll(/@\/hooks\/([a-z0-9-]+)/g)) addByExport(match[1]);
    for (const match of source.matchAll(/import\s*{([^{}]*?)}\s*from\s*["']@\/components\/ui["']/g)) {
      for (const imported of match[1].split(",")) addByExport(imported.trim().split(/\s+as\s+/)[0]);
    }
  }

  const componentFiles: string[] = [];
  const hookFiles: string[] = [];
  const dependencies = new Set<string>();
  for (const item of requiredItems) {
    for (const dependency of item.dependencies || []) dependencies.add(dependency);
    const targetDir = item.type === "registry:hook" ? hooksDir : item.type === "registry:ui" ? root : undefined;
    if (!targetDir || !item.files) continue;
    for (const file of item.files) {
      const relative = file.path.replace(/^(ui|hooks|providers)[\\/]/, "");
      const destination = file.path.startsWith("providers/")
        ? path.join(root, "src/providers", relative)
        : file.path.startsWith("ui/")
          ? path.join(componentsDir, relative)
          : path.join(hooksDir, relative);
      await fs.outputFile(destination, file.content, "utf-8");
      if (file.path.startsWith("hooks/")) hookFiles.push(relative.replace(/\.(tsx?|jsx?)$/, ""));
      else if (file.path.startsWith("ui/")) componentFiles.push(relative.replace(/\.(tsx?|jsx?)$/, ""));
    }
  }
  // These are Docs theme internals rather than public Nikala UI registry
  // entries, but the generated default theme imports them directly.
  const internalComponentCandidates = [
    path.resolve(commandDir, "../../vendor/docs-src/components/ui"),
    path.resolve(commandDir, "../../components/ui"),
  ];
  const internalComponentsSource = internalComponentCandidates.find((directory) => fs.existsSync(directory));
  if (internalComponentsSource) {
    for (const name of ["theme-toggle"]) {
      const source = path.join(internalComponentsSource, `${name}.tsx`);
      if (await fs.pathExists(source)) {
        await fs.copy(source, path.join(componentsDir, `${name}.tsx`));
        componentFiles.push(name);
      }
    }
  }
  const cnCandidates = [
    path.resolve(commandDir, "../../lib/cn.ts"),
    path.resolve(commandDir, "../../vendor/docs-src/lib/cn.ts"),
  ];
  const cnSource = cnCandidates.find((candidate) => fs.existsSync(candidate));
  if (cnSource) await fs.outputFile(path.join(root, "src/lib/cn.ts"), await fs.readFile(cnSource, "utf-8"), "utf-8");
  return { componentFiles, hookFiles, dependencies: [...dependencies].sort() };
}

async function copyCustomTheme(root: string): Promise<void> {
  const commandDir = path.dirname(fileURLToPath(import.meta.url));
  const sourceCandidates = [path.resolve(commandDir, "../../../src/themes/default"), path.resolve(commandDir, "../../themes/default")];
  const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));
  const target = path.join(root, "src/themes/default");
  if (!source) {
    await fs.outputFile(path.join(target, "index.ts"), `export { defaultTheme as default } from "@nikala-ui/docs";
`, "utf-8");
    return;
  }
  for (const sourceFile of await listSourceFiles(source)) {
    const basename = path.basename(sourceFile);
    const isSourceFile = /\.(ts|tsx)$/.test(sourceFile);
    const isPublishedThemeFile = /\.jsx$/.test(sourceFile) || basename === "index.js";
    if ((!isSourceFile && !isPublishedThemeFile) || basename !== basename.toLowerCase()) continue;
    const relative = path.relative(source, sourceFile).replace(/\.jsx$/, ".tsx").replace(/index\.js$/, "index.ts");
    const destination = path.join(target, relative);
    let content = await fs.readFile(sourceFile, "utf-8");
    content = content
      .replace(/from "@nikala-ui\/core\/ui\//g, 'from "@/components/ui/')
      .replace(/from "@nikala-ui\/core"/g, 'from "@/components/ui"')
      .replace(/from "@nikala-ui\/hooks"/g, 'from "@/hooks"')
      .replace(/from "\.\.\/\.\.\/\.\.\/navigation\/sidebar-state\.js"/g, 'from "./sidebar-state.js"')
      .replace(/from "(?:\.\.\/)+types\.js"/g, 'from "@nikala-ui/docs"')
      .replace(/from "(\.\.\/|\.\/)[^"]+\.(?:jsx|tsx|js)"/g, (match) => match.replace(/\.(?:jsx|tsx|js)"$/, '"'))
      .replace(/export \* from "(\.\.\/|\.\/)[^"]+\.(?:jsx|tsx|js)"/g, (match) => match.replace(/\.(?:jsx|tsx|js)"$/, '"'));
    await fs.outputFile(destination, content, "utf-8");
  }

  const navigationCandidates = [
    path.resolve(commandDir, "../../../src/navigation/sidebar-state.ts"),
    path.resolve(commandDir, "../../navigation/sidebar-state.js"),
  ];
  const navigationSource = navigationCandidates.find((candidate) => fs.existsSync(candidate));
  if (navigationSource) {
    const navigationContent = (await fs.readFile(navigationSource, "utf-8"))
      .replace(/from "\.\.\/types\.js"/g, 'from "@nikala-ui/docs"');
    await fs.outputFile(path.join(target, "navigation/sidebar-state.ts"), navigationContent, "utf-8");
  }
}

async function copyDefaultAssets(root: string): Promise<void> {
  const commandDir = path.dirname(fileURLToPath(import.meta.url));
  const sourceCandidates = [
    path.resolve(commandDir, "../../client/public/favicon.ico"),
    path.resolve(commandDir, "../../../src/client/public/favicon.ico"),
  ];
  const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));
  if (!source) return;

  const destination = path.join(root, "public/favicon.ico");
  if (!(await fs.pathExists(destination))) await fs.copy(source, destination);
}

async function writeProjectFiles(root: string, registryDependencies: string[]): Promise<void> {
  const docsConfigPath = path.join(root, "docs.config.ts");
  if (!(await fs.pathExists(docsConfigPath))) await fs.outputFile(docsConfigPath, `export default {
  title: "My Project Docs",
  description: "Documentation built with Nikala Docs and SolidJS",
  favicon: "/favicon.ico",
  contentDir: "docs",
  css: "src/index.css",
  home: { layout: "landing", showSidebar: false, showNavbar: true, showBreadcrumbs: false, showToc: false, showPager: false },
  theme: { path: "./src/themes/default" },
  nav: [{ title: "Home", href: "/" }],
  navigation: { layout: "sidebar", sidebar: { header: true, footer: false, headerSubtitle: "Documentation", footerText: "Documentation" } },
  search: { enabled: true },
};
`, "utf-8");
  const nikalaConfigPath = path.join(root, "nikala.config.json");
  if (!(await fs.pathExists(nikalaConfigPath))) {
    await fs.writeJson(nikalaConfigPath, {
      $schema: "https://nikala.dev/schema.json",
      style: "default",
      baseColor: "neutral",
      primaryColor: "amber",
      css: "src/index.css",
      alias: {
        components: "src/components/ui",
        utils: "src/lib",
      },
    }, { spaces: 2 });
  }
  const packagePath = path.join(root, "package.json");
  const commandDir = path.dirname(fileURLToPath(import.meta.url));
  const docsPackageRoot = path.resolve(commandDir, "../../..");
  const workspaceRoot = path.resolve(docsPackageRoot, "../..");
  const isWorkspacePackage = await fs.pathExists(path.join(docsPackageRoot, "src"));
  const targetIsInWorkspace = root === workspaceRoot || root.startsWith(`${workspaceRoot}${path.sep}`);
  const defaultPackageJson = {
    name: "nikala-docs-example",
    private: true,
    type: "module",
  scripts: { dev: "bunx @nikala-ui/docs dev", build: "bunx @nikala-ui/docs build", preview: "bunx @nikala-ui/docs preview" },
    dependencies: {},
  };
  const existingPackageJson = await fs.pathExists(packagePath) ? await fs.readJson(packagePath) : {};
  const packageJson = {
    ...defaultPackageJson,
    ...existingPackageJson,
    scripts: { ...defaultPackageJson.scripts, ...existingPackageJson.scripts },
  };
  const localDocsLink = path.join(root, "node_modules/@nikala-ui/docs");
  const hasLocalDocsLink = await fs.pathExists(localDocsLink) && (await fs.lstat(localDocsLink)).isSymbolicLink();
  const docsDependency = hasLocalDocsLink
    ? "link:@nikala-ui/docs"
    : isWorkspacePackage
      ? targetIsInWorkspace
        ? "workspace:*"
        : "link:@nikala-ui/docs"
      : packageJson.dependencies?.["@nikala-ui/docs"] || "latest";
  packageJson.dependencies = {
    ...packageJson.dependencies,
    "@nikala-ui/docs": docsDependency,
    ...(packageJson.dependencies?.["solid-js"] ? {} : { "solid-js": "latest" }),
    ...(packageJson.dependencies?.tailwindcss ? {} : { tailwindcss: "latest" }),
    ...Object.fromEntries(registryDependencies
      .filter((dependency) => !packageJson.dependencies?.[dependency])
      .map((dependency) => [dependency, "latest"])),
  };
  await fs.writeJson(packagePath, packageJson, { spaces: 2 });
  await fs.outputFile(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "preserve", jsxImportSource: "solid-js", strict: true, skipLibCheck: true, paths: { "@/*": ["./src/*"], "@/components/ui/*": ["./src/components/ui/*"], "@/hooks/*": ["./src/hooks/*"] } },
    include: ["src/**/*", "docs.config.ts"],
  }, null, 2) + "\n", "utf-8");
}

export async function runInitCommand(targetDir = "."): Promise<void> {
  const root = path.resolve(process.cwd(), targetDir);
  console.log();
  console.log(pc.bold(pc.cyan("  Nikala Docs Engine ")) + pc.dim("v0.12.2"));
  console.log(pc.dim(`  Initializing copy-paste documentation project in ${pc.bold(root)}...`));
  console.log();
  await fs.ensureDir(root);
  runNikalaInit(root);
  await writeProjectFiles(root, []);
  const indexPath = path.join(root, "docs/index.mdx");
  if (!(await fs.pathExists(indexPath))) await fs.outputFile(indexPath, `---
title: Introduction
description: Welcome to your copy-paste documentation site.
order: 1
---

# Introduction

Your Nikala UI components and reactive hooks are owned locally in **src/components/ui** and **src/hooks**.

<Callout type="tip">
  Add documentation pages under **docs**. Folders become collapsible sidebar categories automatically.
</Callout>
  `, "utf-8");
  await copyCustomTheme(root);
  await copyDefaultAssets(root);
  const copied = await copyRegistrySource(root);
  await writeProjectFiles(root, copied.dependencies);
  installProjectDependencies(root);
  console.log(`  ${pc.green("✓")} Copied ${copied.componentFiles.length} UI sources and ${copied.hookFiles.length} hook sources`);
  console.log(`  ${pc.green("✓")} Registered ${copied.dependencies.length} component dependencies`);
  console.log(`  ${pc.green("✓")} Created ${pc.cyan("docs")}, ${pc.cyan("src/themes/default")}, and local Tailwind tokens`);
  console.log();
  console.log(`  ${pc.bold(pc.green("Success!"))} Run ${pc.cyan("bunx @nikala-ui/docs dev")} to start your docs.`);
  console.log();
}
