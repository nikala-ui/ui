// src/components/ui/table-of-contents.tsx
import {
  splitProps,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, ListHeader, ListItem } from "@/components/ui/list";
import { cn } from "@/lib/cn";
import { createScrollPosition } from "@/hooks/create-scroll-position";

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface TableOfContentsProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "title"> {
  items: TocItem[];
  title?: string | false;
  activeId?: string;
  onItemClick?: (id: string) => void;
  class?: string;
}

/**
 * Nikala UI TableOfContents Component.
 * Pure composition of ScrollArea, ListHeader, List, and ListItem with active ScrollSpy tracking.
 */
export const TableOfContents: Component<TableOfContentsProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "items",
    "title",
    "activeId",
    "onItemClick",
    "class",
  ]);

  const [activeId, setActiveId] = createSignal<string>(local.activeId || "");
  const scrollPosition = createScrollPosition();

  onMount(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const headings = (local.items || [])
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    const updateActiveHeading = () => {
      if (headings.length === 0) return;

      const atPageBottom = scrollPosition.isAtBottom();
      if (atPageBottom) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }

      const heading = [...headings]
        .reverse()
        .find((element) => element.getBoundingClientRect().top <= 120);

      setActiveId(heading?.id || headings[0].id);
    };

    createEffect(() => {
      scrollPosition.y();
      scrollPosition.isAtBottom();
      updateActiveHeading();
    });

    window.addEventListener("resize", updateActiveHeading);
    onCleanup(() => window.removeEventListener("resize", updateActiveHeading));
  });

  const handleClick = (e: MouseEvent, id: string) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        setActiveId(id);
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", `#${id}`);
        }
      }
    }
    local.onItemClick?.(id);
  };

  return (
    <ScrollArea class={cn("h-full py-2", local.class)} {...rest}>
      <Show when={local.title !== false}>
        <ListHeader
          title={typeof local.title === "string" ? local.title : "On this page"}
          class="px-3 pb-1"
        />
      </Show>

      <List class="gap-0.5 p-1">
        <For each={local.items}>
          {(item) => (
            <ListItem
              title={item.text}
              href={`#${item.id}`}
              active={activeId() === item.id}
              size="sm"
              hoverVariant="muted"
              class={cn(
                "text-xs transition-colors py-1 h-auto min-h-0",
                item.depth === 3 && "pl-5 text-muted-foreground/80",
                item.depth > 3 && "pl-7 text-muted-foreground/60",
                activeId() === item.id
                  ? "text-primary font-medium bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={(e: MouseEvent) => handleClick(e, item.id)}
            />
          )}
        </For>
      </List>
    </ScrollArea>
  );
};

export const Toc = TableOfContents;
