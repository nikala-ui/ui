import {
  createContext,
  createSignal,
  createMemo,
  createEffect,
  useContext,
  splitProps,
  onMount,
  onCleanup,
  type Component,
  type JSX,
  type ParentComponent,
  type Accessor,
  Show,
} from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft, PanelRight } from "lucide-solid";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";

/* --- Constants --- */
const SIDEBAR_COOKIE_NAME = "nikala_sidebar_state";
const SIDEBAR_WIDTH = "17rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/* --- 1. Context & Types --- */
export type SidebarState = "expanded" | "collapsed";
export type SidebarSide = "left" | "right";

export interface SidebarContextValue {
  state: Accessor<SidebarState>;
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  openMobile: Accessor<boolean>;
  setOpenMobile: (open: boolean) => void;
  isMobile: Accessor<boolean>;
  toggleSidebar: () => void;
  side: Accessor<SidebarSide>;
  setSide: (side: SidebarSide) => void;
}

const SidebarContext = createContext<SidebarContextValue>();

const fallbackSidebarContext: SidebarContextValue = {
  state: () => "expanded",
  open: () => true,
  setOpen: () => {},
  openMobile: () => false,
  setOpenMobile: () => {},
  isMobile: () => false,
  toggleSidebar: () => {},
  side: () => "left",
  setSide: () => {},
};

export function useSidebar() {
  const context = useContext(SidebarContext);
  return context ?? fallbackSidebarContext;
}

/* --- 2. SidebarProvider --- */
export interface SidebarProviderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: Accessor<boolean>;
  onOpenChange?: (open: boolean) => void;
  side?: SidebarSide;
  class?: string;
  style?: JSX.CSSProperties;
}

export const SidebarProvider: ParentComponent<SidebarProviderProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "defaultOpen",
    "open",
    "onOpenChange",
    "side",
    "class",
    "style",
    "children",
  ]);

  const [internalOpen, setInternalOpen] = createSignal<boolean>(local.defaultOpen ?? true);
  const [openMobile, setOpenMobile] = createSignal<boolean>(false);
  const [isMobile, setIsMobile] = createSignal<boolean>(false);
  const [side, setSide] = createSignal<SidebarSide>(local.side ?? "left");

  createEffect(() => {
    if (local.side) {
      setSide(local.side);
    }
  });

  const open = () => (local.open !== undefined ? local.open() : internalOpen());

  const setOpen = (value: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(value);
    }
    local.onOpenChange?.(value);

    if (typeof document !== "undefined") {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  };

  const toggleSidebar = () => {
    setOpen(!open());
  };

  const state = createMemo<SidebarState>(() => (open() ? "expanded" : "collapsed"));

  onMount(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });

    // Keyboard shortcut (⌘B / Ctrl+B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        !e.defaultPrevented
      ) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  const contextValue: SidebarContextValue = {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
    side,
    setSide,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          ...(typeof local.style === "object" ? local.style : {}),
        } as JSX.CSSProperties}
        class={cn(
          "group/sidebar-wrapper relative flex w-full max-w-full",
          local.class
        )}
        {...rest}
      >
        {local.children}
      </div>
    </SidebarContext.Provider>
  );
};

/* --- 3. Sidebar Root --- */
export interface SidebarProps extends JSX.HTMLAttributes<HTMLDivElement> {
  side?: SidebarSide;
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  class?: string;
}

export const Sidebar: ParentComponent<SidebarProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "side",
    "variant",
    "collapsible",
    "class",
    "children",
  ]);

  const sidebar = useSidebar();
  const side = () => local.side ?? sidebar.side();
  const variant = () => local.variant ?? "sidebar";
  const collapsible = () => local.collapsible ?? "icon";

  createEffect(() => {
    if (local.side) {
      sidebar.setSide(local.side);
    }
  });

  const isCollapsed = () => sidebar.state() === "collapsed" && collapsible() !== "none";

  return (
    <div
      data-state={isCollapsed() ? "collapsed" : "expanded"}
      data-collapsible={isCollapsed() ? collapsible() : ""}
      data-variant={variant()}
      data-side={side()}
      class={cn(
        "group relative flex flex-col bg-card text-card-foreground transition-[width,opacity] duration-200 ease-in-out shrink-0",
        !isCollapsed()
          ? "w-[var(--sidebar-width,17rem)]"
          : collapsible() === "icon"
          ? "w-[var(--sidebar-width-icon,3.5rem)]"
          : "w-0 overflow-hidden opacity-0 border-none",
        // Side borders
        variant() === "sidebar" && (side() === "left" ? "border-r border-border" : "border-l border-border"),
        // Floating variant
        variant() === "floating" && "m-2 rounded-lg border border-border shadow-md",
        // Inset variant
        variant() === "inset" && "m-2 rounded-lg border border-border/80 bg-card shadow-2xs",
        local.class
      )}
      {...rest}
    >
      <div
        data-sidebar="sidebar"
        class="flex h-full w-full flex-col overflow-hidden"
      >
        {local.children}
      </div>
    </div>
  );
};

