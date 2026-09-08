import {
  createSignal,
  createMemo,
  splitProps,
  For,
  Show,
  type JSX,
  type ParentComponent,
} from "solid-js";
import { Check, Copy } from "lucide-solid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { createClipboard } from "@/hooks/create-clipboard";
import { cn } from "@/lib/cn";

export type DefaultPackageManager = "bun" | "pnpm" | "npm" | "yarn" | "bunx" | "npx" | "deno";

export interface PackageManagerTabsProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** List of package managers to show in the switcher tabs */
  managers?: string[];
  /** Single CLI command template (e.g. "add @nikala-ui/core", "create @nikala-ui/docs my-app") */
  command?: string;
  /** Explicit map of custom commands per manager (e.g. { bun: "bun add foo", npm: "npm i foo" }) */
  commands?: Record<string, string>;
  /** Selected manager (controlled) */
  value?: string;
  /** Initial selected manager (uncontrolled) */
  defaultValue?: string;
  /** Callback fired when the active package manager changes */
  onChange?: (manager: string) => void;
  /** Whether to show the copy button in the header */
  copyable?: boolean;
  class?: string;
}

/**
 * Automatically formats a command string for a specific package manager.
 */
function resolvePmCommand(manager: string, command: string): string {
  const trimmed = command.trim();
  const pm = manager.toLowerCase();

  // 1. "create" command
  const createMatch = trimmed.match(/^(?:bun|npm|npx|pnpm|yarn|deno)?\s*create\s+(.*)$/);
  if (createMatch) {
    const args = createMatch[1];
    if (pm === "bun" || pm === "bunx") return `bun create ${args}`;
    if (pm === "pnpm") return `pnpm create ${args}`;
    if (pm === "yarn") return `yarn create ${args}`;
    if (pm === "deno") return `deno run -A npm:create-${args}`;
    return `npm create ${args}`;
  }

  // 2. "add" / "install" command
  const addMatch = trimmed.match(/^(?:bun\s+add|npm\s+i|npm\s+install|pnpm\s+add|yarn\s+add|deno\s+add|add|install|i)\s+(.*)$/);
  if (addMatch) {
    const args = addMatch[1];
    if (pm === "npm") return `npm i ${args}`;
    if (pm === "pnpm") return `pnpm add ${args}`;
    if (pm === "yarn") return `yarn add ${args}`;
    if (pm === "deno") return `deno add ${args}`;
    return `bun add ${args}`;
  }

  // 3. CLI runner (e.g. "nikala add button" or "@nikala-ui/cli add button")
  const runnerMatch = trimmed.match(/^(?:bunx|npx|pnpm\s+dlx|yarn\s+dlx)?\s*(.*)$/);
  if (runnerMatch) {
    const rest = runnerMatch[1];
    if (pm === "npx") return `npx ${rest}`;
    if (pm === "pnpm") return `pnpm dlx ${rest}`;
    if (pm === "yarn") return `yarn dlx ${rest}`;
    if (pm === "bun" || pm === "bunx") return `bunx ${rest}`;
    return `${pm} ${rest}`;
  }

  return trimmed;
}

function highlightCliCommandText(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);

  let pkgIndex = 1;
  if ((parts[0] === "pnpm" || parts[0] === "yarn") && parts[1] === "dlx") {
    pkgIndex = 2;
  } else if (parts[0] === "bun" && (parts[1] === "create" || parts[1] === "add" || parts[1] === "run")) {
    pkgIndex = 2;
  } else if (parts[0] === "npm" && (parts[1] === "create" || parts[1] === "run")) {
    pkgIndex = 2;
  }

  const mainPart = parts.slice(0, pkgIndex).join(" ");
  const restTokens = parts.slice(pkgIndex);

  const highlightedRest = restTokens
    .map((token) => {
      if (token.startsWith("-")) {
        return `<span class="text-amber-500 dark:text-amber-400 font-medium">${token}</span>`;
      }
      if (["add", "create", "init", "run", "dev", "build", "set", "theme", "diff", "list"].includes(token)) {
        return `<span class="text-sky-500 dark:text-sky-400 font-semibold">${token}</span>`;
      }
      return `<span class="text-violet-500 dark:text-violet-400 font-medium">${token}</span>`;
    })
    .join(" ");

  return `<span class="text-emerald-500 dark:text-emerald-400 font-semibold">${mainPart}</span>${
    highlightedRest ? " " + highlightedRest : ""
  }`;
}

export const PackageManagerTabs: ParentComponent<PackageManagerTabsProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "managers",
    "command",
    "commands",
    "value",
    "defaultValue",
    "onChange",
    "copyable",
    "class",
  ]);

  const defaultManagers = ["bun", "pnpm", "npm", "yarn"];
  const managersList = () => local.managers || defaultManagers;

  const [internalActive, setInternalActive] = createSignal(
    local.defaultValue || managersList()[0] || "bun"
  );

  const activeManager = () => local.value ?? internalActive();

  const handleSelect = (pm: string) => {
    if (local.value === undefined) {
      setInternalActive(pm);
    }
    local.onChange?.(pm);
  };

  const currentCommand = createMemo(() => {
    const pm = activeManager();
    if (local.commands && local.commands[pm]) {
      return local.commands[pm];
    }
    if (local.command) {
      return resolvePmCommand(pm, local.command);
    }
    return "";
  });

  const clipboard = createClipboard();
  const copyable = () => local.copyable ?? true;

  const handleCopy = async () => {
    const text = currentCommand();
    if (!text) return;
    await clipboard.copy(text);
  };

  return (
    <div
      class={cn(
        "group relative my-4 w-full overflow-hidden rounded-lg border border-border bg-muted/40 font-mono text-sm shadow-2xs",
        local.class
      )}
      {...rest}
    >
      {/* Header with Manager Switcher Tabs and Copy Button */}
      <div class="flex h-9 items-center justify-between border-b border-border/70 bg-muted/70 px-3.5 select-none">
        {/* Switcher Tabs */}
        <Tabs
          value={activeManager()}
          onChange={handleSelect}
          class="w-auto flex-none"
        >
          <TabsList class="w-auto inline-flex h-auto bg-background/60 p-0.5 border border-border/50 gap-0.5 rounded-md font-mono">
            <For each={managersList()}>
              {(pm) => (
                <TabsTrigger
                  value={pm}
                  class="rounded-xs px-2 py-0.5 text-[11px] font-mono transition-colors cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-2xs"
                >
                  {pm}
                </TabsTrigger>
              )}
            </For>
          </TabsList>
        </Tabs>

        {/* Copy Button */}
        <Show when={copyable() && currentCommand()}>
          <Tooltip>
            <TooltipTrigger
              as={Button}
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label={clipboard.copied() ? "Copied command" : "Copy command"}
              class="size-6 p-0 rounded-xs text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer"
            >
              <Show when={clipboard.copied()} fallback={<Copy class="size-3.5" />}>
                <Check class="size-3.5 text-emerald-500 dark:text-emerald-400" />
              </Show>
            </TooltipTrigger>
            <TooltipContent class="text-[10px] py-1 px-2">
              {clipboard.copied() ? "Copied!" : "Copy command"}
            </TooltipContent>
          </Tooltip>
        </Show>
      </div>

      {/* Command Box Content */}
      <div class="overflow-x-auto p-4 text-[13px] leading-relaxed [scrollbar-width:thin]">
        <pre class="font-mono">
          <code>
            <span class="text-sky-500 dark:text-sky-400 font-semibold select-none">$ </span>
            <span innerHTML={highlightCliCommandText(currentCommand())} />
          </code>
        </pre>
      </div>
    </div>
  );
};
