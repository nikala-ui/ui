import {
  createContext,
  createSignal,
  useContext,
  splitProps,
  Show,
  type JSX,
  type ParentComponent,
  type Component,
  type Accessor,
  type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cva, type VariantProps } from "class-variance-authority";
import { Menu, X } from "lucide-solid";
import { cn } from "@/lib/cn";

/* --- Navbar Context --- */
interface NavbarContextValue {
  isOpen: Accessor<boolean>;
  setIsOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

const NavbarContext = createContext<NavbarContextValue>();

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within a <Navbar /> component");
  }
  return context;
}

/* --- Root Navbar --- */
export const navbarVariants = cva(
  "w-full transition-all duration-200 z-40",
  {
    variants: {
      variant: {
        default: "border-b border-border/60 bg-background/80 backdrop-blur-md",
        floating: "my-3 rounded-lg border border-border/80 bg-background/90 backdrop-blur-md shadow-sm",
        bordered: "border-b border-border bg-background",
        transparent: "bg-transparent border-transparent",
      },
      isSticky: {
        true: "sticky top-0",
        false: "relative",
      },
    },
    defaultVariants: {
      variant: "default",
      isSticky: true,
    },
  }
);

export interface NavbarProps
  extends JSX.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navbarVariants> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Navbar: ParentComponent<NavbarProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "variant",
    "isSticky",
    "maxWidth",
    "open",
    "onOpenChange",
    "children",
  ]);

  const [internalOpen, setInternalOpen] = createSignal(false);
  const isOpen = () => (local.open !== undefined ? local.open : internalOpen());

  const setIsOpen = (open: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(open);
    }
    local.onOpenChange?.(open);
  };

  const toggleMobileMenu = () => setIsOpen(!isOpen());

  const maxWidthClass = () => {
    switch (local.maxWidth) {
      case "sm":
        return "max-w-screen-sm";
      case "md":
        return "max-w-screen-md";
      case "lg":
        return "max-w-screen-lg";
      case "xl":
        return "max-w-screen-xl";
      case "full":
        return "max-w-full";
      case "2xl":
      default:
        return "max-w-screen-2xl";
    }
  };

  return (
    <NavbarContext.Provider value={{ isOpen, setIsOpen, toggleMobileMenu }}>
      <header
        class={cn(
          navbarVariants({
            variant: local.variant,
            isSticky: local.isSticky,
          }),
          local.variant === "floating" && cn("mx-auto", maxWidthClass()),
          local.class
        )}
        {...rest}
      >
        <div class={cn("w-full", local.variant !== "floating" && cn("mx-auto", maxWidthClass()))}>
          {local.children}
        </div>
      </header>
    </NavbarContext.Provider>
  );
};

/* --- Navbar Container (Top Flex Row) --- */
export interface NavbarContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const NavbarContainer: ParentComponent<NavbarContainerProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      class={cn(
        "flex h-14 md:h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 w-full",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- Navbar Brand / Logo Container --- */
export interface NavbarBrandProps<T extends ValidComponent = "a"> extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  class?: string;
  as?: T;
  href?: string;
}

export const NavbarBrand = <T extends ValidComponent = "a">(props: NavbarBrandProps<T>) => {
  const [local, rest] = splitProps(props as NavbarBrandProps, ["class", "as", "children"]);

  return (
    <Dynamic
      component={local.as || "a"}
      class={cn(
        "flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-90 cursor-pointer shrink-0",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};

/* --- Navbar Content / Section --- */
export const navbarContentVariants = cva("flex items-center gap-1 sm:gap-2 h-full", {
  variants: {
    justify: {
      start: "justify-start flex-1",
      center: "justify-center flex-1",
      end: "justify-end flex-1",
    },
  },
  defaultVariants: {
    justify: "center",
  },
});

export interface NavbarContentProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navbarContentVariants> {
  class?: string;
  hideOnMobile?: boolean;
}

export const NavbarContent: ParentComponent<NavbarContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "justify", "hideOnMobile", "children"]);

  return (
    <div
      class={cn(
        navbarContentVariants({ justify: local.justify }),
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- Navbar Item --- */
export interface NavbarItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
  isActive?: boolean;
}

export const NavbarItem: ParentComponent<NavbarItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "isActive", "children"]);

  return (
    <div
      class={cn(
        "relative flex items-center h-full text-sm font-medium",
        local.class
      )}
      {...rest}
    >
      {local.children}
      <Show when={local.isActive}>
        <div class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-lg z-10" />
      </Show>
    </div>
  );
};

/* --- Navbar Link --- */
export const navbarLinkVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors cursor-pointer select-none focus-visible:outline-hidden",
  {
    variants: {
      variant: {
        default:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        active:
          "text-foreground font-semibold bg-muted/80",
        ghost:
          "text-foreground hover:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NavbarLinkProps<T extends ValidComponent = "a">
  extends JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof navbarLinkVariants> {
  class?: string;
  isActive?: boolean;
  as?: T;
  href?: string;
}

export const NavbarLink = <T extends ValidComponent = "a">(props: NavbarLinkProps<T>) => {
  const [local, rest] = splitProps(props as NavbarLinkProps, ["class", "variant", "isActive", "as", "children"]);

  return (
    <Dynamic
      component={local.as || "a"}
      class={cn(
        navbarLinkVariants({
          variant: local.isActive ? "active" : local.variant,
        }),
        local.class
      )}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};

/* --- Navbar Actions Container --- */
export interface NavbarActionsProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const NavbarActions: ParentComponent<NavbarActionsProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div class={cn("flex items-center gap-2 shrink-0", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

/* --- Navbar Mobile Toggle Button --- */
export interface NavbarMobileToggleProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

export const NavbarMobileToggle: Component<NavbarMobileToggleProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { isOpen, toggleMobileMenu } = useNavbar();

  return (
    <button
      type="button"
      onClick={toggleMobileMenu}
      aria-label="Toggle navigation menu"
      aria-expanded={isOpen()}
      class={cn(
        "inline-flex md:hidden size-8 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring shrink-0",
        local.class
      )}
      {...rest}
    >
      <Show when={isOpen()} fallback={<Menu class="size-4" />}>
        <X class="size-4" />
      </Show>
    </button>
  );
};

/* --- Navbar Mobile Menu Container --- */
export interface NavbarMobileMenuProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const NavbarMobileMenu: ParentComponent<NavbarMobileMenuProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const { isOpen } = useNavbar();

  return (
    <Show when={isOpen()}>
      <div
        class={cn(
          "md:hidden w-full border-t border-border/60 bg-background/95 backdrop-blur-lg px-4 py-3 space-y-1 shadow-md transition-all",
          local.class
        )}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
};

/* --- Navbar Mobile Item & Link --- */
export interface NavbarMobileLinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  class?: string;
  isActive?: boolean;
}

export const NavbarMobileLink: ParentComponent<NavbarMobileLinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "isActive", "children"]);
  const { setIsOpen } = useNavbar();

  return (
    <a
      onClick={() => setIsOpen(false)}
      class={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
        local.isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </a>
  );
};
