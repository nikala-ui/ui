import { splitProps, type JSX, type ValidComponent } from "solid-js";
import * as CollapsiblePrimitive from "@kobalte/core/collapsible";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cn } from "@/lib/cn";

export type CollapsibleRootProps<T extends ValidComponent = "div"> =
  CollapsiblePrimitive.CollapsibleRootProps<T> & {
    class?: string;
  };

/**
 * Root Collapsible component built on Kobalte primitives.
 */
export const Collapsible = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, CollapsibleRootProps<T>>
) => {
  const [local, rest] = splitProps(props as CollapsibleRootProps, ["class"]);
  return (
    <CollapsiblePrimitive.Root
      class={cn("w-full", local.class)}
      {...(rest as any)}
    />
  );
};

export type CollapsibleTriggerProps<T extends ValidComponent = "button"> =
  CollapsiblePrimitive.CollapsibleTriggerProps<T> & {
    class?: string;
    children?: JSX.Element;
  };

/**
 * Trigger element that toggles the Collapsible open/closed state.
 */
export const CollapsibleTrigger = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, CollapsibleTriggerProps<T>>
) => {
  const [local, rest] = splitProps(props as CollapsibleTriggerProps, ["class", "children"]);
  return (
    <CollapsiblePrimitive.Trigger
      class={cn("flex w-full items-center justify-between cursor-pointer", local.class)}
      {...rest}
    >
      {local.children}
    </CollapsiblePrimitive.Trigger>
  );
};

export type CollapsibleContentProps<T extends ValidComponent = "div"> =
  CollapsiblePrimitive.CollapsibleContentProps<T> & {
    class?: string;
    children?: JSX.Element;
  };

/**
 * Collapsible content panel revealed when opened.
 */
export const CollapsibleContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, CollapsibleContentProps<T>>
) => {
  const [local, rest] = splitProps(props as CollapsibleContentProps, ["class", "children"]);
  return (
    <CollapsiblePrimitive.Content
      class={cn(
        "overflow-hidden transition-all data-expanded:animate-collapsible-down data-closed:animate-collapsible-up",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </CollapsiblePrimitive.Content>
  );
};