/* --- 4. SidebarTrigger --- */
export interface SidebarTriggerProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

export const SidebarTrigger: Component<SidebarTriggerProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "onClick"]);
  const { toggleSidebar, side, isMobile, openMobile, setOpenMobile } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Toggle Sidebar"
      onClick={(e) => {
        if (typeof local.onClick === "function") local.onClick(e);
        if (isMobile()) setOpenMobile(!openMobile());
        else toggleSidebar();
      }}
      class={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer transition-colors shadow-2xs",
        local.class
      )}
      {...rest}
    >
      <Show when={side() === "right"} fallback={<PanelLeft class="size-4" />}>
        <PanelRight class="size-4" />
      </Show>
      <span class="sr-only">Toggle Sidebar</span>
    </button>
  );
};

/* --- 5. SidebarRail --- */
export interface SidebarRailProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

export const SidebarRail: Component<SidebarRailProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-sidebar="rail"
      aria-label="Toggle Sidebar Rail"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      class={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex cursor-w-resize",
        local.class
      )}
      {...rest}
    />
  );
};

/* --- 6. SidebarInset --- */
export interface SidebarInsetProps extends JSX.HTMLAttributes<HTMLElement> {
  class?: string;
}

export const SidebarInset: ParentComponent<SidebarInsetProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <main
      class={cn(
        "relative flex min-h-0 flex-1 flex-col bg-background",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </main>
  );
};

