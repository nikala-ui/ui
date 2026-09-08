import { splitProps, Show, children, type Component, type JSX } from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface PagerItem {
  title: string;
  href: string;
}

export interface PagerLinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  href: string;
  type: "prev" | "next";
  class?: string;
}

/**
 * Individual Next or Previous page navigation card.
 */
export const PagerLink: Component<PagerLinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["title", "href", "type", "class"]);

  const isNext = () => local.type === "next";

  return (
    <a
      href={local.href}
      class={cn(
        "group block rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isNext() && "sm:col-start-2",
        local.class
      )}
      {...rest}
    >
      <Card class="h-full transition-all group-hover:bg-accent/40 group-hover:shadow-2xs">
        <CardHeader class={cn("p-4 flex flex-col space-y-1.5", isNext() && "items-end text-right")}>
          <CardDescription class="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Show when={!isNext()}>
              <ChevronLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Previous</span>
            </Show>
            <Show when={isNext()}>
              <span>Next</span>
              <ChevronRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Show>
          </CardDescription>
          <CardTitle class="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
            {local.title}
          </CardTitle>
        </CardHeader>
      </Card>
    </a>
  );
};

export interface PagerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Previous documentation page item */
  prev?: PagerItem | null;
  /** Next documentation page item */
  next?: PagerItem | null;
  class?: string;
}

/**
 * Documentation Next / Previous article navigation block composed of Nikala UI Card primitives.
 */
export const Pager: Component<PagerProps> = (props) => {
  const [local, rest] = splitProps(props, ["prev", "next", "class", "children"]);
  const resolved = children(() => local.children);

  return (
    <div
      class={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 mt-10 pt-6 border-t border-border", local.class)}
      {...rest}
    >
      <Show
        when={resolved()}
        fallback={
          <>
            <Show
              when={local.prev}
              fallback={<span class="hidden sm:block" />}
            >
              <PagerLink type="prev" title={local.prev!.title} href={local.prev!.href} />
            </Show>
            <Show when={local.next}>
              <PagerLink type="next" title={local.next!.title} href={local.next!.href} />
            </Show>
          </>
        }
      >
        {resolved()}
      </Show>
    </div>
  );
};
