import fs from "fs-extra";
import path from "node:path";
import pc from "picocolors";
import type { RegistryIndex, RegistryItem } from "../src/registry/index.js";
import { COMPONENT_METADATA, BLOCK_METADATA } from "../src/registry/metadata.js";

/**
 * Recursively find all files in a directory matching an extension, sorted alphabetically.
 */
async function getFilesRecursively(dir: string, ext: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getFilesRecursively(fullPath, ext);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function toPascalCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Create starter MDX pages for UI registry items that do not have docs yet. */
async function generateDocsBoilerplates(cwd: string, items: RegistryIndex) {
  const docsComponentsDir = path.join(
    cwd,
    "..",
    "..",
    "apps",
    "web",
    "src",
    "docs",
    "components"
  );

  if (!(await fs.pathExists(path.dirname(docsComponentsDir)))) return;
  await fs.ensureDir(docsComponentsDir);

  const addedAt = new Date().toISOString().slice(0, 10);
  const uiItems = items.filter((item) => item.type === "registry:ui");
  let created = 0;

  for (const [index, item] of uiItems.entries()) {
    const outputPath = path.join(docsComponentsDir, `${item.name}.mdx`);
    const order = index + 1;

    if (await fs.pathExists(outputPath)) {
      const existing = await fs.readFile(outputPath, "utf-8");
      if (!/^order:\s*\d+/m.test(existing)) {
        const withOrder = existing.replace(/^(description:.*\n)/m, `$1order: ${order}\n`);
        await fs.writeFile(outputPath, withOrder);
        console.log(pc.green(`  ✓ Added order: ${order} to docs/components/${item.name}.mdx`));
      }
      continue;
    }

    const componentName = toPascalCase(item.name);
    const content = `---
title: ${item.title}
description: ${item.description}
order: ${order}
addedAt: ${addedAt}
---

<ComponentViewer
  name="${item.name}"
  title="${item.title}"
  command="bunx @nikala-ui/cli add ${item.name}"
  lang="tsx"
  code={\`// TODO: Add the primary ${item.title} example
\`}
>
  <div class="flex min-h-32 w-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
    Add ${item.title} preview
  </div>
</ComponentViewer>

## Usage

Import the component into your SolidJS application:

\`\`\`tsx
import { ${componentName} } from "@/components/ui/${item.name}";
\`\`\`

## Examples

### Example

Add the primary ${item.title} usage example here.

<ComponentViewer
  name="${item.name}-example"
  title="${item.title} example"
  command="bunx @nikala-ui/cli add ${item.name}"
  lang="tsx"
  code={\`// TODO: Add a ${item.title} example
\`}
>
  <div class="flex min-h-32 w-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
    Add ${item.title} preview
  </div>
</ComponentViewer>

## API Reference

<ApiTable title="${item.title}" items={[]} />
`;

    await fs.writeFile(outputPath, content);
    created += 1;
    console.log(pc.green(`  ✓ Generated docs/components/${item.name}.mdx (boilerplate)`));
  }

  if (created > 0) {
    console.log(pc.cyan(`  ✓ Generated ${created} missing component documentation boilerplates`));
  }
}

function toHookIdentifier(value: string) {
  const [prefix, ...parts] = value.split("-");
  return `${prefix}${parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;
}

/** Create separate starter MDX pages for hook registry items. */
async function generateHookDocsBoilerplates(cwd: string, items: RegistryIndex) {
  const docsHooksDir = path.join(
    cwd,
    "..",
    "..",
    "apps",
    "web",
    "src",
    "docs",
    "hooks"
  );

  if (!(await fs.pathExists(path.dirname(docsHooksDir)))) return;
  await fs.ensureDir(docsHooksDir);

  const addedAt = new Date().toISOString().slice(0, 10);
  const hookItems = items.filter((item) => item.type === "registry:hook");
  let created = 0;

  for (const [index, item] of hookItems.entries()) {
    const outputPath = path.join(docsHooksDir, `${item.name}.mdx`);
    if (await fs.pathExists(outputPath)) continue;

    const hookIdentifier = toHookIdentifier(item.name);
    const content = `---
title: ${item.title}
description: ${item.description}
order: ${index + 1}
addedAt: ${addedAt}
---

## Usage

Import the hook into your SolidJS application:

\`\`\`tsx
import { ${hookIdentifier} } from "@/hooks/${item.name}";
\`\`\`

## Example

Add the primary interactive example for ${item.title} here.

\`\`\`tsx
// TODO: Add a ${item.title} example
\`\`\`

## API Reference

<ApiTable title="${item.title}" items={[]} />
`;

    await fs.writeFile(outputPath, content);
    created += 1;
    console.log(pc.green(`  ✓ Generated docs/hooks/${item.name}.mdx (boilerplate)`));
  }

  if (created > 0) {
    console.log(pc.cyan(`  ✓ Generated ${created} missing hook documentation boilerplates`));
  }
}

