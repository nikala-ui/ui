import {
  createSignal,
  splitProps,
  Show,
  type JSX,
  type ParentComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  RotateCcw,
  Terminal,
  Check,
  Maximize2,
  Minimize2,
  Grid,
} from "lucide-solid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CodeBlock } from "@/components/ui/code-block";
import { createClipboard } from "@/hooks/create-clipboard";
import { cn } from "@/lib/cn";

export type ComponentViewerViewport = "desktop" | "tablet" | "mobile";

export interface ComponentViewerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Name of the component or UI primitive (e.g. "button", "dialog") */
  name?: string;
  /** Title label displayed in the viewer header */
  title?: string;
  /** Raw TSX/JSX source code to display in the Code tab and copy */
  code: string;
  /** Programming language for syntax highlighting (defaults to "tsx") */
  lang?: string;
  /** Alignment of the preview canvas: "center" (default), "start", or "end" */
  align?: "center" | "start" | "end";
  /** Optional CLI command to install this component (e.g. "bunx @nikala-ui/cli add button") */
  command?: string;
  /** Initial responsive viewport (default: "desktop") */
  defaultViewport?: ComponentViewerViewport;
  /** Whether to allow overflowing elements in the canvas (e.g. popovers, dropdowns) */
  allowOverflow?: boolean;
  /** Enables responsive screen size toggle controls (Desktop, Tablet, Mobile) */
  responsive?: boolean;
  /** Enables canvas grid pattern toggle */
  showGridToggle?: boolean;
  /** Enables a reset button to re-mount the preview canvas */
  reRenderable?: boolean;
  class?: string;
}

/**
 * Advanced component inspection and preview container with responsive viewport emulation,
 * background grid patterns, live re-mounting, AI context generation, and syntax-highlighted code.
 */
