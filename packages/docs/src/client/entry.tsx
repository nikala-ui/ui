// packages/docs/src/client/entry.tsx
import { render } from "solid-js/web";
import { App } from "./app";
import { defaultMdxComponents } from "../components/mdx-components.jsx";
import "./style.css";

// @ts-ignore
import { routes as pageRoutes } from "virtual:nikala-docs-routes";

if (typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (root) {
    const initialPath = window.location.pathname;
    const normalizedPath = initialPath.replace(/\/$/, "") || "/";
    const loader = pageRoutes[initialPath] || pageRoutes[normalizedPath];
    const wasPrerendered = root.hasAttribute("data-prerendered");

    // Dev serves an empty root. Mount immediately so a delayed route-module
    // request cannot leave the entire page blank. The router loads the active
    // page module after mount. For prerendered HTML, keep the SSR output until
    // the initial module is ready, then replace it with the client tree.
    if (!wasPrerendered) {
      render(() => <App initialPath={initialPath} mdxComponents={defaultMdxComponents} />, root);
    } else {
      void (async () => {
        const initialPageModule = loader ? await loader() : undefined;
        root.removeAttribute("data-prerendered");
        root.replaceChildren();
        render(() => <App initialPath={initialPath} initialPageModule={initialPageModule} mdxComponents={defaultMdxComponents} />, root);
      })();
    }
  }
}