/**
 * Main build process to transform TSX component and block files into JSON registry manifests.
 */
async function buildRegistry() {
  const cwd = process.cwd();
  const sourceDir = path.join(cwd, "src", "registry", "components", "ui");
  const blocksSourceDir = path.join(cwd, "src", "registry", "blocks");
  const providerDir = path.join(cwd, "src", "registry", "providers");
  const outputDir = path.join(cwd, "registry");

  console.log(pc.cyan("📦 Building Nikala UI Component Registry...\n"));

  await fs.ensureDir(outputDir);

  const indexList: RegistryIndex = [];

  // 1. Build UI Components (type: "registry:ui")
  if (await fs.pathExists(sourceDir)) {
    const entries = (await fs.readdir(sourceDir)).sort((a, b) => a.localeCompare(b));

    for (const entry of entries) {
      const fullEntryPath = path.join(sourceDir, entry);
      const isDir = (await fs.stat(fullEntryPath)).isDirectory();

      if (isDir) {
        const componentName = entry;
        const subFiles = await getFilesRecursively(fullEntryPath, "");
        const validSubFiles = subFiles.filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
        if (validSubFiles.length === 0) continue;

        const meta = COMPONENT_METADATA[componentName] || {
          title: componentName
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          description: `${componentName} component suite.`,
          dependencies: ["clsx", "tailwind-merge"],
        };

        const registryFiles = [];
        for (const subFile of validSubFiles) {
          const relToUi = path.relative(sourceDir, subFile).replace(/\\/g, "/");
          const subContent = await fs.readFile(subFile, "utf-8");
          registryFiles.push({
            path: `ui/${relToUi}`,
            content: subContent,
            type: "registry:ui" as const,
          });
        }

        const registryItem: RegistryItem = {
          name: componentName,
          title: meta.title,
          description: meta.description,
          type: "registry:ui",
          dependencies: meta.dependencies,
          registryDependencies: meta.registryDependencies,
          files: registryFiles,
        };

        const outputPath = path.join(outputDir, `${componentName}.json`);
        await fs.writeFile(outputPath, JSON.stringify(registryItem, null, 2));

        indexList.push({
          name: componentName,
          title: meta.title,
          description: meta.description,
          type: "registry:ui",
          dependencies: meta.dependencies,
          registryDependencies: meta.registryDependencies,
        });

        console.log(
          pc.green(
            `  ✓ Generated registry/${componentName}.json (directory: ${registryFiles.length} files)`
          )
        );
        continue;
      }

      if (!entry.endsWith(".tsx")) continue;

      let componentName = path.basename(entry, ".tsx");
      const filePath = path.join(sourceDir, entry);
      const content = await fs.readFile(filePath, "utf-8");

      if (componentName === "theme-toggle") {
        componentName = "theme-manager";
      }

      const meta = COMPONENT_METADATA[componentName] || {
        title: componentName.charAt(0).toUpperCase() + componentName.slice(1),
        description: `${componentName} component.`,
        dependencies: ["clsx", "tailwind-merge"],
      };

      const registryFiles = [
        {
          path: `ui/${entry}`,
          content,
          type: "registry:ui" as const,
        },
      ];

      // Include theme-provider.tsx, theme-script.tsx, and theme-transitions.ts if building theme-manager
      if (componentName === "theme-manager") {
        const scriptPath = path.join(providerDir, "theme-script.tsx");
        const transitionsPath = path.join(providerDir, "theme-transitions.ts");
        const providerPath = path.join(providerDir, "theme-provider.tsx");

        if (await fs.pathExists(scriptPath)) {
          const scriptContent = await fs.readFile(scriptPath, "utf-8");
          registryFiles.unshift({
            path: "providers/theme-script.tsx",
            content: scriptContent,
            type: "registry:ui" as const,
          });
        }

        if (await fs.pathExists(transitionsPath)) {
          const transitionContent = await fs.readFile(transitionsPath, "utf-8");
          registryFiles.unshift({
            path: "providers/theme-transitions.ts",
            content: transitionContent,
            type: "registry:ui" as const,
          });
        }

        if (await fs.pathExists(providerPath)) {
          const providerContent = await fs.readFile(providerPath, "utf-8");
          registryFiles.unshift({
            path: "providers/theme-provider.tsx",
            content: providerContent,
            type: "registry:ui" as const,
          });
        }
      }

      // Construct individual component registry item
      const registryItem: RegistryItem = {
        name: componentName,
        title: meta.title,
        description: meta.description,
        type: "registry:ui",
        dependencies: meta.dependencies,
        registryDependencies: meta.registryDependencies,
        files: registryFiles,
      };

      // Write component JSON manifest
      const outputPath = path.join(outputDir, `${componentName}.json`);
      await fs.writeFile(outputPath, JSON.stringify(registryItem, null, 2));

      // Add metadata entry to central index list
      indexList.push({
        name: componentName,
        title: meta.title,
        description: meta.description,
        type: "registry:ui",
        dependencies: meta.dependencies,
        registryDependencies: meta.registryDependencies,
      });

      console.log(pc.green(`  ✓ Generated registry/${componentName}.json`));
    }
  }

  // 2. Build Blocks (type: "registry:block")
  if (await fs.pathExists(blocksSourceDir)) {
    const blockFilePaths = (await getFilesRecursively(blocksSourceDir, ".tsx")).sort((a, b) =>
      a.localeCompare(b)
    );

    for (const filePath of blockFilePaths) {
      const relPath = path.relative(blocksSourceDir, filePath).replace(/\\/g, "/");
      const blockName = path.basename(filePath, ".tsx");
      const content = await fs.readFile(filePath, "utf-8");

      const meta = BLOCK_METADATA[blockName] || {
        title: blockName
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        description: `${blockName} block layout.`,
        dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
      };

      const registryItem: RegistryItem = {
        name: blockName,
        title: meta.title,
        description: meta.description,
        type: "registry:block",
        dependencies: meta.dependencies,
        registryDependencies: meta.registryDependencies,
        files: [
          {
            path: `blocks/${relPath}`,
            content,
            type: "registry:block" as const,
          },
        ],
      };

      const outputPath = path.join(outputDir, `${blockName}.json`);
      await fs.writeFile(outputPath, JSON.stringify(registryItem, null, 2));

      indexList.push({
        name: blockName,
        title: meta.title,
        description: meta.description,
        type: "registry:block",
        dependencies: meta.dependencies,
        registryDependencies: meta.registryDependencies,
      });

      console.log(pc.green(`  ✓ Generated registry/${blockName}.json (block)`));
    }
  }

  // 3. Generate Hook Registry items (type: "registry:hook")
  const { HOOK_METADATA } = await import("../src/registry/metadata.js");
  const hooksSourceDir = path.resolve(cwd, "../hooks/src");

  for (const [hookName, meta] of Object.entries(HOOK_METADATA)) {
    const hookFileName = `${hookName}.ts`;
    const hookFilePath = path.join(hooksSourceDir, hookFileName);
    const hookFiles = [];

    if (await fs.pathExists(hookFilePath)) {
      const hookContent = await fs.readFile(hookFilePath, "utf-8");
      hookFiles.push({
        path: `hooks/${hookFileName}`,
        content: hookContent,
        type: "registry:hook" as const,
      });
    }

    const registryItem: RegistryItem = {
      name: hookName,
      title: meta.title,
      description: meta.description,
      type: "registry:hook",
      dependencies: meta.dependencies,
      files: hookFiles,
    };

    const outputPath = path.join(outputDir, `${hookName}.json`);
    await fs.writeFile(outputPath, JSON.stringify(registryItem, null, 2));

    indexList.push({
      name: hookName,
      title: meta.title,
      description: meta.description,
      type: "registry:hook",
      dependencies: meta.dependencies,
    });

    console.log(pc.green(`  ✓ Generated registry/${hookName}.json`));
  }

  // 4. Write central registry/index.json
  const indexPath = path.join(outputDir, "index.json");
  await fs.writeFile(indexPath, JSON.stringify(indexList, null, 2));
  console.log(pc.green("  ✓ Generated registry/index.json"));

  // 5. Automatically sync UI components to apps/web/src/components/ui
  const webComponentsDir = path.join(cwd, "..", "..", "apps", "web", "src", "components", "ui");
  if (await fs.pathExists(webComponentsDir) && await fs.pathExists(sourceDir)) {
    await fs.copy(sourceDir, webComponentsDir, { overwrite: true });
    console.log(pc.green("  ✓ Synced UI components to apps/web/src/components/ui"));
  }

  // 6. Automatically sync Hooks to apps/web/src/hooks
  const webHooksDir = path.join(cwd, "..", "..", "apps", "web", "src", "hooks");
  if (await fs.pathExists(webHooksDir) && await fs.pathExists(hooksSourceDir)) {
    await fs.copy(hooksSourceDir, webHooksDir, { overwrite: true });
    console.log(pc.green("  ✓ Synced hooks to apps/web/src/hooks"));
  }

  // 7. Create missing component documentation pages without overwriting authored docs
  await generateDocsBoilerplates(cwd, indexList);

  // 8. Create separate missing hook documentation pages without overwriting authored docs
  await generateHookDocsBoilerplates(cwd, indexList);

  console.log(pc.cyan("\n✅ Registry build complete!"));
}

buildRegistry().catch((err) => {
  console.error(pc.red("❌ Error building registry:"), err);
  process.exit(1);
});
