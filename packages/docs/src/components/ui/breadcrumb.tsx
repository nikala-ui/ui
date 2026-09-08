import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface BreadcrumbProps extends JSX.HTMLAttributes<HTMLElement> {
  class?: string;
}

/**
 * Root navigation container for the Nikala UI Breadcrumb hierarchy.
 */
export const Breadcrumb: Component<BreadcrumbProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <nav aria-label="breadcrumb" class={cn("relative w-full", local.class)} {...rest} />;
};

export interface BreadcrumbListProps extends JSX.HTMLAttributes<HTMLOListElement> {
  class?: string;
}

/**
 * Ordered list container housing all breadcrumb path items.
 */
export const BreadcrumbList: Component<BreadcrumbListProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ol
      class={cn(
        "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground break-words sm:gap-2.5",
        local.class
      )}
      {...rest}
    />
  );
};

export interface BreadcrumbItemProps extends JSX.HTMLAttributes<HTMLLIElement> {
  class?: string;
}

/**
 * Individual list item element wrapper in the breadcrumb hierarchy.
 */
export const BreadcrumbItem: Component<BreadcrumbItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <li class={cn("inline-flex items-center gap-1.5", local.class)} {...rest} />;
};

export interface BreadcrumbLinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  class?: string;
}

/**
 * Clickable breadcrumb trail link element.
 */
export const BreadcrumbLink: Component<BreadcrumbLinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <a
      class={cn(
        "transition-colors hover:text-foreground underline-offset-4 hover:underline",
        local.class
      )}
      {...rest}
    />
  );
};

export interface BreadcrumbPageProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  class?: string;
}

/**
 * Non-clickable active page indicator in breadcrumb hierarchy.
 */
export const BreadcrumbPage: Component<BreadcrumbPageProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      class={cn("font-normal text-foreground", local.class)}
      {...rest}
    />
  );
};

export interface BreadcrumbSeparatorProps extends JSX.HTMLAttributes<HTMLLIElement> {
  class?: string;
}

/**
 * Visual separator icon rendered between breadcrumb path links.
 */
export const BreadcrumbSeparator: Component<BreadcrumbSeparatorProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <li
      role="presentation"
      aria-hidden="true"
      class={cn("[&>svg]:size-3.5 text-muted-foreground", local.class)}
      {...rest}
    >
      {local.children || (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </li>
  );
};

export interface BreadcrumbEllipsisProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  class?: string;
}

/**
 * Ellipsis element representing truncated intermediate breadcrumb items.
 */
export const BreadcrumbEllipsis: Component<BreadcrumbEllipsisProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      role="presentation"
      aria-hidden="true"
      class={cn("flex h-9 w-9 items-center justify-center text-muted-foreground", local.class)}
      {...rest}
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    </span>
  );
};