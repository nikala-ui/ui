import {
  splitProps,
  Show,
  type Component,
  type JSX,
  type ParentComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Bookmark,
} from "lucide-solid";
import { cn } from "@/lib/cn";

export const calloutVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm leading-relaxed transition-colors",
  {
    variants: {
      variant: {
        note: "border-border/80 bg-muted/50 text-foreground [&>svg]:text-foreground",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400",
        tip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        danger: "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-200 [&>svg]:text-destructive",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "note",
    },
  }
);

const defaultIcons = {
  note: Bookmark,
  info: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle2,
};

export interface CalloutProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  title?: string;
  type?: VariantProps<typeof calloutVariants>["variant"];
  icon?: Component<{ class?: string }> | false;
  class?: string;
}

export const Callout: ParentComponent<CalloutProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "variant",
    "type",
    "title",
    "icon",
    "class",
    "children",
  ]);

  const variant = () => local.variant || local.type || "note";

  const IconComponent = () => {
    if (local.icon === false) return null;
    if (local.icon) return local.icon;
    return defaultIcons[variant()] || Info;
  };

  return (
    <div
      role="region"
      aria-label={local.title || `${variant()} callout`}
      class={cn(
        calloutVariants({ variant: variant() }),
        "flex gap-3.5 items-start",
        local.class
      )}
      {...rest}
    >
      <Show when={IconComponent()}>
        {(Icon) => (
          <span class="inline-flex shrink-0 items-center justify-center mt-0.5 select-none">
            <Dynamic component={Icon()} class="size-4.5 shrink-0" />
          </span>
        )}
      </Show>
      <div class="flex-1 space-y-1 min-w-0">
        <Show when={local.title}>
          <h5 class="font-semibold text-sm leading-none tracking-tight">
            {local.title}
          </h5>
        </Show>
        <div class="text-sm opacity-90 leading-relaxed break-words">
          {local.children}
        </div>
      </div>
    </div>
  );
};

export interface CalloutTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  class?: string;
}

export const CalloutTitle: ParentComponent<CalloutTitleProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h5
      class={cn("font-semibold text-sm leading-none tracking-tight mb-1", local.class)}
      {...rest}
    >
      {local.children}
    </h5>
  );
};

export interface CalloutDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  class?: string;
}

export const CalloutDescription: ParentComponent<CalloutDescriptionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn("text-sm opacity-90 leading-relaxed", local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};
