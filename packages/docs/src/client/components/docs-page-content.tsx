import { Show, type Component } from "solid-js";
import type { PageModule } from "../app-types.js";

interface DocsPageContentProps {
  pageModule: () => PageModule | null | undefined;
  mdxComponents: Record<string, unknown>;
}

export const DocsPageContent: Component<DocsPageContentProps> = (props) => (
  <Show when={props.pageModule() !== null} fallback={<div class="p-8 text-sm text-muted-foreground">Loading documentation...</div>}>
    <Show keyed when={props.pageModule()} fallback={<div class="space-y-4 py-8"><h1 class="text-2xl font-bold">Page Not Found</h1><p class="text-muted-foreground text-sm">The documentation article could not be found.</p></div>}>
      {(module) => {
        const Page = module.default;
        return <Page components={props.mdxComponents} />;
      }}
    </Show>
  </Show>
);
