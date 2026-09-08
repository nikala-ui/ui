import { splitProps, type Component, type ComponentProps } from "solid-js";
import { Tooltip as KobalteTooltip } from "@kobalte/core/tooltip";
import { cn } from "@/lib/cn";

export const Tooltip = KobalteTooltip;

export const TooltipTrigger = KobalteTooltip.Trigger;

export const TooltipArrow: Component<ComponentProps<typeof KobalteTooltip.Arrow>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <KobalteTooltip.Arrow
      size={8}
      class={cn("fill-popover stroke-border", local.class)}
      {...rest}
    />
  );
};

export interface TooltipContentProps extends ComponentProps<typeof KobalteTooltip.Content> {
  class?: string;
}

export const TooltipContent: Component<TooltipContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <KobalteTooltip.Portal>
      <KobalteTooltip.Content
        class={cn(
          "z-50 rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md transition-all animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-[closed]:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          local.class
        )}
        {...rest}
      >
        {local.children}
      </KobalteTooltip.Content>
    </KobalteTooltip.Portal>
  );
};