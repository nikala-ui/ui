// packages/docs/src/server/index.ts
import path from "node:path";
import os from "node:os";
import { createServer as createHttpServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer, build, type ViteDevServer, type InlineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs-extra";
import matter from "gray-matter";
import { nikalaDocsPlugin } from "./plugin.js";
import type { DocsConfig } from "../types.js";
import { loadConfig } from "../config.js";
import { scanContent } from "../core/content-scanner.js";

export interface DocsServerOptions {
  root?: string;
  docsDir?: string;
  port?: number;
  host?: string | boolean;
  open?: boolean;
  config?: DocsConfig;
  outDir?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getClientDir(): string {
  const distClient = path.resolve(__dirname, "../client");
  if (fs.existsSync(distClient)) return distClient;
  return path.resolve(__dirname, "../../src/client");
}

function getSolidJsDir(): string {
  try {
    const entry = fileURLToPath(import.meta.resolve("solid-js"));
    return path.dirname(path.dirname(entry));
  } catch {
    return "";
  }
}

function getDocsPackageRoot(): string {
  return path.resolve(__dirname, "../..");
}

function getCoreSrcDir(): string {
  try {
    const bundled = path.resolve(__dirname, "../vendor/core-src");
    if (fs.existsSync(bundled)) return bundled;
    const entry = fileURLToPath(import.meta.resolve("@nikala-ui/core"));
    return path.dirname(entry);
  } catch {
    return path.resolve(__dirname, "../../../core/src");
  }
}

function getHooksSrcDir(): string {
  try {
    const bundled = path.resolve(__dirname, "../vendor/hooks-src");
    if (fs.existsSync(bundled)) return bundled;
    const entry = fileURLToPath(import.meta.resolve("@nikala-ui/hooks"));
    return path.dirname(entry);
  } catch {
    return path.resolve(__dirname, "../../../hooks/src");
  }
}

function createLocalBarrelPlugin(
  componentsSource: string,
  hooksSource: string,
  libSource: string,
  providersSource: string,
) {
  const componentModule = "\0nikala-docs-local-components";
  const hooksModule = "\0nikala-docs-local-hooks";

  const exportsFor = (directory: string, namedOnly?: string): string => {
    if (!fs.existsSync(directory)) return "";
    const files = fs.readdirSync(directory)
      .filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file) && !/^index\./.test(file))
      .sort();
    return files
      .map((file) => `export * from ${JSON.stringify(path.join(directory, file))};`)
      .concat(namedOnly && fs.existsSync(namedOnly) ? [`export { cn } from ${JSON.stringify(namedOnly)};`] : [])
      .join("\n");
  };

  return {
    name: "nikala-docs-local-barrels",
    resolveId(source: string) {
      if (source === "@/components/ui") return componentModule;
      if (source === "@/hooks") return hooksModule;
      return undefined;
    },
    load(id: string) {
      if (id === componentModule) {
        return [
          exportsFor(componentsSource, path.join(libSource, "cn.ts")),
          exportsFor(providersSource),
        ].filter(Boolean).join("\n");
      }
      if (id === hooksModule) return exportsFor(hooksSource);
      return undefined;
    },
  };
}

function resolveSourceFile(directory: string, relativePath: string): string | undefined {
  const base = path.join(directory, relativePath);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx"].map((extension) => base + extension),
    ...["index.ts", "index.tsx", "index.js", "index.jsx"].map((entry) => path.join(base, entry)),
  ];
  return candidates.find((file) => fs.existsSync(file));
}

function createLocalHooksFallbackPlugin(localHooks: string, bundledHooks: string) {
  return {
    name: "nikala-docs-local-hooks-fallback",
    enforce: "pre" as const,
    resolveId(source: string) {
      if (source.startsWith("@/hooks/")) {
        const relativePath = source.slice("@/hooks/".length);
        return resolveSourceFile(localHooks, relativePath) || resolveSourceFile(bundledHooks, relativePath);
      }

      const localPrefix = `${localHooks}${path.sep}`;
      if (source.startsWith(localPrefix) && !resolveSourceFile(localHooks, source.slice(localPrefix.length))) {
        return resolveSourceFile(bundledHooks, source.slice(localPrefix.length));
      }

      return undefined;
    },
  };
}

