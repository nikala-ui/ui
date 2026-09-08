export type ThemeEffect = "none" | "circular" | "fade";

/**
 * Injects required CSS view-transition pseudo-element styles to prevent browser mix-blend artifacts.
 */
function ensureTransitionStyles() {
  if (typeof document === "undefined") return;
  const styleId = "nikala-view-transition-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
      ::view-transition-old(root) {
        z-index: 1;
      }
      ::view-transition-new(root) {
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Checks whether the current environment is Linux WebKitGTK (e.g. Tauri on Linux)
 * where CSS View Transitions pseudo-element animations trigger known WebProcess crashes.
 */
function isLinuxWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isLinux = /linux/i.test(ua);
  const isWebKit = /applewebkit/i.test(ua);
  const isChrome = /chrome|chromium|edg/i.test(ua);
  const isTauri = typeof window !== "undefined" && typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

  return isLinux && ((isWebKit && !isChrome) || isTauri);
}

/**
 * Executes a theme change with the specified transition effect using the Web View Transitions API.
 * Supported on modern browsers, Windows (Tauri WebView2), and macOS (Tauri WKWebView).
 * Automatically falls back to safe instant transitions on Linux WebKitGTK.
 *
 * @param effect - Desired transition animation ("none", "circular", "fade")
 * @param event - Mouse or Pointer event to calculate transition center coordinates
 * @param updateThemeCallback - Callback function performing the actual theme state change
 */
export function runThemeTransition(
  effect: ThemeEffect = "none",
  event: MouseEvent | undefined,
  updateThemeCallback: () => void
) {
  // Safe fallback if View Transitions API is unsupported, reduced motion is preferred,
  // or on Linux WebKitGTK where pseudo-element clipping transitions trigger WebProcess faults
  if (
    effect === "none" ||
    typeof document === "undefined" ||
    !(document as any).startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    isLinuxWebKit()
  ) {
    updateThemeCallback();
    return;
  }

  ensureTransitionStyles();

  try {
    // Circular expanding ripple transition originating from click coordinates
    if (effect === "circular" && event) {
      const x = event.clientX;
      const y = event.clientY;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        updateThemeCallback();
      });

      transition.ready
        ?.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        ?.catch(() => {
          // Graceful fallback
        });
      return;
    }

    // Smooth opacity fade view transition
    if (effect === "fade") {
      const transition = (document as any).startViewTransition(() => {
        updateThemeCallback();
      });

      transition.ready
        ?.then(() => {
          document.documentElement.animate(
            {
              opacity: [0, 1],
            },
            {
              duration: 350,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        ?.catch(() => {
          // Graceful fallback
        });
      return;
    }

    updateThemeCallback();
  } catch {
    updateThemeCallback();
  }
}