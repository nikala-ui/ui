// src/components/ui/list.tsx
import {
  splitProps,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-solid";
import { cn } from "@/lib/cn";

/* --- List Container --- */
export interface ListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const List: Component<ListProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div role="list" class={cn("flex flex-col gap-1 w-full p-1", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

/* --- List Group Container --- */
export interface ListGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const ListGroup: Component<ListGroupProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col gap-1 w-full", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

/* --- List Group Header --- */
export interface ListHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title: string;
  class?: string;
}

export const ListHeader: Component<ListHeaderProps> = (props) => {
  const [local, rest] = splitProps(props, ["title", "class"]);
  return (
    <div
      class={cn(
        "px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none",
        local.class
      )}
      {...rest}
    >
      {local.title}
    </div>
  );
};

/* --- List Item Variants --- */
export const listItemVariants = cva(
  "group relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 transform duration-150 ease-in-out",
  {
    variants: {
      hoverVariant: {
        default:
          "hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        accent:
          "hover:bg-accent/80 hover:text-accent-foreground data-highlighted:bg-accent/80",
        primary:
          "hover:bg-primary/10 hover:text-primary data-highlighted:bg-primary/10 data-highlighted:text-primary",
        muted:
          "hover:bg-muted hover:text-foreground data-highlighted:bg-muted",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
      active: {
        true: "bg-accent text-accent-foreground font-semibold",
        false: "",
      },
    },
    defaultVariants: {
      hoverVariant: "default",
      size: "md",
      active: false,
    },
  }
);

export interface ListItemProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  title?: string;
  subtitle?: string;
  avatar?: string;
  avatarFallback?: string;
  icon?: Component<{ class?: string }>;
  shortcut?: string;
  showChevron?: boolean;
  href?: string;
  disabled?: boolean;
  active?: boolean;
  class?: string;
}

/**
 * Nikala UI ListItem Component.
 */
export const ListItem: Component<ListItemProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "title",
    "subtitle",
    "avatar",
    "avatarFallback",
    "icon",
    "shortcut",
    "showChevron",
    "href",
    "disabled",
    "active",
    "hoverVariant",
    "size",
    "class",
    "children",
  ]);

  const content = () => (
    <>
      {/* Left Visual: Icon, Avatar, or Image */}
      <div class="flex items-center gap-2.5 min-w-0">
        <Show when={local.avatar}>
          <img
            src={local.avatar}
            alt={local.title || "Avatar"}
            class="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
          />
        </Show>

        <Show when={!local.avatar && local.avatarFallback}>
          <span class="w-10 h-10 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 uppercase">
            {local.avatarFallback}
          </span>
        </Show>

        <Show when={!local.avatar && !local.avatarFallback && local.icon}>
          <span class="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
            <Dynamic component={local.icon} class="w-4 h-4" />
          </span>
        </Show>

        {/* Main Text Content */}
        <div class="flex flex-col min-w-0 text-left">
          <Show when={local.title}>
            <span class="truncate font-medium leading-none">
              {local.title}
            </span>
          </Show>
          <Show when={local.subtitle}>
            <span class="truncate text-xs opacity-50 font-normal mt-1">
              {local.subtitle}
            </span>
          </Show>
          {local.children}
        </div>
      </div>

      {/* Right Visual: Shortcut Badge & Trailing Chevron */}
      <div class="flex items-center gap-2 shrink-0">
        <Show when={local.shortcut}>
          <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {local.shortcut}
          </kbd>
        </Show>

        <Show when={local.showChevron}>
          <ChevronRight class="w-4 h-4 text-muted-foreground transition-colors" />
        </Show>
      </div>
    </>
  );

  const itemClasses = () =>
    cn(
      listItemVariants({
        hoverVariant: local.hoverVariant,
        size: local.size,
        active: local.active,
      }),
      local.class
    );

  return (
    <Show
      when={local.href}
      fallback={
        <div
          role="listitem"
          class={itemClasses()}
          aria-disabled={local.disabled}
          {...rest}
        >
          {content()}
        </div>
      }
    >
      <a
        role="listitem"
        href={local.href}
        class={itemClasses()}
        aria-disabled={local.disabled}
        {...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content()}
      </a>
    </Show>
  );
};