function getSharedConfig(options: DocsServerOptions, isDev = false, isSSR = false): InlineConfig {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const clientDir = getClientDir();
  const publicDir = path.join(root, "public");
  const solidJsDir = getSolidJsDir();
  const coreSrc = getCoreSrcDir();
  const hooksSrc = getHooksSrcDir();
  const localSrc = path.join(root, "src");
  const localComponents = path.join(localSrc, "components", "ui");
  const localHooks = path.join(localSrc, "hooks");
  const localLib = path.join(localSrc, "lib");
  const localProviders = path.join(localSrc, "providers");
  const componentsSrc = fs.existsSync(localComponents) ? localComponents : path.join(coreSrc, "registry/components/ui");
  const hooksSource = fs.existsSync(localHooks) ? localHooks : hooksSrc;
  const libSource = fs.existsSync(localLib) ? localLib : path.join(coreSrc, "lib");
  const providersSource = fs.existsSync(localProviders) ? localProviders : path.join(coreSrc, "registry/providers");

  const aliases: any[] = [];
  if (solidJsDir) {
    const webEntry = isSSR ? "web/dist/server.js" : isDev ? "web/dist/dev.js" : "web/dist/web.js";
    const storeEntry = isSSR ? "store/dist/server.js" : isDev ? "store/dist/dev.js" : "store/dist/store.js";
    const solidEntry = isSSR ? "dist/server.js" : isDev ? "dist/dev.js" : "dist/solid.js";
    aliases.push(
      { find: "solid-js/web", replacement: path.join(solidJsDir, webEntry) },
      { find: "solid-js/store", replacement: path.join(solidJsDir, storeEntry) },
      { find: "solid-js/html", replacement: path.join(solidJsDir, "html/dist/html.js") },
      { find: "solid-js/h", replacement: path.join(solidJsDir, "h/dist/h.js") },
      { find: "solid-js", replacement: path.join(solidJsDir, solidEntry) }
    );
  }

  if (coreSrc) {
    aliases.push(
      { find: "@/lib", replacement: libSource },
      { find: "@/providers", replacement: providersSource },
      { find: /^@\/components\/ui\/(.*)$/, replacement: path.join(componentsSrc, "$1") }
    );
  }

  if (hooksSrc) {
    aliases.push(
      { find: /^@\/hooks\/(.*)$/, replacement: path.join(hooksSource, "$1") },
      { find: "@nikala-ui/hooks", replacement: path.join(hooksSource, "index.ts") },
    );
  }

  return {
    root: clientDir,
    publicDir: fs.existsSync(publicDir) ? publicDir : path.join(clientDir, "public"),
    resolve: {
      alias: aliases,
      dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
      conditions: isSSR ? ["node"] : isDev ? ["development", "browser"] : ["production", "browser"],
    },
    optimizeDeps: {
      exclude: ["shiki"],
    },
    plugins: [
      createLocalHooksFallbackPlugin(localHooks, hooksSrc),
      createLocalBarrelPlugin(componentsSrc, hooksSource, libSource, providersSource),
      nikalaDocsPlugin({
        docsDir: options.docsDir ? path.resolve(root, options.docsDir) : undefined,
        configRoot: root,
        config: options.config,
      }),
      tailwindcss(),
      solidPlugin({
        extensions: [".tsx", ".jsx", ".mdx", ".md"],
        ssr: isSSR,
        dev: isDev && !isSSR,
        hot: isDev && !isSSR,
      }),
    ],
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtmlTags(value: string): string {
  let result = "";
  let index = 0;
  while (index < value.length) {
    if (value[index] !== "<") {
      result += value[index++];
      continue;
    }

    let quote = "";
    let end = index + 1;
    for (; end < value.length; end += 1) {
      const character = value[end];
      if ((character === '"' || character === "'") && !quote) quote = character;
      else if (character === quote) quote = "";
      else if (character === ">" && !quote) break;
    }

    if (end >= value.length) {
      result += value[index++];
    } else {
      index = end + 1;
    }
  }
  return result;
}

function safeHref(value: string): string {
  const href = value.trim();
  if (!href) return "#";

  try {
    const protocol = new URL(href, "https://nikala-docs.invalid").protocol;
    if (protocol !== "http:" && protocol !== "https:" && protocol !== "mailto:") return "#";
  } catch {
    return "#";
  }

  return href;
}

function renderInlineMarkdown(value: string): string {
  const withoutComponents = stripHtmlTags(value);
  return escapeHtml(withoutComponents)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => `<a href="${escapeHtml(safeHref(href))}">${label}</a>`);
}

async function renderStaticPage(filePath: string): Promise<string> {
  const source = matter(await fs.readFile(filePath, "utf-8")).content;
  const lines = source.split(/\r?\n/);
  const output: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | undefined;
  let codeLanguage = "";

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      output.push(`<ul>${list.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const line of lines) {
    const fence = line.match(/^\s*```(.*)$/);
    if (fence) {
      flushParagraph();
      flushList();
      if (code) {
        output.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(code.join("\n"))}</code></pre>`);
        code = undefined;
        codeLanguage = "";
      } else {
        code = [];
        codeLanguage = fence[1].trim();
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].replace(/[*_`]/g, "");
      const id = text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      output.push(`<h${heading[1].length} id="${escapeHtml(id)}"><a href="#${escapeHtml(id)}">${renderInlineMarkdown(text)}</a></h${heading[1].length}>`);
      continue;
    }

    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return output.join("\n");
}

