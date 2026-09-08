import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type ParentComponent,
  type Accessor,
} from "solid-js";

export type Theme = "light" | "dark" | "system";
export type AccentColor = "yellow" | "red" | "violet" | "sky" | "emerald" | "zinc";
export type Radius = "0" | "0.3" | "0.5" | "0.75" | "1.0";

export interface ThemeProviderProps {
  /** Initial default theme mode if no saved preference is found in localStorage */
  defaultTheme?: Theme;
  /** Initial default accent color override if needed */
  defaultAccent?: AccentColor;
  /** Initial default border radius override if needed */
  defaultRadius?: Radius;
  /** Key used to store theme preferences in localStorage */
  storageKey?: string;
}

const ACCENT_COLORS: Record<
  AccentColor,
  { light: string; dark: string; lightFg: string; darkFg: string }
> = {
  yellow: { light: "oklch(0.795 0.184 86.047)", dark: "oklch(0.852 0.199 91.936)", lightFg: "oklch(0.145 0 0)", darkFg: "oklch(0.145 0 0)" },
  red: { light: "oklch(0.577 0.245 27.325)", dark: "oklch(0.637 0.237 25.331)", lightFg: "oklch(0.985 0 0)", darkFg: "oklch(0.985 0 0)" },
  violet: { light: "oklch(0.541 0.281 293.009)", dark: "oklch(0.606 0.25 292.717)", lightFg: "oklch(0.985 0 0)", darkFg: "oklch(0.985 0 0)" },
  sky: { light: "oklch(0.588 0.158 241.966)", dark: "oklch(0.672 0.154 238.29)", lightFg: "oklch(0.985 0 0)", darkFg: "oklch(0.145 0 0)" },
  emerald: { light: "oklch(0.596 0.145 163.225)", dark: "oklch(0.696 0.17 162.48)", lightFg: "oklch(0.985 0 0)", darkFg: "oklch(0.145 0 0)" },
  zinc: { light: "oklch(0.205 0 0)", dark: "oklch(0.985 0 0)", lightFg: "oklch(0.985 0 0)", darkFg: "oklch(0.205 0 0)" },
};

interface ThemeProviderContextValue {
  theme: Accessor<Theme>;
  setTheme: (theme: Theme) => void;
  accent: Accessor<AccentColor | undefined>;
  setAccent: (accent: AccentColor) => void;
  radius: Accessor<Radius | undefined>;
  setRadius: (radius: Radius) => void;
}

const ThemeProviderContext = createContext<ThemeProviderContextValue>();

/**
 * Context provider managing application theme state (light/dark/system), accent colors, and border radius.
 */
export const ThemeProvider: ParentComponent<ThemeProviderProps> = (props) => {
  const storageKey = props.storageKey || "nikala-theme";
  const defaultTheme = props.defaultTheme || "system";

  // Safely read saved values from localStorage without forcing unnecessary fallbacks
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const saved = localStorage.getItem(`${storageKey}-mode`);
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch { }
    return defaultTheme;
  };

  const getInitialAccent = (): AccentColor | undefined => {
    if (typeof window === "undefined") return props.defaultAccent;
    try {
      const saved = localStorage.getItem(`${storageKey}-accent`);
      if (saved && ACCENT_COLORS[saved as AccentColor]) return saved as AccentColor;
    } catch { }
    return props.defaultAccent;
  };

  const getInitialRadius = (): Radius | undefined => {
    if (typeof window === "undefined") return props.defaultRadius;
    try {
      const saved = localStorage.getItem(`${storageKey}-radius`);
      if (saved) return saved as Radius;
    } catch { }
    return props.defaultRadius;
  };

  const [theme, setThemeSignal] = createSignal<Theme>(getInitialTheme());
  const [accent, setAccentSignal] = createSignal<AccentColor | undefined>(getInitialAccent());
  const [radius, setRadiusSignal] = createSignal<Radius | undefined>(getInitialRadius());

  // Applies classes and CSS custom properties when custom overrides are explicitly set
  const applyTheme = (
    targetTheme: Theme,
    currentAccent: AccentColor | undefined,
    currentRadius: Radius | undefined
  ) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let resolvedDark = false;
    if (targetTheme === "system") {
      resolvedDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(resolvedDark ? "dark" : "light");
    } else {
      resolvedDark = targetTheme === "dark";
      root.classList.add(targetTheme);
    }
    root.style.colorScheme = resolvedDark ? "dark" : "light";

    // Override --primary CSS variables ONLY if explicitly chosen
    if (currentAccent && ACCENT_COLORS[currentAccent]) {
      const accentData = ACCENT_COLORS[currentAccent];
      const primaryHex = resolvedDark ? accentData.dark : accentData.light;
      const primaryFgHex = resolvedDark ? accentData.darkFg : accentData.lightFg;

      root.style.setProperty("--primary", primaryHex);
      root.style.setProperty("--primary-foreground", primaryFgHex);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
    }

    // Override --radius CSS variable ONLY if explicitly chosen
    if (currentRadius) {
      root.style.setProperty("--radius", `${currentRadius}rem`);
    } else {
      root.style.removeProperty("--radius");
    }
  };

  // Reactively apply theme updates and store preferences in localStorage
  createEffect(() => {
    const t = theme();
    const a = accent();
    const r = radius();

    applyTheme(t, a, r);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${storageKey}-mode`, t);
        if (a) localStorage.setItem(`${storageKey}-accent`, a);
        else localStorage.removeItem(`${storageKey}-accent`);
        if (r) localStorage.setItem(`${storageKey}-radius`, r);
        else localStorage.removeItem(`${storageKey}-radius`);
      } catch { }
    }
  });

  onMount(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme() === "system") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
        root.style.colorScheme = e.matches ? "dark" : "light";

        const currentAccent = accent();
        if (currentAccent && ACCENT_COLORS[currentAccent]) {
          const accentData = ACCENT_COLORS[currentAccent];
          const primaryHex = e.matches ? accentData.dark : accentData.light;
          const primaryFgHex = e.matches ? accentData.darkFg : accentData.lightFg;

          root.style.setProperty("--primary", primaryHex);
          root.style.setProperty("--primary-foreground", primaryFgHex);
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else if ("addListener" in mediaQuery) {
      (mediaQuery as any).addListener(handleSystemChange);
    }

    onCleanup(() => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else if ("removeListener" in mediaQuery) {
        (mediaQuery as any).removeListener(handleSystemChange);
      }
    });
  });

  const value: ThemeProviderContextValue = {
    theme,
    setTheme: (newTheme: Theme) => setThemeSignal(newTheme),
    accent,
    setAccent: (newAccent: AccentColor) => setAccentSignal(newAccent),
    radius,
    setRadius: (newRadius: Radius) => setRadiusSignal(newRadius),
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {props.children}
    </ThemeProviderContext.Provider>
  );
};

/**
 * Accesses Nikala UI theme state, accent colors, border radius, and update functions.
 */
export function useTheme(): ThemeProviderContextValue {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { ThemeScript, type ThemeScriptProps } from "./theme-script";