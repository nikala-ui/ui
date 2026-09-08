import { splitProps, type JSX, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const containerVariants = cva("w-full mx-auto px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
      full: "max-w-full",
    },
  },
  defaultVariants: {
    size: "2xl",
  },
});

export interface ContainerProps<T extends ValidComponent = "div">
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /** Underlying HTML element or Solid component tag (defaults to "div") */
  as?: T;
  class?: string;
}

/**
 * Responsive container primitive constraining max-width with semantic padding tokens.
 */
export const Container = <T extends ValidComponent = "div">(props: ContainerProps<T>) => {
  const [local, rest] = splitProps(props as ContainerProps, ["as", "size", "class", "children"]);

  return (
    <Dynamic
      component={local.as || "div"}
      class={cn(containerVariants({ size: local.size }), local.class)}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};
