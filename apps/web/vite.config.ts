import path from "node:path";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import lucidePreprocess from "vite-plugin-lucide-preprocess";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@nikala-ui/hooks": path.resolve(import.meta.dirname, "../../packages/hooks/src/index.ts"),
      "@nikala-ui/mcp/server": path.resolve(import.meta.dirname, "../../packages/mcp/src/server.ts"),
      "@nikala-ui/mcp": path.resolve(import.meta.dirname, "../../packages/mcp/src/index.ts"),
    },
    dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
  },
  optimizeDeps: {
    include: ["source-map-js"],
  },
  plugins: [
    lucidePreprocess(),
    solidStart(),
    tailwindcss(),
    nitro()
  ]
});
