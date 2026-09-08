import { createEffect, createSignal, onCleanup, onMount, type Accessor } from "solid-js";

export type ColorMode = "light" | "dark" | "system";

export interface CreateColorModeOptions {
  /** Initial color mode fallback. Defaults to 'system'. */
  initialValue?: ColorMode;
  /** LocalStorage key for persisting color mode state. Defaults to 'nikala-color-mode'. */
  storageKey?: string;
  /** HTML attribute to apply dark mode class on document.documentElement. Defaults to 'class'. */
  attribute?: string;
}

export interface CreateColorModeReturn {
  /** Accessor for current active color mode ('light', 'dark', 'system') */
  mode: Accessor<ColorMode>;
  /** Function to update current color mode */
  setMode: (mode: ColorMode) => void;
  /** Function to toggle color mode between 'light' and 'dark' */
  toggleColorMode: () => void;
  /** Accessor indicating if current resolved mode is dark */
  isDark: Accessor<boolean>;
}

/**
 * SolidJS reactive primitive for managing dark/light color mode themes and system preferences.
 *
 * @param options Configuration options including storage key and initial mode.
 */
export function createColorMode(
  options: CreateColorModeOptions = {}
): CreateColorModeReturn {
  const initialMode = options.initialValue ?? "system";
  const storageKey = options.storageKey ?? "nikala-color-mode";
  const attribute = options.attribute ?? "class";

  const [mode, setModeSignal] = createSignal<ColorMode>(initialMode);
  const [systemDark, setSystemDark] = createSignal(false);

  const isDark = () => {
    const currentMode = mode();
    if (currentMode === "system") return systemDark();
    return currentMode === "dark";
  };

  const applyTheme = (dark: boolean) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (attribute === "class") {
      if (dark) root.classList.add("dark");
      else root.classList.remove("dark");
    } else {
      root.setAttribute(attribute, dark ? "dark" : "light");
    }
  };

  const setMode = (newMode: ColorMode) => {
    setModeSignal(newMode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, newMode);
      } catch (e) {
        console.warn(`[nikala-ui/hooks] Error setting color mode storage:`, e);
      }
    }
  };

  const toggleColorMode = () => {
    const next = isDark() ? "light" : "dark";
    setMode(next);
  };

  createEffect(() => {
    applyTheme(isDark());
  });

  onMount(() => {
    if (typeof window === "undefined") return;

    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(storageKey) as ColorMode | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        setModeSignal(stored);
      }
    } catch (e) {
      console.warn(`[nikala-ui/hooks] Error reading color mode storage:`, e);
    }

    onCleanup(() => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    });
  });

  return {
    mode,
    setMode,
    toggleColorMode,
    isDark,
  };
}
