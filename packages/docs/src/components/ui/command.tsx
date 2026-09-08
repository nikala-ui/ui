import {
  createContext,
  useContext,
  createSignal,
  onCleanup,
  Show,
  splitProps,
  type Component,
  type JSX,
  type Accessor,
} from "solid-js";
import { createKeybindings } from "@/hooks/create-keybindings";
import { Dialog } from "@kobalte/core/dialog";
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-solid";
import { cn } from "@/lib/cn";
import { Kbd, KbdGroup } from "../ui/kbd";
import { InputGroup, InputGroupInput, InputGroupAddon } from "../ui/input-group";
import { List, ListGroup, ListHeader, ListItem, type ListItemProps } from "../ui/list";
import { ScrollArea } from "@/components/ui/scroll-area";

/* --- Command Context State --- */
interface CommandContextValue {
  search: Accessor<string>;
  setSearch: (value: string) => void;
  activeIndex: Accessor<number>;
  setActiveIndex: (fn: (prev: number) => number) => void;
  registerItemIndex: (element: HTMLElement) => number;
  onItemSelect: (index: number, action?: () => void) => void;
}

const CommandContext = createContext<CommandContextValue>();

export const useCommand = () => {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error("useCommand must be used within a <Command />");
  }
  return ctx;
};

/* --- Root Command Container --- */
export interface CommandProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> {
  class?: string;
  children?: JSX.Element | ((ctx: CommandContextValue) => JSX.Element);
}

export const Command: Component<CommandProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const [search, setSearch] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);

  let containerRef: HTMLDivElement | undefined;
  let itemsList: HTMLElement[] = [];

  const registerItemIndex = (element: HTMLElement) => {
    if (!itemsList.includes(element)) {
      itemsList.push(element);
    }
    return itemsList.indexOf(element);
  };

  const onItemSelect = (index: number, action?: () => void) => {
    setActiveIndex(index);
    if (action) action();
  };

  const getVisibleItems = () => {
    if (!containerRef) return [];
    return Array.from(containerRef.querySelectorAll<HTMLElement>("[data-command-item]:not(.hidden)"));
  };

  const updateActiveAttribute = (index: number) => {
    const visible = getVisibleItems();
    visible.forEach((el, idx) => {
      if (idx === index) {
        el.setAttribute("aria-selected", "true");
        el.scrollIntoView({ block: "nearest" });
      } else {
        el.removeAttribute("aria-selected");
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const visible = getVisibleItems();
    if (visible.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (activeIndex() + 1) % visible.length;
      setActiveIndex(next);
      updateActiveAttribute(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (activeIndex() - 1 + visible.length) % visible.length;
      setActiveIndex(prev);
      updateActiveAttribute(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = visible[activeIndex()];
      if (current) {
        current.click();
      }
    }
  };

  const ctx: CommandContextValue = {
    search,
    setSearch: (val) => {
      setSearch(val);
      setActiveIndex(0);
    },
    activeIndex,
    setActiveIndex: (fn) => setActiveIndex(fn),
    registerItemIndex,
    onItemSelect,
  };

  return (
    <CommandContext.Provider value={ctx}>
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        class={cn(
          "flex flex-col w-full h-full rounded-lg bg-popover text-popover-foreground overflow-hidden border border-border shadow-md outline-none",
          local.class
        )}
        tabIndex={0}
        {...rest}
      >
        {typeof local.children === "function" ? (local.children as any)(ctx) : local.children}
      </div>
    </CommandContext.Provider>
  );
};

/* --- Command Dialog (Modal) --- */
export interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enableHotkey?: boolean;
  children?: JSX.Element | ((ctx: CommandContextValue) => JSX.Element);
  class?: string;
}

export const CommandDialog: Component<CommandDialogProps> = (props) => {
  const [internalOpen, setInternalOpen] = createSignal(false);

  const isOpen = () => (props.open !== undefined ? props.open : internalOpen());
  const setOpen = (val: boolean) => {
    if (props.open === undefined) setInternalOpen(val);
    if (typeof props.onOpenChange === "function") props.onOpenChange(val);
  };

  /* Listen for global Ctrl+K / Cmd+K hotkeys */
  createKeybindings(
    [
      {
        key: ["meta+k", "ctrl+k"],
        handler: () => setOpen(!isOpen()),
        preventDefault: true,
      },
    ],
    {
      enabled: () => props.enableHotkey !== false,
    }
  );

  return (
    <Dialog open={isOpen()} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-expanded:animate-in data-closed:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0" />
        <div class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <Dialog.Content class="w-full max-w-xl rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl outline-none data-expanded:animate-in data-closed:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-closed:zoom-out-95 data-expanded:zoom-in-95">
            <Command class={props.class}>{props.children}</Command>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

/* --- Command Input --- */
export interface CommandInputProps
  extends JSX.InputHTMLAttributes<HTMLInputElement> {
  class?: string;
}

export const CommandInput: Component<CommandInputProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "value", "onInput"]);
  const { search, setSearch } = useCommand();

  return (
    <InputGroup class="border-0 border-b border-border rounded-none bg-transparent px-3 py-1 shadow-none focus-within:ring-0 focus-within:border-border">
      <InputGroupAddon align="inline-start">
        <Search class="w-4 h-4 text-muted-foreground" />
      </InputGroupAddon>

      <InputGroupInput
        value={search()}
        onInput={(e) => {
          setSearch(e.currentTarget.value);
          if (typeof local.onInput === "function") {
            local.onInput(e);
          }
        }}
        placeholder="Type a command or search..."
        class="h-11 text-base sm:text-sm font-medium"
        {...rest}
      />
    </InputGroup>
  );
};

/* --- Command List Container --- */
export interface CommandListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const CommandList: Component<CommandListProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <ScrollArea
      class={cn("max-h-82.5 p-1.5", local.class)}
      {...rest}
    >
      <List>{local.children}</List>
    </ScrollArea>
  );
};

