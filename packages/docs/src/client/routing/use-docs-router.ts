import { createEffect, createMemo, createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import type { PageData } from "../../types.js";
import type { PageModule, PageRouteLoaders } from "../app-types.js";

interface DocsRouterOptions {
  initialPath?: string;
  initialPageModule?: PageModule;
  pages: PageData[];
  loaders: PageRouteLoaders;
}

export interface DocsRouter {
  pathname: Accessor<string>;
  currentPage: Accessor<PageData | undefined>;
  activePageModule: Accessor<PageModule | null | undefined>;
}

const normalizePath = (path: string) => path.replace(/\/$/, "") || "/";

export function createDocsRouter(options: DocsRouterOptions): DocsRouter {
  const [pathname, setPathname] = createSignal(
    options.initialPath || (typeof window !== "undefined" ? window.location.pathname : "/")
  );

  onMount(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    const handleAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("tel:") || target.hasAttribute("download") || target.getAttribute("target") === "_blank" || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      if (href.startsWith("#")) {
        const element = document.getElementById(href.slice(1));
        if (element) {
          event.preventDefault();
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
        return;
      }

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      setPathname(url.pathname);
      window.history.pushState(null, "", href);
      if (url.hash) {
        const element = document.getElementById(url.hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleAnchorClick);
    onCleanup(() => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleAnchorClick);
    });
  });

  const currentPage = createMemo<PageData | undefined>(() => {
    const current = normalizePath(pathname());
    return options.pages.find((page) => page.url === current || page.url === pathname());
  });

  const [loadedPageModule, setLoadedPageModule] = createSignal<PageModule | null | undefined>(options.initialPageModule);
  let initialModulePending = Boolean(options.initialPageModule);
  let loadRequest = 0;
  createEffect(() => {
    if (typeof window === "undefined") return;
    const url = currentPage()?.url;
    const initialPath = normalizePath(options.initialPath || "/");
    if (initialModulePending && initialPath === normalizePath(pathname())) {
      initialModulePending = false;
      return;
    }
    initialModulePending = false;
    const requestId = ++loadRequest;
    if (!url) {
      setLoadedPageModule(undefined);
      return;
    }
    const loader = options.loaders[url] || options.loaders[`${url}/`];
    if (!loader) {
      setLoadedPageModule(undefined);
      return;
    }
    setLoadedPageModule(null);
    void loader()
      .then((pageModule) => {
        if (requestId === loadRequest) setLoadedPageModule(pageModule);
      })
      .catch((error) => {
        if (requestId !== loadRequest) return;
        console.error(`[nikala-docs] Failed to load page: ${url}`, error);
        setLoadedPageModule(undefined);
      });
  });

  return { pathname, currentPage, activePageModule: loadedPageModule };
}