async function findFile(dir: string, filename: string): Promise<string | undefined> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === filename) return fullPath;
    if (entry.isDirectory()) {
      const found = await findFile(fullPath, filename);
      if (found) return found;
    }
  }
  return undefined;
}

interface SsrRenderer {
  render(url: string): Promise<string>;
  hydrationScript: string;
  close(): Promise<void>;
}

async function createSsrRenderer(options: DocsServerOptions): Promise<SsrRenderer | undefined> {
  const ssrEntry = path.join(getClientDir(), "ssr-entry.jsx");
  if (!fs.existsSync(ssrEntry)) return undefined;

  const ssrOutDir = await fs.mkdtemp(path.join(os.tmpdir(), "nikala-docs-ssr-"));
  try {
    await build({
      ...getSharedConfig(options, false, true),
      build: {
        ssr: ssrEntry,
        outDir: ssrOutDir,
        emptyOutDir: true,
      },
      ssr: {
        // The generated SSR entry is imported from a temporary directory.
        // Bundle consumer dependencies so Node does not try to resolve them
        // relative to /tmp (where the consumer's node_modules are absent).
        noExternal: true,
      },
    });
    const generatedEntry = await findFile(ssrOutDir, "ssr-entry.js");
    if (!generatedEntry) throw new Error("SSR entry was not generated");
    const mod = await import(`${pathToFileURL(generatedEntry).href}?t=${Date.now()}`) as {
      render: (url: string) => Promise<string>;
      hydrationScript: string;
    };
    return {
      render: mod.render,
      hydrationScript: mod.hydrationScript,
      close: () => fs.remove(ssrOutDir),
    };
  } catch (error) {
    console.warn(
      "[nikala-docs] SSR renderer unavailable; using static prerender:",
      error instanceof Error ? (error.stack || error.message).split("\n").slice(0, 8).join("\n") : error
    );
    await fs.remove(ssrOutDir);
    return undefined;
  }
}

async function renderWithTimeout(renderer: SsrRenderer, url: string): Promise<string> {
  return Promise.race([
    renderer.render(url),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error("SSR render timed out")), 10_000)),
  ]);
}

