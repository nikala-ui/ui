// packages/docs/scripts/build.ts
import path from "node:path";
import { execSync } from "node:child_process";
import fs from "fs-extra";
import pc from "picocolors";

const rootDir = path.resolve(import.meta.dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const srcClientDir = path.resolve(rootDir, "src/client");
const srcClientPublicDir = path.join(srcClientDir, "public");
const distClientDir = path.resolve(distDir, "client");
const cliDistFile = path.resolve(distDir, "cli/index.js");
const srcRegistryDir = path.resolve(rootDir, "src/registry");
const srcComponentsDir = path.resolve(rootDir, "src/components");
const srcHooksDir = path.resolve(rootDir, "src/hooks");
const srcProvidersDir = path.resolve(rootDir, "src/providers");
const srcLibDir = path.resolve(rootDir, "src/lib");
console.log(pc.cyan("📦 Building @nikala-ui/docs..."));

// TypeScript does not remove files left behind by renames. Clean generated
// output first so stale casing variants (for example App.d.ts/app.d.ts) cannot
// leak into the published package or the monorepo TypeScript project.
fs.removeSync(distDir);

// 1. Run TypeScript compiler
try {
  execSync("bunx tsc -p tsconfig.build.json", {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch (err) {
  console.error(pc.red("✗ TypeScript build failed"));
  process.exit(1);
}

// 2. Copy client template assets (index.html, style.css, base.css)
try {
  fs.ensureDirSync(distClientDir);

  const indexHtmlSrc = path.join(srcClientDir, "index.html");
  const indexHtmlDist = path.join(distClientDir, "index.html");
  if (fs.existsSync(indexHtmlSrc)) {
    fs.copyFileSync(indexHtmlSrc, indexHtmlDist);
    console.log(`  ${pc.green("✓")} Synced ${pc.dim("dist/client/index.html")}`);
  }

  const styleCssSrc = path.join(srcClientDir, "style.css");
  const styleCssDist = path.join(distClientDir, "style.css");
  if (fs.existsSync(styleCssSrc)) {
    fs.copyFileSync(styleCssSrc, styleCssDist);
    console.log(`  ${pc.green("✓")} Synced ${pc.dim("dist/client/style.css")}`);
  }

  const baseCssSrc = path.join(srcClientDir, "base.css");
  const baseCssDist = path.join(distClientDir, "base.css");
  if (fs.existsSync(baseCssSrc)) {
    fs.copyFileSync(baseCssSrc, baseCssDist);
    console.log("  " + pc.green("✓") + " Synced " + pc.dim("dist/client/base.css"));
  }

  const publicDir = path.join(distClientDir, "public");
  if (fs.existsSync(srcClientPublicDir)) {
    fs.copySync(srcClientPublicDir, publicDir);
    console.log(`  ${pc.green("✓")} Synced ${pc.dim("dist/client/public")}`);
  }
} catch (err: any) {
  console.error(pc.red(`✗ Failed to sync client assets: ${err.message}`));
  process.exit(1);
}

// Bundle the Docs package's owned registry and source snapshots. The package
// must remain usable after extraction from this monorepo.
try {
  if (!fs.existsSync(srcRegistryDir) || !fs.existsSync(srcComponentsDir) || !fs.existsSync(srcHooksDir) || !fs.existsSync(srcProvidersDir)) {
    throw new Error("Nikala Docs local registry or source snapshots are missing");
  }
  await fs.remove(path.join(distDir, "registry"));
  await fs.remove(path.join(distDir, "vendor"));
  const docsSourceDir = path.join(distDir, "vendor/docs-src");
  await fs.copy(srcRegistryDir, path.join(distDir, "registry"));
  await fs.copy(srcComponentsDir, path.join(docsSourceDir, "components"));
  await fs.copy(srcHooksDir, path.join(docsSourceDir, "hooks"));
  await fs.copy(srcProvidersDir, path.join(docsSourceDir, "providers"));
  if (fs.existsSync(srcLibDir)) await fs.copy(srcLibDir, path.join(docsSourceDir, "lib"));
  console.log(`  ${pc.green("✓")} Bundled registry and local source snapshots`);
} catch (err: any) {
  console.error(pc.red(`✗ Failed to bundle registry sources: ${err.message}`));
  process.exit(1);
}

// 4. Make CLI binary executable
try {
  if (fs.existsSync(cliDistFile)) {
    fs.chmodSync(cliDistFile, 0o755);
    console.log(`  ${pc.green("✓")} Chmod executable permissions set on ${pc.dim("dist/cli/index.js")}`);
  }
} catch (err: any) {
  console.error(pc.red(`✗ Failed to set executable permissions: ${err.message}`));
  process.exit(1);
}

console.log(pc.green("✨ @nikala-ui/docs build complete!"));
