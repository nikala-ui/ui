import {
  createContext,
  useContext,
  splitProps,
  Show,
  type Component,
  type JSX,
  type Accessor,
} from "solid-js";
import { createControllableSignal } from "@/hooks/create-controllable-signal";
import { cn } from "@/lib/cn";

interface TabsContextValue {
  value: Accessor<string | undefined>;
  setValue: (value: string) => void;
  orientation: Accessor<"horizontal" | "vertical">;
}

const TabsContext = createContext<TabsContextValue>();

export interface TabsProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled active tab value */
  value?: string;
  /** Uncontrolled default active tab value */
  defaultValue?: string;
  /** Callback fired when active tab changes */
  onChange?: (value: string) => void;
  /** Layout orientation of tab triggers and content */
  orientation?: "horizontal" | "vertical";
  class?: string;
}

/**
 * Root Tabs container component managing active tab context state and orientation.
 */
export const Tabs: Component<TabsProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onChange",
    "orientation",
    "class",
    "children",
  ]);

  const [currentValue, setCurrentValue] = createControllableSignal<string>({
    value: () => local.value,
    defaultValue: local.defaultValue,
    onChange: (val) => local.onChange?.(val),
  });

  const orientation = () => local.orientation || "horizontal";

  const contextValue: TabsContextValue = {
    value: currentValue,
    setValue: (val: string) => setCurrentValue(val),
    orientation,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-orientation={orientation()}
        class={cn(
          "w-full",
          orientation() === "vertical" ? "flex flex-row gap-4" : "flex flex-col gap-2",
          local.class
        )}
        {...rest}
      >
        {local.children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

/**
 * Container wrapper for Tab triggers.
 */
export const TabsList: Component<TabsListProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const context = useContext(TabsContext);

  const isVertical = () => context?.orientation() === "vertical";

  return (
    <div
      role="tablist"
      aria-orientation={context?.orientation() || "horizontal"}
      class={cn(
        "inline-flex rounded-lg bg-muted p-1 text-muted-foreground",
        isVertical()
          ? "flex-col h-auto w-auto items-stretch justify-start"
          : "h-9 items-center justify-center",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export interface TabsTriggerProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Unique value identifier for this tab */
  value: string;
  class?: string;
}

/**
 * Tab button trigger to activate a specific tab panel.
 */
export const TabsTrigger: Component<TabsTriggerProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "value",
    "disabled",
    "class",
    "children",
    "onClick",
  ]);
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const isSelected = () => context.value() === local.value;
  const isVertical = () => context.orientation() === "vertical";

  const handleClick = (
    e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }
  ) => {
    if (local.disabled) return;
    context.setValue(local.value);
    if (typeof local.onClick === "function") {
      local.onClick(e);
    }
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected()}
      data-state={isSelected() ? "active" : "inactive"}
      data-orientation={context.orientation()}
      disabled={local.disabled}
      onClick={handleClick}
      class={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-accent data-[state=active]:border data-[state=active]:border-border data-[state=active]:text-foreground data-[state=active]:shadow-sm cursor-pointer",
        isVertical() ? "justify-start py-1.5" : "justify-center",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
};

export interface TabsContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Value matching the corresponding tab trigger */
  value: string;
  class?: string;
}

/**
 * Content panel revealed when the associated tab is active.
 */
export const TabsContent: Component<TabsContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["value", "class", "children"]);
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  const isSelected = () => context.value() === local.value;
  const isVertical = () => context.orientation() === "vertical";

  return (
    <Show when={isSelected()}>
      <div
        role="tabpanel"
        data-state={isSelected() ? "active" : "inactive"}
        data-orientation={context.orientation()}
        class={cn(
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isVertical() ? "flex-1 mt-0" : "mt-2",
          local.class
        )}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
};