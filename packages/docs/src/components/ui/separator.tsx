import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator line */
  orientation?: "horizontal" | "vertical";
  /** Whether the element is purely visual or semantic for screen readers */
  decorative?: boolean;
  class?: string;
}

/**
 * Nikala UI Separator component used to divide content visually or semantically.
 */
export const Separator: Component<SeparatorProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "orientation",
    "decorative",
    "class",
  ]);

  const orientation = () => local.orientation || "horizontal";
  const isDecorative = () => local.decorative ?? true;

  return (
    <div
      role={isDecorative() ? "none" : "separator"}
      aria-orientation={isDecorative() ? undefined : orientation()}
      class={cn(
        "shrink-0 bg-border",
        orientation() === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        local.class
      )}
      {...rest}
    />
  );
};