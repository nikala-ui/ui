/// <reference types="vite/client" />

declare module "*.css";

declare module "virtual:nikala-docs-config" {
  const config: any;
  export default config;
}

declare module "virtual:nikala-docs-tree" {
  export const pages: any[];
  export const tree: any[];
  const def: { pages: any[]; tree: any[] };
  export default def;
}

declare module "virtual:nikala-docs-routes" {
  export const routes: Record<string, () => Promise<any>>;
  const def: Record<string, () => Promise<any>>;
  export default def;
}

declare module "virtual:nikala-docs-components" {
  const components: Record<string, any>;
  export default components;
}