async function prerenderDocs(options: DocsServerOptions, outDir: string, template: string): Promise<void> {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const config = options.config || await loadConfig(root);
  const contentDir = path.resolve(root, options.docsDir || config.contentDir || "docs");
  const pages = await scanContent(contentDir);
  if (!pages.length) return;
  const renderer = await createSsrRenderer(options);

  try {
    for (const page of pages) {
      let content = `<article><h1>${escapeHtml(page.title)}</h1>${page.description ? `<p>${escapeHtml(page.description)}</p>` : ""}${await renderStaticPage(page.filePath)}</article>`;
      if (renderer) {
        try {
          const rendered = await renderWithTimeout(renderer, page.url);
          if (rendered.trim()) content = rendered;
        } catch (error) {
          console.warn(`[nikala-docs] SSR fallback for ${page.url}:`, error instanceof Error ? error.message : error);
        }
      }

      const title = escapeHtml(`${page.title} - ${config.title || "Documentation"}`);
      const description = escapeHtml(page.description || config.description || "");
      const canonical = config.siteUrl
        ? `<link rel="canonical" href="${escapeHtml(`${config.siteUrl.replace(/\/$/, "")}${page.url === "/" ? "/" : page.url}`)}">`
        : "";
      const metadata = `<title>${title}</title>${description ? `<meta name="description" content="${description}">` : ""}${canonical}`;
      const html = addHydrationScript(template, renderer?.hydrationScript)
        .replace(/<title>[^<]*<\/title>/i, metadata)
        .replace('<div id="root"></div>', `<div id="root" data-prerendered>${content}</div>`);
      const outputPath = page.url === "/" ? path.join(outDir, "index.html") : path.join(outDir, page.url.slice(1), "index.html");
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
    }

    if (config.siteUrl) {
      const base = config.siteUrl.replace(/\/$/, "");
      const urls = pages.map((page) => `<url><loc>${escapeHtml(`${base}${page.url === "/" ? "/" : page.url}`)}</loc></url>`).join("");
      await fs.writeFile(path.join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
      await fs.writeFile(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
    }
  } finally {
    await renderer?.close();
  }
}

export async function createDocsServer(options: DocsServerOptions = {}): Promise<ViteDevServer> {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const localSrc = path.join(root, "src");
  const clientDir = getClientDir();
  const coreSrc = getCoreSrcDir();
  const hooksSrc = getHooksSrcDir();
  const solidJsDir = getSolidJsDir();
  const workspaceRoot = path.resolve(getDocsPackageRoot(), "../..");
  const shared = getSharedConfig(options, true);

  const server = await createServer({
    ...shared,
    server: {
      port: options.port ?? 1862,
      strictPort: false,
      host: options.host ?? "localhost",
      open: options.open ?? false,
      fs: {
        allow: [
          root,
          clientDir,
          path.resolve(clientDir, "../.."),
          path.resolve(coreSrc, "../.."),
          path.resolve(hooksSrc, "../.."),
          ...(fs.existsSync(localSrc) ? [localSrc, path.resolve(localSrc, "..") ] : []),
          workspaceRoot,
          path.join(workspaceRoot, "node_modules"),
          ...(solidJsDir ? [solidJsDir, path.resolve(solidJsDir, ".."), path.resolve(solidJsDir, "../..")] : []),
        ],
      },
    },
  });

  const devHtmlMiddleware = async (req: any, res: any, next: any) => {
    if (req.method !== "GET" || !String(req.headers.accept || "").includes("text/html")) {
      next();
      return;
    }
    const requestPath = (req.url || "/").split("?", 1)[0];
    if (requestPath.startsWith("/@") || requestPath.startsWith("/src/") || path.extname(requestPath)) {
      next();
      return;
    }

    try {
      const template = await fs.readFile(path.join(clientDir, "index.html"), "utf-8");
      const html = await server.transformIndexHtml(requestPath, template);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    } catch (error) {
      console.warn(`[nikala-docs] Dev HTML fallback for ${requestPath}:`, error instanceof Error ? error.message : error);
      next();
    }
  };
  const devMiddlewareStack = (server.middlewares as any).stack;
  if (Array.isArray(devMiddlewareStack)) {
    devMiddlewareStack.unshift({ route: "", handle: devHtmlMiddleware });
  } else {
    server.middlewares.use(devHtmlMiddleware);
  }

  return server;
}

export async function buildDocs(options: DocsServerOptions = {}): Promise<void> {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const outDir = options.outDir ? path.resolve(root, options.outDir) : path.resolve(root, "dist");
  const shared = getSharedConfig(options, false);

  await build({
    ...shared,
    build: {
      outDir,
      emptyOutDir: true,
    },
  });

  const templatePath = path.join(outDir, "index.html");
  const template = await fs.readFile(templatePath, "utf-8");
  await prerenderDocs(options, outDir, template);
}

function contentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
  }[extension] || "application/octet-stream";
}

