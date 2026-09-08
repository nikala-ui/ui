import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

export interface CreateResizeObserverOptions extends ResizeObserverOptions {
  /** Whether the observer is active. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
}

/**
 * SolidJS reactive primitive for observing element size changes via ResizeObserver.
 *
 * @param target Target element or accessor returning HTML element.
 * @param callback Observer callback invoked on element resize events.
 * @param options ResizeObserver options (box, enabled).
 */
export function createResizeObserver(
  target: HTMLElement | Accessor<HTMLElement | undefined>,
  callback: ResizeObserverCallback,
  options: CreateResizeObserverOptions = {}
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
    if (typeof window === "undefined" || !window.ResizeObserver) {
      return;
    }

    if (!isEnabled()) return;

    const el = getTarget();
    if (!el) return;

    const observer = new ResizeObserver(callback);
    observer.observe(el, { box: options.box });

    onCleanup(() => {
      observer.disconnect();
    });
  });
}

export interface CreateElementSizeReturn {
  /** Accessor for element width in pixels */
  width: Accessor<number>;
  /** Accessor for element height in pixels */
  height: Accessor<number>;
}

/**
 * SolidJS reactive primitive returning width and height accessors for a target HTML element.
 *
 * @param target Target element or accessor returning HTML element.
 * @param options ResizeObserver options.
 */
export function createElementSize(
  target: HTMLElement | Accessor<HTMLElement | undefined>,
  options: CreateResizeObserverOptions = {}
): CreateElementSizeReturn {
  const [width, setWidth] = createSignal(0);
  const [height, setHeight] = createSignal(0);

  createResizeObserver(
    target,
    (entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
        setHeight(entry.contentRect.height);
      }
    },
    options
  );

  return {
    width,
    height,
  };
}
