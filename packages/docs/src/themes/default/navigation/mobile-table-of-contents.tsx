import { createSignal, onCleanup, onMount, splitProps, type Component } from "solid-js";
import { Collapsible } from "@/components/ui/collapsible";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-solid";
import { DocsTableOfContents } from "../content/table-of-contents.jsx";
import type { DocsTableOfContentsProps } from "../../types.js";

export const DocsMobileTableOfContents: Component<DocsTableOfContentsProps> = (props) => {
  const [local, rest] = splitProps(props, ["items", "title", "class", "onActiveChange"]);
  const [open, setOpen] = createSignal(false);
  const [activeId, setActiveId] = createSignal(local.items[0]?.id || "");
  const [rootElement, setRootElement] = createSignal<HTMLDivElement>();
  const title = () => local.title ?? "On this page";
  const activeTitle = () => local.items.find((item) => item.id === activeId())?.text || title();
  const handleActiveChange = (id: string) => {
    setActiveId(id);
    local.onActiveChange?.(id);
  };

  onMount(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (open() && !rootElement()?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    onCleanup(() => document.removeEventListener("pointerdown", handlePointerDown));
  });

  return (
    <Collapsible
      open={open()}
      onOpenChange={setOpen}
      ref={setRootElement}
      class={cn(
        "relative z-20 xl:hidden sticky top-16 rounded-md border border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
        local.class
      )}
    >
      <CollapsibleTrigger
        type="button"
        aria-label={title()}
        class="flex min-h-10 items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground"
      >
        <span class="truncate text-left">{activeTitle()}</span>
        <ChevronDown class={cn("size-4 text-muted-foreground transition-transform", open() && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent
        onClick={() => setOpen(false)}
        class="absolute inset-x-0 top-full z-30 max-h-[min(60vh,24rem)] rounded-b-md border border-t-0 border-border bg-card px-3 py-2 shadow-lg !overflow-y-auto"
      >
        <DocsTableOfContents items={local.items} title={title()} onActiveChange={handleActiveChange} class="max-h-56 overflow-y-auto" {...rest} />
      </CollapsibleContent>
    </Collapsible>
  );
};
