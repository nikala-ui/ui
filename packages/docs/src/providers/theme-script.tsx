import { isServer } from "solid-js/web";
import type { Component } from "solid-js";

export interface ThemeScriptProps {
  /** Storage key namespace used in localStorage (default: "nikala-theme") */
  storageKey?: string;
  /** Initial default theme mode if no saved preference exists (default: "system") */
  defaultTheme?: "light" | "dark" | "system";
  /** Initial default primary accent color if no saved preference exists */
  defaultAccent?: string;
  /** Initial default border radius if no saved preference exists */
  defaultRadius?: string;
}

/**
 * Pre-hydration inline script executed synchronously before DOM paint to prevent theme flickering (anti-FOUC).
 */
export const ThemeScript: Component<ThemeScriptProps> = (props) => {
  if (!isServer) return null;
  const key = props.storageKey || "nikala-theme";
  const defTheme = props.defaultTheme || "system";
  const defAccent = props.defaultAccent || "";
  const defRadius = props.defaultRadius || "";

  const scriptText = `(function(){try{
  var key = '${key}';
  var mode = localStorage.getItem(key + '-mode') || '${defTheme}';
  var accent = localStorage.getItem(key + '-accent') || '${defAccent}';
  var radius = localStorage.getItem(key + '-radius') || '${defRadius}';

  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var resolvedDark = mode === 'dark' || (mode === 'system' && isDark);

  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedDark ? 'dark' : 'light');
  root.style.colorScheme = resolvedDark ? 'dark' : 'light';

  var colorMap = {
    yellow: {
      primary: resolvedDark ? 'oklch(0.852 0.199 91.936)' : 'oklch(0.795 0.184 86.047)',
      foreground: 'oklch(0.145 0 0)'
    },
    red: {
      primary: resolvedDark ? 'oklch(0.637 0.237 25.331)' : 'oklch(0.577 0.245 27.325)',
      foreground: 'oklch(0.985 0 0)'
    },
    violet: {
      primary: resolvedDark ? 'oklch(0.606 0.25 292.717)' : 'oklch(0.541 0.281 293.009)',
      foreground: 'oklch(0.985 0 0)'
    },
    sky: {
      primary: resolvedDark ? 'oklch(0.672 0.154 238.29)' : 'oklch(0.588 0.158 241.966)',
      foreground: resolvedDark ? 'oklch(0.145 0 0)' : 'oklch(0.985 0 0)'
    },
    emerald: {
      primary: resolvedDark ? 'oklch(0.696 0.17 162.48)' : 'oklch(0.596 0.145 163.225)',
      foreground: resolvedDark ? 'oklch(0.145 0 0)' : 'oklch(0.985 0 0)'
    },
    zinc: {
      primary: resolvedDark ? 'oklch(0.985 0 0)' : 'oklch(0.205 0 0)',
      foreground: resolvedDark ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)'
    }
  };

  if (accent && colorMap[accent]) {
    root.style.setProperty('--primary', colorMap[accent].primary);
    root.style.setProperty('--primary-foreground', colorMap[accent].foreground);
  }

  if (radius) {
    var radVal = radius.endsWith('rem') ? radius : radius + 'rem';
    root.style.setProperty('--radius', radVal);
  }
}catch(e){}})();`;

  return <script innerHTML={scriptText} />;
};