import { Show, splitProps, type Component, type JSX } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

/**
 * Class variance authority configuration for button styling variants and sizes.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 border border-primary/50",
        destructive:
          "bg-red-600 text-zinc-50 shadow-sm hover:bg-red-600/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "*:bg-green-600 text-zinc-50 shadow-sm hover:bg-green-600/90 dark:bg-green-900 dark:text-zinc-50 dark:hover:bg-green-900/90",
        warning: "*:bg-yellow-600 text-zinc-50 shadow-sm hover:bg-yellow-600/90 dark:bg-yellow-900 dark:text-zinc-50 dark:hover:bg-yellow-900/90",
        info: "*:bg-blue-600 text-zinc-50 shadow-sm hover:bg-blue-600/90 dark:bg-blue-900 dark:text-zinc-50 dark:hover:bg-blue-900/90",
      },
      size: {
        xs: "h-6 rounded-md px-2 text-xs",
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Props interface for the Button component extending standard HTML button attributes.
 */
export interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a loading spinner and prevents repeated clicks while active. */
  loading?: boolean;
  class?: string;
}

/**
 * Nikala UI Button component built for SolidJS with Tailwind CSS v4 styling.
 */
export const Button: Component<ButtonProps> = (props) => {
  // Use splitProps to preserve SolidJS reactivity for destructured props
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "class",
    "children",
    "loading",
    "disabled",
  ]);

  return (
    <button
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading ? "true" : undefined}
      {...rest}
    >
      <Show when={local.loading}>
        <Spinner size="sm" class="text-current" />
      </Show>
      {local.children}
    </button>
  );
};
