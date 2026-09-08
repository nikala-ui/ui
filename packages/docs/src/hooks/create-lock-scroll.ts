import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

export interface CreateLockScrollOptions {
  /** Target element to lock scroll for. Defaults to document.body. */
  target?: HTMLElement | Accessor<HTMLElement | undefined>;
  /** Initial lock state. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
}

export interface CreateLockScrollReturn {
  /** Accessor indicating whether scroll is currently locked */
  isLocked: Accessor<boolean>;
  /** Setter function to programmatically lock or unlock scroll */
  setLocked: (locked: boolean) => void;
}

/**
 * SolidJS reactive primitive for locking target element (or document.body) scroll.
 *
 * @param options Configuration options including target element and initial enabled state.
 */
export function createLockScroll(options: CreateLockScrollOptions = {}): CreateLockScrollReturn {
  const [internalLocked, setInternalLocked] = createSignal(false);

  const getTarget = (): HTMLElement | undefined => {
    if (typeof window === "undefined") return undefined;

    if (!options.target) {
      return document.body;
    }
    if (typeof options.target === "function") {
      return (options.target as Accessor<HTMLElement | undefined>)();
    }
    return options.target;
  };

  const isEnabled = (): boolean => {
    if (typeof options.enabled === "function") {
      return options.enabled();
    }
    return options.enabled ?? true;
  };

  let originalOverflow: string | undefined;

  const applyLock = (element: HTMLElement) => {
    if (originalOverflow === undefined) {
      originalOverflow = element.style.overflow;
    }
    element.style.overflow = "hidden";
    setInternalLocked(true);
  };

  const removeLock = (element: HTMLElement) => {
    if (originalOverflow !== undefined) {
      element.style.overflow = originalOverflow;
      originalOverflow = undefined;
    } else {
      element.style.overflow = "";
    }
    setInternalLocked(false);
  };

  createEffect(() => {
    const el = getTarget();
    if (!el) return;

    if (isEnabled()) {
      applyLock(el);
    } else {
      removeLock(el);
    }
  });

  onCleanup(() => {
    const el = getTarget();
    if (el) {
      removeLock(el);
    }
  });

  const setLocked = (locked: boolean) => {
    const el = getTarget();
    if (!el) return;

    if (locked) {
      applyLock(el);
    } else {
      removeLock(el);
    }
  };

  return {
    isLocked: internalLocked,
    setLocked,
  };
}
