import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

export type ScrollDirection = "up" | "down" | "left" | "right" | "none";

export interface CreateScrollPositionOptions {
  /** Target element to observe scroll events on. Defaults to window. */
  target?: HTMLElement | Window | Accessor<HTMLElement | Window | undefined>;
}

export interface CreateScrollPositionReturn {
  /** Accessor for horizontal scroll position (scrollLeft / pageXOffset) */
  x: Accessor<number>;
  /** Accessor for vertical scroll position (scrollTop / pageYOffset) */
  y: Accessor<number>;
  /** Accessor indicating if element is actively scrolling */
  isScrolling: Accessor<boolean>;
  /** Accessor for current scroll direction ('up', 'down', 'left', 'right', 'none') */
  direction: Accessor<ScrollDirection>;
  /** Accessor indicating if scroll is at top (y <= 0) */
  isAtTop: Accessor<boolean>;
  /** Accessor indicating if scroll is at bottom of container */
  isAtBottom: Accessor<boolean>;
  /** Function to programmatically scroll target element */
  scrollTo: (options: ScrollToOptions) => void;
}

/**
 * SolidJS reactive primitive for tracking target element or window scroll position and scroll metrics.
 *
 * @param options Configuration options including target element.
 */
export function createScrollPosition(
  options: CreateScrollPositionOptions = {}
): CreateScrollPositionReturn {
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [isScrolling, setIsScrolling] = createSignal(false);
  const [direction, setDirection] = createSignal<ScrollDirection>("none");
  const [isAtTop, setIsAtTop] = createSignal(true);
  const [isAtBottom, setIsAtBottom] = createSignal(false);

  let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  let lastX = 0;
  let lastY = 0;

  const getTarget = (): HTMLElement | Window | undefined => {
    if (typeof window === "undefined") return undefined;
    if (!options.target) return window;
    if (typeof options.target === "function") {
      return (options.target as Accessor<HTMLElement | Window | undefined>)();
    }
    return options.target;
  };

  const updateScroll = () => {
    const target = getTarget();
    if (!target) return;

    let currentX = 0;
    let currentY = 0;
    let maxScrollY = 0;

    if (target === window) {
      currentX = window.scrollX || window.pageXOffset;
      currentY = window.scrollY || window.pageYOffset;
      maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    } else {
      const el = target as HTMLElement;
      currentX = el.scrollLeft;
      currentY = el.scrollTop;
      maxScrollY = el.scrollHeight - el.clientHeight;
    }

    // Determine direction
    const deltaX = currentX - lastX;
    const deltaY = currentY - lastY;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) setDirection("down");
      else if (deltaY < 0) setDirection("up");
    } else if (Math.abs(deltaX) > 0) {
      if (deltaX > 0) setDirection("right");
      else if (deltaX < 0) setDirection("left");
    }

    lastX = currentX;
    lastY = currentY;

    setX(currentX);
    setY(currentY);
    setIsAtTop(currentY <= 0);
    setIsAtBottom(maxScrollY > 0 && currentY >= maxScrollY - 1);
    setIsScrolling(true);

    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  createEffect(() => {
    const target = getTarget();
    if (!target) return;

    updateScroll();

    target.addEventListener("scroll", updateScroll, { passive: true });
    onCleanup(() => {
      target.removeEventListener("scroll", updateScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    });
  });

  const scrollTo = (scrollOptions: ScrollToOptions) => {
    const target = getTarget();
    if (!target) return;
    target.scrollTo(scrollOptions);
  };

  return {
    x,
    y,
    isScrolling,
    direction,
    isAtTop,
    isAtBottom,
    scrollTo,
  };
}
