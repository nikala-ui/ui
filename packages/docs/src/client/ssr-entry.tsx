import { generateHydrationScript, renderToString } from "solid-js/web";
import { App } from "./app";
import { defaultMdxComponents } from "../components/mdx-components.jsx";

// @ts-ignore
import { routes as pageRoutes } from "virtual:nikala-docs-routes";

export async function render(url: string): Promise<string> {
  const normalized = url.replace(/\/$/, "") || "/";
  const loader = pageRoutes[url] || pageRoutes[normalized];
  const initialPageModule = loader ? await loader() : undefined;

  return renderToString(() => (
    <App
      initialPath={url}
      initialPageModule={initialPageModule}
      mdxComponents={defaultMdxComponents}
    />
  ));
}

export const hydrationScript = generateHydrationScript();
