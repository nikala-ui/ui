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
const workspaceRoot = path.resolve(rootDir, "../..");
const coreRoot = path.join(workspaceRoot, "packages/core");
const hooksRoot = path.join(workspaceRoot, "packages/hooks");
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

// Bundle registry and source snapshots so published docs projects do not
// require @nikala-ui/core or @nikala-ui/hooks at runtime.
try {
  const registrySource = path.join(coreRoot, "registry");
  const coreSource = path.join(coreRoot, "src");
  const hooksSource = path.join(hooksRoot, "src");
  if (!fs.existsSync(registrySource) || !fs.existsSync(coreSource) || !fs.existsSync(hooksSource)) {
    throw new Error("Nikala UI registry sources are missing from the workspace");
  }
  await fs.remove(path.join(distDir, "registry"));
  await fs.remove(path.join(distDir, "vendor"));
  await fs.copy(registrySource, path.join(distDir, "registry"));
  await fs.copy(coreSource, path.join(distDir, "vendor/core-src"));
  await fs.copy(hooksSource, path.join(distDir, "vendor/hooks-src"));
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
