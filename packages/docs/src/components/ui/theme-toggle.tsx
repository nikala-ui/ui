import { splitProps, type Component, For, Show, type JSX } from "solid-js";
import { Sun, Moon, Monitor } from "lucide-solid";
import {
  useTheme,
  type AccentColor,
  type Radius,
  type Theme,
} from "../../providers/theme-provider";
import {
  runThemeTransition,
  type ThemeEffect,
} from "../../providers/theme-transitions";
import { Button, type ButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { cn } from "@/lib/cn";

export interface ThemeToggleProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Display mode: "button" (direct 1-click toggle), "mini" (compact dropdown), "max" (full customizer panel). Defaults to "mini". */
  mode?: "button" | "mini" | "max";
  /** Transition animation effect when changing themes ("none", "circular", "fade") */
  effect?: ThemeEffect;
  /** Button visual style variant when rendered as a button or dropdown trigger */
  variant?: ButtonProps["variant"];
  /** Button size */
  size?: ButtonProps["size"];
  class?: string;
}

const ACCENT_OPTIONS: { name: AccentColor; label: string; color: string }[] = [
  { name: "yellow", label: "Yellow", color: "bg-yellow-500" },
  { name: "red", label: "Red", color: "bg-red-500" },
  { name: "violet", label: "Violet", color: "bg-violet-500" },
  { name: "sky", label: "Sky", color: "bg-sky-500" },
  { name: "emerald", label: "Emerald", color: "bg-emerald-500" },
  { name: "zinc", label: "Zinc", color: "bg-zinc-800 dark:bg-zinc-200" },
];

const RADIUS_OPTIONS: { value: Radius; label: string }[] = [
  { value: "0", label: "0" },
  { value: "0.3", label: "0.3" },
  { value: "0.5", label: "0.5" },
  { value: "0.75", label: "0.75" },
  { value: "1.0", label: "1.0" },
];

/**
 * Interactive UI theme switcher supporting button, mini (dropdown), and max (customizer panel) modes with View Transition animations.
 */
export const ThemeToggle: Component<ThemeToggleProps> = (props) => {
  const [local, rest] = splitProps(props, ["mode", "effect", "variant", "size", "class"]);
  const { theme, setTheme, accent, setAccent, radius, setRadius } = useTheme();

  const mode = () => local.mode || "mini";
  const effect = () => local.effect || "none";

  /* Reactive accessor determining whether dark mode is active */
  const isDarkMode = () => {
    const currentTheme = theme();
    if (currentTheme === "dark") return true;
    if (currentTheme === "light") return false;
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  };

  const changeThemeWithEffect = (newTheme: Theme, e: MouseEvent) => {
    runThemeTransition(effect(), e, () => {
      setTheme(newTheme);
    });
  };

  const handleToggleClick = (e: MouseEvent) => {
    const nextTheme: Theme = isDarkMode() ? "light" : "dark";
    changeThemeWithEffect(nextTheme, e);
  };

  return (
    <Show
      when={mode() !== "button"}
      fallback={
        /* Button Mode: Direct 1-click Dark/Light switcher without dropdown */
        <Button
          variant={local.variant || "ghost"}
          size={local.size || "icon"}
          onClick={handleToggleClick}
          class={cn("relative cursor-pointer", local.class)}
          aria-label="Toggle theme"
          {...rest}
        >
          <Show
            when={isDarkMode()}
            fallback={<Sun class="h-4 w-4 text-foreground transition-transform" />}
          >
            <Moon class="h-4 w-4 text-foreground transition-transform" />
          </Show>
          <span class="sr-only">Toggle theme</span>
        </Button>
      }
    >
      <DropdownMenu placement="bottom-end">
        <DropdownMenuTrigger
          as={Button}
          variant={local.variant || "ghost"}
          size={local.size || "icon"}
          class={cn("relative cursor-pointer", local.class)}
          {...rest}
        >
          {/* Reactive Sun / Moon Icon Toggle */}
          <Show
            when={isDarkMode()}
            fallback={<Sun class="h-4 w-4 text-foreground transition-transform" />}
          >
            <Moon class="h-4 w-4 text-foreground transition-transform" />
          </Show>
          <span class="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>

        <Show
          when={mode() === "max"}
          fallback={
            /* Mini Mode: Compact Dropdown */
            <DropdownMenuContent>
              <DropdownMenuItem onClick={(e: MouseEvent) => changeThemeWithEffect("light", e)}>
                <Sun class="mr-2 h-4 w-4 text-muted-foreground" />
                Light
              </DropdownMenuItem>

              <DropdownMenuItem onClick={(e: MouseEvent) => changeThemeWithEffect("dark", e)}>
                <Moon class="mr-2 h-4 w-4 text-muted-foreground" />
                Dark
              </DropdownMenuItem>

              <DropdownMenuItem onClick={(e: MouseEvent) => changeThemeWithEffect("system", e)}>
                <Monitor class="mr-2 h-4 w-4 text-muted-foreground" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          }
        >
          {/* Max Mode: Full Theme Customizer Panel */}
          <DropdownMenuContent class="w-64">
            <div class="p-2 space-y-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel class="px-0 pt-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Theme Mode
                </DropdownMenuLabel>
                <div class="grid grid-cols-3 gap-1 my-1.5">
                  <Button
                    variant={theme() === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={(e: MouseEvent) => changeThemeWithEffect("light", e)}
                    class="h-8 text-xs cursor-pointer"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme() === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={(e: MouseEvent) => changeThemeWithEffect("dark", e)}
                    class="h-8 text-xs cursor-pointer"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme() === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={(e: MouseEvent) => changeThemeWithEffect("system", e)}
                    class="h-8 text-xs cursor-pointer"
                  >
                    System
                  </Button>
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator class="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuLabel class="px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Brand Accent Color
                </DropdownMenuLabel>
                <div class="flex flex-wrap gap-1.5 my-1.5">
                  <For each={ACCENT_OPTIONS}>
                    {(opt) => (
                      <button
                        type="button"
                        title={opt.label}
                        onClick={() => setAccent(opt.name)}
                        class={cn(
                          "h-6 w-6 rounded-md transition-all cursor-pointer border border-border flex items-center justify-center",
                          opt.color,
                          accent() === opt.name
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                            : "hover:scale-105"
                        )}
                      />
                    )}
                  </For>
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator class="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuLabel class="px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Border Radius
                </DropdownMenuLabel>
                <div class="grid grid-cols-5 gap-1 my-1.5">
                  <For each={RADIUS_OPTIONS}>
                    {(r) => (
                      <Button
                        variant={radius() === r.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRadius(r.value)}
                        class="h-7 text-xs px-1 cursor-pointer"
                      >
                        {r.label}
                      </Button>
                    )}
                  </For>
                </div>
              </DropdownMenuGroup>
            </div>
          </DropdownMenuContent>
        </Show>
      </DropdownMenu>
    </Show>
  );
};