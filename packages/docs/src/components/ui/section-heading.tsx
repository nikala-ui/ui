import {
  splitProps,
  Show,
  type JSX,
  type Component,
} from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const headingVariants = cva("tracking-tight", {
  variants: {
    variant: {
      page: "text-3xl sm:text-4xl font-bold",
      section: "text-2xl font-semibold border-b border-border/50 pb-2",
      compact: "text-base font-semibold",
    },
  },
  defaultVariants: {
    variant: "section",
  },
});

const descriptionVariants = cva("text-muted-foreground leading-relaxed", {
  variants: {
    variant: {
      page: "text-lg",
      section: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "section",
  },
});

export interface SectionHeadingProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof headingVariants> {
  /** Heading text content */
  title: string;
  /** Optional badge label displayed next to the title */
  badge?: string;
  /** Badge style variant */
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  /** Optional subtitle or explanatory note below the title */
  description?: string;
  class?: string;
}

/**
 * Reusable heading block with title, optional badge, and description.
 * Supports "page" (h1), "section" (h2 with divider), and "compact" (h3) variants.
 */
export const SectionHeading: Component<SectionHeadingProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "title",
    "badge",
    "badgeVariant",
    "description",
    "variant",
    "class",
  ]);

  const v = () => local.variant || "section";

  return (
    <div class={cn("space-y-2", local.class)} {...rest}>
      <div class={cn("flex items-center gap-2", v() === "section" && "w-full")}>
        <Show when={v() === "page"}>
          <h1 class={headingVariants({ variant: v() })}>
            {local.title}
          </h1>
        </Show>

        <Show when={v() === "section"}>
          <h2 class={cn("w-full", headingVariants({ variant: v() }))}>
            {local.title}
          </h2>
        </Show>

        <Show when={v() === "compact"}>
          <h3 class={headingVariants({ variant: v() })}>
            {local.title}
          </h3>
        </Show>

        <Show when={local.badge}>
          <Badge
            variant={local.badgeVariant || "outline"}
            class={cn(
              "select-none",
              v() === "page" ? "text-xs" : "font-mono text-[10px] py-0 px-1.5 font-medium"
            )}
          >
            {local.badge}
          </Badge>
        </Show>
      </div>

      <Show when={local.description}>
        <p class={descriptionVariants({ variant: v() })}>
          {local.description}
        </p>
      </Show>
    </div>
  );
};
