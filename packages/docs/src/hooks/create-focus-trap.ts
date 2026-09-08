import { createEffect, onCleanup, type Accessor } from "solid-js";

export interface CreateFocusTrapOptions {
  /** Whether focus trap is actively enabled. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
  /** Whether to return focus to previously focused element on cleanup. Defaults to true. */
  returnFocusOnDeactivate?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

/**
 * SolidJS reactive primitive for trapping keyboard focus inside target container element.
 *
 * @param target Target element or accessor returning HTML element.
 * @param options Configuration options for focus trap behavior.
 */
export function createFocusTrap(
  target: HTMLElement | Accessor<HTMLElement | undefined>,
  options: CreateFocusTrapOptions = {}
): void {
  const getTarget = (): HTMLElement | undefined => {
    if (typeof target === "function") {
      return (target as Accessor<HTMLElement | undefined>)();
    }
    return target;
  };

  const isEnabled = (): boolean => {
    if (typeof options.enabled === "function") {
      return options.enabled();
    }
    return options.enabled ?? true;
  };

  createEffect(() => {
    if (typeof window === "undefined" || !isEnabled()) return;

    const container = getTarget();
    if (!container) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );
    };

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement || !container.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);

      if (options.returnFocusOnDeactivate !== false && previousActiveElement) {
        previousActiveElement.focus?.();
      }
    });
  });
}
