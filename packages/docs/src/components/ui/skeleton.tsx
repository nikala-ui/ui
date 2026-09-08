import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

/**
 * Nikala UI Skeleton component for rendering animated pulse loading placeholders.
 */
export const Skeleton: Component<SkeletonProps> = (props) => {
  // Use splitProps to preserve SolidJS reactivity
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      class={cn(
        "animate-pulse rounded-md bg-accent",
        local.class
      )}
      {...rest}
    />
  );
};