/* --- Command Empty Block --- */
export interface CommandEmptyProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

export const CommandEmpty: Component<CommandEmptyProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const { search } = useCommand();

  return (
    <Show when={search().trim().length > 0}>
      <div
        class={cn(
          "py-8 text-center text-sm text-muted-foreground font-medium select-none",
          local.class
        )}
        {...rest}
      >
        {local.children || `No results found for "${search()}".`}
      </div>
    </Show>
  );
};

/* --- Command Group --- */
export interface CommandGroupProps {
  heading: string;
  children?: JSX.Element;
  class?: string;
}

export const CommandGroup: Component<CommandGroupProps> = (props) => {
  return (
    <ListGroup class={props.class}>
      <ListHeader title={props.heading} />
      {props.children}
    </ListGroup>
  );
};

/* --- Command Item --- */
export interface CommandItemProps extends ListItemProps {
  keywords?: string[];
  description?: string;
  onSelect?: () => void;
  shouldFilter?: boolean;
}

export const CommandItem: Component<CommandItemProps> = (props) => {
  let itemRef: HTMLDivElement | undefined;
  const [local, rest] = splitProps(props, [
    "title",
    "subtitle",
    "description",
    "keywords",
    "onSelect",
    "onClick",
    "shouldFilter",
    "class",
  ]);
  const { search } = useCommand();

  /* Auto filter item based on search query */
  const matchesSearch = () => {
    if (local.shouldFilter === false) return true;
    const query = search().toLowerCase().trim();
    if (!query) return true;

    const titleMatch = local.title?.toLowerCase().includes(query);
    const subtitleMatch = local.subtitle?.toLowerCase().includes(query);
    const descMatch = local.description?.toLowerCase().includes(query);
    const keywordMatch = local.keywords?.some((k) =>
      k.toLowerCase().includes(query)
    );

    return Boolean(titleMatch || subtitleMatch || descMatch || keywordMatch);
  };

  const handleClick = (e: MouseEvent) => {
    if (typeof local.onSelect === "function") {
      local.onSelect();
    }
    if (typeof local.onClick === "function") {
      local.onClick(e as any);
    }
  };

  return (
    <Show when={matchesSearch()}>
      <ListItem
        ref={itemRef}
        data-command-item="true"
        title={local.title}
        subtitle={local.subtitle || local.description}
        onClick={handleClick}
        class={cn(
          "aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
          local.class
        )}
        {...rest}
      />
    </Show>
  );
};

/* --- Command Footer --- */
export interface CommandFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
  children?: JSX.Element;
}

export const CommandFooter: Component<CommandFooterProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      class={cn(
        "flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground select-none",
        local.class
      )}
      {...rest}
    >
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1">
          <KbdGroup>
            <Kbd size="sm"><ArrowUp class="w-2.5 h-2.5" /></Kbd>
            <Kbd size="sm"><ArrowDown class="w-2.5 h-2.5" /></Kbd>
          </KbdGroup>
          <span>Navigate</span>
        </span>

        <span class="flex items-center gap-1">
          <Kbd size="sm"><CornerDownLeft class="w-2.5 h-2.5" /></Kbd>
          <span>Select</span>
        </span>

        <span class="flex items-center gap-1">
          <Kbd size="sm">Esc</Kbd>
          <span>Close</span>
        </span>
      </div>

      {local.children}
    </div>
  );
};