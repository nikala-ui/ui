// src/components/ui/kbd.tsx
import { splitProps, type Component, type JSX } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const kbdVariants = cva(
  "pointer-events-none inline-flex select-none items-center justify-center gap-1 rounded border border-border bg-muted font-mono font-medium text-muted-foreground shadow-2xs transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
      size: {
        sm: "h-4 min-w-[16px] px-1 text-[9px]",
        md: "h-5 min-w-[20px] px-1.5 text-[10px]",
        lg: "h-6 min-w-[24px] px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface KbdProps
  extends JSX.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  class?: string;
}

/**
 * Nikala UI Kbd (Keyboard Key) Component.
 */
export const Kbd: Component<KbdProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "class",
    "children",
  ]);

  return (
    <kbd
      class={cn(
        kbdVariants({ variant: local.variant, size: local.size }),
        local.class
      )}
      {...rest}
    >
      {local.children}
    </kbd>
  );
};

/* --- Kbd Group Container --- */
export interface KbdGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const KbdGroup: Component<KbdGroupProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      class={cn("inline-flex items-center gap-1", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};