/* --- 7. Sidebar Structural Sections --- */
export interface SidebarSectionProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const SidebarHeader: ParentComponent<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="header"
      class={cn("flex flex-col gap-2 p-3 border-b border-border/40 shrink-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export const SidebarFooter: ParentComponent<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="footer"
      class={cn("flex flex-col gap-2 p-3 mt-auto border-t border-border/40 shrink-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export const SidebarSeparator: Component<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <Separator
      data-sidebar="separator"
      class={cn("mx-2 w-auto bg-border/50 my-1 group-data-[collapsible=icon]:mx-1", local.class)}
      {...rest}
    />
  );
};

export const SidebarContent: ParentComponent<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="content"
      class={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:items-center",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- 8. Sidebar Groups --- */
export const SidebarGroup: ParentComponent<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="group"
      class={cn("relative flex w-full min-w-0 flex-col p-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export interface SidebarGroupLabelProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const SidebarGroupLabel: ParentComponent<SidebarGroupLabelProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="group-label"
      class={cn(
        "flex h-7 shrink-0 items-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground outline-hidden transition-all duration-200 ease-linear group-data-[collapsible=icon]:hidden",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export interface SidebarGroupActionProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

export const SidebarGroupAction: ParentComponent<SidebarGroupActionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <button
      type="button"
      data-sidebar="group-action"
      class={cn(
        "absolute right-3 top-3 flex size-5 items-center justify-center rounded-md p-0 text-muted-foreground outline-hidden transition-transform hover:bg-muted hover:text-foreground cursor-pointer group-data-[collapsible=icon]:hidden",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
};

export const SidebarGroupContent: ParentComponent<SidebarSectionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="group-content"
      class={cn("w-full text-sm", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- 9. Sidebar Menu --- */
export interface SidebarMenuProps extends JSX.HTMLAttributes<HTMLUListElement> {
  class?: string;
}

export const SidebarMenu: ParentComponent<SidebarMenuProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <ul
      data-sidebar="menu"
      class={cn("flex w-full min-w-0 flex-col gap-1 list-none p-0 m-0 group-data-[collapsible=icon]:items-center", local.class)}
      {...rest}
    >
      {local.children}
    </ul>
  );
};

export interface SidebarMenuItemProps extends JSX.HTMLAttributes<HTMLLIElement> {
  class?: string;
}

export const SidebarMenuItem: ParentComponent<SidebarMenuItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <li
      data-sidebar="menu-item"
      class={cn("group/menu-item relative flex w-full justify-center", local.class)}
      {...rest}
    >
      {local.children}
    </li>
  );
};

/* --- 10. SidebarMenuButton --- */
export const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2 text-left text-sm font-medium outline-hidden ring-sidebar-ring transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 active:bg-muted disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-muted data-[active=true]:font-semibold data-[active=true]:text-foreground group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "hover:bg-muted hover:text-foreground",
        outline: "bg-background shadow-2xs hover:bg-muted hover:text-foreground border border-border",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-10 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SidebarMenuButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  isActive?: boolean;
  tooltip?: string;
  class?: string;
}

export const SidebarMenuButton: ParentComponent<SidebarMenuButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "isActive",
    "tooltip",
    "variant",
    "size",
    "class",
    "children",
  ]);

  const sidebar = useSidebar();
  const isCollapsed = () => sidebar.state() === "collapsed";
  const tooltipPlacement = () => (sidebar.side() === "right" ? "left" : "right");

  const buttonElement = () => (
    <button
      type="button"
      data-sidebar="menu-button"
      data-size={local.size}
      data-active={local.isActive ? "true" : "false"}
      class={cn(
        sidebarMenuButtonVariants({ variant: local.variant, size: local.size }),
        local.class
      )}
      {...rest}
    >
      {local.children}
    </button>
  );

  return (
    <Show
      when={local.tooltip && isCollapsed() && !sidebar.isMobile()}
      fallback={buttonElement()}
    >
      <Tooltip placement={tooltipPlacement()} gutter={8} openDelay={100}>
        <TooltipTrigger as="div" class="w-full flex items-center justify-center">
          {buttonElement()}
        </TooltipTrigger>
        <TooltipContent>
          {local.tooltip}
        </TooltipContent>
      </Tooltip>
    </Show>
  );
};

/* --- 11. SidebarMenuAction & Badge --- */
export interface SidebarMenuActionProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  showOnHover?: boolean;
  class?: string;
}

export const SidebarMenuAction: ParentComponent<SidebarMenuActionProps> = (props) => {
  const [local, rest] = splitProps(props, ["showOnHover", "class", "children"]);

  return (
    <button
      type="button"
      data-sidebar="menu-action"
      class={cn(
        "absolute right-1 top-1.5 flex size-5 items-center justify-center rounded-md p-0 text-muted-foreground outline-hidden transition-transform hover:bg-muted hover:text-foreground cursor-pointer group-data-[collapsible=icon]:hidden",
        local.showOnHover && "opacity-0 group-hover/menu-item:opacity-100 transition-opacity",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
};

export interface SidebarMenuBadgeProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const SidebarMenuBadge: ParentComponent<SidebarMenuBadgeProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      data-sidebar="menu-badge"
      class={cn(
        "pointer-events-none absolute right-1.5 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1.5 text-[11px] font-medium tabular-nums bg-muted text-muted-foreground group-data-[collapsible=icon]:hidden",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export interface SidebarMenuSkeletonProps extends JSX.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
  class?: string;
}

export const SidebarMenuSkeleton: Component<SidebarMenuSkeletonProps> = (props) => {
  const [local, rest] = splitProps(props, ["showIcon", "class"]);

  return (
    <div
      data-sidebar="menu-skeleton"
      class={cn("flex h-8 items-center gap-2 rounded-md px-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center", local.class)}
      {...rest}
    >
      <Show when={local.showIcon ?? true}>
        <Skeleton class="size-4 rounded-md shrink-0" />
      </Show>
      <Skeleton class="h-4 flex-1 max-w-[80%] group-data-[collapsible=icon]:hidden" />
    </div>
  );
};

/* --- 12. Nested Submenus --- */
export interface SidebarMenuSubProps extends JSX.HTMLAttributes<HTMLUListElement> {
  class?: string;
}

export const SidebarMenuSub: ParentComponent<SidebarMenuSubProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <ul
      data-sidebar="menu-sub"
      class={cn(
        "mx-3.5 flex min-w-0 flex-col gap-1 border-l border-border/60 px-2.5 py-0.5 list-none group-data-[collapsible=icon]:hidden",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </ul>
  );
};

export const SidebarMenuSubItem: ParentComponent<SidebarMenuItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <li class={cn("relative", local.class)} {...rest}>
      {local.children}
    </li>
  );
};

export interface SidebarMenuSubButtonProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  size?: "sm" | "md";
  class?: string;
}

export const SidebarMenuSubButton: ParentComponent<SidebarMenuSubButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["isActive", "size", "class", "children"]);

  return (
    <a
      data-sidebar="menu-sub-button"
      data-size={local.size ?? "md"}
      data-active={local.isActive ? "true" : "false"}
      class={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-xs text-muted-foreground outline-hidden hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground",
        local.size === "sm" && "text-[11px]",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </a>
  );
};
