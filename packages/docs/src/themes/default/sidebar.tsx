// packages/docs/src/themes/default/sidebar.tsx
import { createSignal, For, onCleanup, onMount, Show, splitProps, type Component } from "solid-js";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/ui/sidebar";
import { SidebarFooter } from "@/components/ui/sidebar";
import { SidebarMenu } from "@/components/ui/sidebar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { sidebarMenuButtonVariants } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import { createFocusTrap } from "@/hooks/create-focus-trap";
import { createLockScroll } from "@/hooks/create-lock-scroll";
import { cn } from "@/lib/cn";
import type { DocsSidebarProps } from "../types.js";
import { SidebarTree } from "./navigation/sidebar-tree.jsx";

export const DocsSidebar: Component<DocsSidebarProps> = (props) => {
  const [local, rest] = splitProps(props, ["tree", "nav", "currentUrl", "title", "logo", "headerSubtitle", "footerText", "showHeader", "showFooter", "class"]);
  const brandText = () => local.logo?.text || local.title || "Nikala Docs";
  const sidebar = useSidebar();
  const [sidebarElement, setSidebarElement] = createSignal<HTMLDivElement>();

  createFocusTrap(sidebarElement, {
    enabled: () => sidebar.isMobile() && sidebar.openMobile(),
  });
  createLockScroll({
    enabled: () => sidebar.isMobile() && sidebar.openMobile(),
  });

  onMount(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebar.isMobile() && sidebar.openMobile()) {
        event.preventDefault();
        sidebar.setOpenMobile(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <>
      <Show when={sidebar.isMobile() && sidebar.openMobile()}>
        <button
          type="button"
          aria-label="Close documentation sidebar"
          class="fixed inset-0 z-40 cursor-default bg-black/50 md:hidden"
          onClick={() => sidebar.setOpenMobile(false)}
        />
      </Show>
      <Show when={!sidebar.isMobile() || sidebar.openMobile()}>
        <Sidebar
          ref={setSidebarElement}
          collapsible={sidebar.isMobile() ? "none" : "icon"}
          class={cn(
            "sticky top-0 z-30 h-screen shrink-0 rounded-none border-y-0 border-l-0 border-r border-border bg-card shadow-sm",
            "overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[min(17rem,calc(100vw-1rem))] max-md:shadow-xl",
            local.class
          )}
          {...rest}
        >
      <Show when={local.showHeader !== false}>
        <SidebarHeader class="p-3">
          <a
            href={local.logo?.href || "/"}
            data-sidebar="menu-button"
            class={cn(sidebarMenuButtonVariants({ variant: "default", size: "lg" }), "w-full justify-between")}
          >
            <div class="flex items-center gap-2.5 overflow-hidden">
              <Show when={local.logo?.image} fallback={<Logo class="size-7" />}>
                {(image) => <img src={image()} alt={brandText()} class="size-7 shrink-0 rounded-md object-contain" />}
              </Show>
              <div class="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span class="truncate text-xs font-bold">{brandText()}</span>
                <span class="truncate text-[10px] text-muted-foreground">{local.headerSubtitle}</span>
              </div>
            </div>
          </a>
        </SidebarHeader>
      </Show>

      <SidebarContent class="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Show when={local.nav?.length}>
          <nav aria-label="Primary navigation" class="border-b border-border/60 px-2 py-2 md:hidden">
            <For each={local.nav}>
              {(item) => (
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  onClick={() => sidebar.setOpenMobile(false)}
                  class={cn(sidebarMenuButtonVariants({ variant: "default", size: "default" }), "w-full justify-start text-sm font-normal")}
                >
                  {item.title}
                </a>
              )}
            </For>
          </nav>
        </Show>
        <SidebarTree tree={local.tree} currentUrl={local.currentUrl} />
      </SidebarContent>

      <Show when={local.showFooter !== false}>
        <SidebarFooter class="p-2">
          <SidebarMenuButton size="lg" class="w-full justify-start">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
              N
            </div>
            <div class="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span class="truncate text-xs font-semibold">{brandText()}</span>
              <span class="truncate text-[10px] text-muted-foreground">{local.footerText}</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Show>
        </Sidebar>
      </Show>
    </>
  );
};