export const ComponentViewer: ParentComponent<ComponentViewerProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "name",
    "title",
    "code",
    "lang",
    "align",
    "command",
    "defaultViewport",
    "allowOverflow",
    "responsive",
    "showGridToggle",
    "reRenderable",
    "class",
    "children",
  ]);

  const [viewport, setViewport] = createSignal<ComponentViewerViewport>(
    local.defaultViewport || "desktop"
  );
  const [showGrid, setShowGrid] = createSignal(true);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const aiClipboard = createClipboard();
  const cmdClipboard = createClipboard();
  const [mounted, setMounted] = createSignal(true);

  const cliCommand = () => local.command;

  const handleCopyAi = async () => {
    const cmd = cliCommand();
    const prompt = `// ${local.title || local.name || "Component"}
${cmd ? `// Installation: ${cmd}\n` : ""}// Usage Code:
${local.code}`;
    await aiClipboard.copy(prompt);
  };

  const handleCopyCmd = async () => {
    const cmd = cliCommand();
    if (!cmd) return;
    await cmdClipboard.copy(cmd);
  };

  const handleReset = () => {
    setMounted(false);
    setTimeout(() => setMounted(true), 20);
  };

  const alignmentClass = () => {
    if (local.align === "start") return "items-start justify-start";
    if (local.align === "end") return "items-end justify-end";
    return "items-center justify-center";
  };

  const viewportWidthClass = () => {
    switch (viewport()) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "max-w-full";
    }
  };

  const renderViewerContent = (isModal = false) => (
    <div
      class={cn(
        "group relative flex flex-col rounded-lg border border-border bg-card/60 shadow-2xs transition-all w-full",
        isModal && "h-full flex-1 bg-background shadow-2xl",
        !isModal && "my-6",
        local.class
      )}
      {...rest}
    >
      <Tabs defaultValue="preview" class="relative w-full flex flex-col h-full flex-1 gap-0">
        {/* Top Header & Toolbar */}
        <div class="flex flex-wrap items-center justify-between border-b border-border/70 px-3 py-2 gap-2 bg-muted/30 shrink-0">
          <div class="flex items-center gap-3">
            <TabsList class="h-8 rounded-md bg-muted/60 p-0.5 gap-1">
              <TabsTrigger value="preview" class="h-7 px-3 text-xs cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-2xs">
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" class="h-7 px-3 text-xs cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-2xs">
                Code
              </TabsTrigger>
            </TabsList>

            <Show when={local.title}>
              <span class="text-xs font-semibold text-foreground tracking-tight hidden sm:inline-block">
                {local.title}
              </span>
            </Show>
          </div>

          {/* Right Action Tools */}
          <div class="flex flex-wrap items-center gap-1.5 ml-auto">
            {/* Responsive Viewport Switcher */}
            <Show when={local.responsive ?? true}>
              <div class="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 gap-0.5 mr-1">
                <Tooltip>
                  <TooltipTrigger
                    as={Button}
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewport("desktop")}
                    aria-label="Desktop viewport"
                    class={cn(
                      "size-6.5 p-0 rounded-sm cursor-pointer text-muted-foreground",
                      viewport() === "desktop" && "bg-background text-foreground shadow-2xs font-semibold"
                    )}
                  >
                    <Monitor class="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent class="text-[10px] py-1 px-2">Desktop (100%)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    as={Button}
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewport("tablet")}
                    aria-label="Tablet viewport"
                    class={cn(
                      "size-6.5 p-0 rounded-sm cursor-pointer text-muted-foreground",
                      viewport() === "tablet" && "bg-background text-foreground shadow-2xs font-semibold"
                    )}
                  >
                    <Tablet class="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent class="text-[10px] py-1 px-2">Tablet (768px)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    as={Button}
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewport("mobile")}
                    aria-label="Mobile viewport"
                    class={cn(
                      "size-6.5 p-0 rounded-sm cursor-pointer text-muted-foreground",
                      viewport() === "mobile" && "bg-background text-foreground shadow-2xs font-semibold"
                    )}
                  >
                    <Smartphone class="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent class="text-[10px] py-1 px-2">Mobile (375px)</TooltipContent>
                </Tooltip>
              </div>
            </Show>

            {/* Grid Pattern Toggle */}
            <Show when={local.showGridToggle ?? true}>
              <Tooltip>
                <TooltipTrigger
                  as={Button}
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGrid(!showGrid())}
                  aria-label="Toggle background grid"
                  class={cn(
                    "size-7 rounded-md border border-border/50 text-muted-foreground hover:text-foreground cursor-pointer",
                    showGrid() && "text-foreground bg-muted/60"
                  )}
                >
                  <Grid class="size-3.5" />
                </TooltipTrigger>
                <TooltipContent class="text-[10px] py-1 px-2">Toggle Canvas Grid</TooltipContent>
              </Tooltip>
            </Show>

            {/* Re-render Reset Canvas */}
            <Show when={local.reRenderable ?? true}>
              <Tooltip>
                <TooltipTrigger
                  as={Button}
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  aria-label="Reset preview canvas"
                  class="size-7 rounded-md border border-border/50 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw class="size-3.5" />
                </TooltipTrigger>
                <TooltipContent class="text-[10px] py-1 px-2">Reset canvas</TooltipContent>
              </Tooltip>
            </Show>

            {/* Copy for AI */}
            <Tooltip>
              <TooltipTrigger
                as={Button}
                variant="ghost"
                size="sm"
                onClick={handleCopyAi}
                aria-label="Copy context formatted for AI assistants"
                class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-md cursor-pointer flex items-center gap-1.5"
              >
                <Show when={aiClipboard.copied()} fallback={<Sparkles class="size-3" />}>
                  <Check class="size-3 text-emerald-500" />
                </Show>
                <span class="hidden sm:inline">{aiClipboard.copied() ? "Copied!" : "Prompt"}</span>
              </TooltipTrigger>
              <TooltipContent class="text-[10px] py-1 px-2">Copy code formatted for AI</TooltipContent>
            </Tooltip>

            {/* Copy CLI Installation Command (only when command prop is provided) */}
            <Show when={cliCommand()}>
              <Tooltip>
                <TooltipTrigger
                  as={Button}
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCmd}
                  aria-label="Copy CLI installation command"
                  class="h-7 px-2 text-xs font-mono text-muted-foreground hover:text-foreground border border-border/50 rounded-md cursor-pointer flex items-center gap-1.5"
                >
                  <Show when={cmdClipboard.copied()} fallback={<Terminal class="size-3" />}>
                    <Check class="size-3 text-emerald-500" />
                  </Show>
                  <span class="hidden md:inline">{cmdClipboard.copied() ? "Copied!" : cliCommand()}</span>
                </TooltipTrigger>
                <TooltipContent class="text-[10px] py-1 px-2">Copy CLI command</TooltipContent>
              </Tooltip>
            </Show>

            {/* Fullscreen Expand Button */}
            <Tooltip>
              <TooltipTrigger
                as={Button}
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen())}
                aria-label={isFullscreen() ? "Exit fullscreen" : "Expand to fullscreen"}
                class="size-7 rounded-md border border-border/50 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Show when={isFullscreen()} fallback={<Maximize2 class="size-3.5" />}>
                  <Minimize2 class="size-3.5 text-primary" />
                </Show>
              </TooltipTrigger>
              <TooltipContent class="text-[10px] py-1 px-2">
                {isFullscreen() ? "Exit Fullscreen" : "Fullscreen Preview"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Live Preview Canvas Content */}
        <TabsContent
          value="preview"
          class={cn(
            "relative flex-1 p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center transition-all",
            isModal ? "min-h-[450px] flex-1" : "min-h-[280px]",
            showGrid() &&
              "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]",
            local.allowOverflow ? "overflow-visible" : "overflow-x-auto"
          )}
        >
          <div
            class={cn(
              "w-full transition-all duration-300 flex",
              viewportWidthClass(),
              alignmentClass(),
              viewport() !== "desktop" &&
                "rounded-lg border border-dashed border-border/80 p-4 bg-background/80 shadow-xs"
            )}
          >
            <Show when={mounted()}>
              {local.children}
            </Show>
          </div>
        </TabsContent>

        {/* Source Code View Content */}
        <TabsContent value="code" class={cn("p-0 m-0", isModal && "flex-1 overflow-auto")}>
          <CodeBlock
            code={local.code}
            lang={local.lang || "tsx"}
            filename={local.name ? `${local.name}.tsx` : undefined}
            class="my-0 border-0 rounded-t-none"
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Show when={!isFullscreen()}>
        {renderViewerContent(false)}
      </Show>

      {/* Fullscreen Portal Modal */}
      <Show when={isFullscreen()}>
        <Portal mount={typeof document !== "undefined" ? document.body : undefined}>
          <div class="fixed inset-0 z-[9999] flex flex-col bg-background/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
            {renderViewerContent(true)}
          </div>
        </Portal>
      </Show>
    </>
  );
};