function addHydrationScript(template: string, hydrationScript?: string): string {
  if (!hydrationScript || template.includes("_$HY")) return template;
  return template.replace("</head>", `    ${hydrationScript}\n  </head>`);
}

export async function createDocsRequestHandler(options: DocsServerOptions = {}): Promise<(request: Request) => Promise<Response>> {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const outDir = options.outDir ? path.resolve(root, options.outDir) : path.resolve(root, "dist");
  const config = options.config || await loadConfig(root);
  const contentDir = path.resolve(root, options.docsDir || config.contentDir || "docs");
  const pages = await scanContent(contentDir);
  const template = await fs.readFile(path.join(outDir, "index.html"), "utf-8");
  const renderer = await createSsrRenderer(options);

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const page = pages.find((item) => item.url === pathname || item.url === pathname.replace(/\/$/, ""));
    const relativeFile = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const assetPath = path.resolve(outDir, relativeFile);
    const insideOutput = assetPath === outDir || assetPath.startsWith(`${outDir}${path.sep}`);

    if (insideOutput && fs.existsSync(assetPath) && !fs.statSync(assetPath).isDirectory()) {
      return new Response(await fs.readFile(assetPath), {
        headers: { "content-type": contentType(assetPath) },
      });
    }

    if (!page) return new Response("Not Found", { status: 404 });

    if (renderer) {
      try {
        const rendered = await renderWithTimeout(renderer, page.url);
      const title = escapeHtml(`${page.title} - ${config.title || "Documentation"}`);
        const description = escapeHtml(page.description || config.description || "");
        const canonical = config.siteUrl
          ? `<link rel="canonical" href="${escapeHtml(`${config.siteUrl.replace(/\/$/, "")}${page.url === "/" ? "/" : page.url}`)}">`
          : "";
        const html = addHydrationScript(template, renderer.hydrationScript)
        .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>${description ? `<meta name="description" content="${description}">` : ""}${canonical}`)
          .replace('<div id="root"></div>', `<div id="root" data-prerendered>${rendered}</div>`);
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      } catch {
        // Fall through to the already generated static page.
      }
    }

    const staticPath = path.join(outDir, page.url === "/" ? "index.html" : page.url.slice(1), "index.html");
    if (await fs.pathExists(staticPath)) {
      return new Response(await fs.readFile(staticPath), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Not Found", { status: 404 });
  };
}

export async function previewDocs(options: DocsServerOptions = {}): Promise<void> {
  const root = options.root ? path.resolve(process.cwd(), options.root) : process.cwd();
  const outDir = options.outDir ? path.resolve(root, options.outDir) : path.resolve(root, "dist");
  const host = typeof options.host === "string" ? options.host : "localhost";
  const requestedPort = options.port ?? 1862;
  const handler = await createDocsRequestHandler({ root, outDir });
  const server = createHttpServer(async (request, response) => {
    try {
      const protocol = request.headers["x-forwarded-proto"] || "http";
      const hostHeader = request.headers.host || `${host}:${serverPort}`;
      const result = await handler(new Request(`${protocol}://${hostHeader}${request.url || "/"}`, {
        method: request.method,
        headers: request.headers as HeadersInit,
      }));
      response.statusCode = result.status;
      result.headers.forEach((value, key) => response.setHeader(key, value));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) {
      response.statusCode = 500;
      response.end(error instanceof Error ? error.message : "Internal Server Error");
    }
  });

  const serverPort = await listenWithFallback(server, requestedPort, host);
  console.log(`  ➜  Local:   http://${host}:${serverPort}/`);
}

async function listenWithFallback(server: ReturnType<typeof createHttpServer>, startPort: number, host: string): Promise<number> {
  let port = startPort;
  while (port <= 65_535) {
    const error = await new Promise<NodeJS.ErrnoException | undefined>((resolve) => {
      const onListening = () => resolve(undefined);
      const onError = (err: NodeJS.ErrnoException) => {
        server.off("listening", onListening);
        resolve(err);
      };
      server.once("listening", onListening);
      server.once("error", onError);
      server.listen(port, host);
    });
    if (!error) return port;
    if (error.code !== "EADDRINUSE") throw error;
    port += 1;
  }
  throw new Error(`No available port found from ${startPort}`);
}

export * from "./plugin.js";
