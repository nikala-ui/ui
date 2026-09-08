// src/components/ui/input-group.tsx
import { splitProps, type Component, type JSX } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/* --- Main InputGroup Wrapper --- */
export interface InputGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const InputGroup: Component<InputGroupProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      class={cn(
        "relative flex w-full items-center rounded-md border border-input bg-muted text-sm shadow-2xs transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- InputGroup Addon (Prefix / Suffix) --- */
export const addonVariants = cva(
  "flex items-center shrink-0 text-muted-foreground select-none",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 pr-1",
        "inline-end": "order-last pr-3 pl-1 gap-1",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

export interface InputGroupAddonProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof addonVariants> {
  class?: string;
}

export const InputGroupAddon: Component<InputGroupAddonProps> = (props) => {
  const [local, rest] = splitProps(props, ["align", "class", "children"]);

  return (
    <div
      class={cn(addonVariants({ align: local.align }), local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
};

/* --- InputGroup Native Input --- */
export interface InputGroupInputProps
  extends JSX.InputHTMLAttributes<HTMLInputElement> {
  class?: string;
}

export const InputGroupInput: Component<InputGroupInputProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      class={cn(
        "flex h-9 w-full flex-1 border-0 px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...rest}
    />
  );
};