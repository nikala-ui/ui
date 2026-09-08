import {
  createSignal,
  createEffect,
  onCleanup,
  splitProps,
  type Component,
  type JSX,
  type Accessor,
} from "solid-js";
import { createScrollPosition } from "@/hooks/create-scroll-position";
import { createElementSize } from "@/hooks/create-resize-observer";
import { cn } from "@/lib/cn";

export interface ScrollAreaProps extends JSX.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
  scrollHideDelay?: number;
  class?: string;
  children?: JSX.Element;
}

export const ScrollArea: Component<ScrollAreaProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "orientation",
    "scrollHideDelay",
    "class",
    "children",
  ]);

  const orientation = () => local.orientation || "vertical";
  let viewportRef: HTMLDivElement | undefined;
  let verticalTrackRef: HTMLDivElement | undefined;
  let horizontalTrackRef: HTMLDivElement | undefined;

  const scrollPos = createScrollPosition({
    target: () => viewportRef,
  });

  const viewportSize = createElementSize(() => viewportRef);

  const [thumbHeight, setThumbHeight] = createSignal(0);
  const [thumbTop, setThumbTop] = createSignal(0);
  const [thumbWidth, setThumbWidth] = createSignal(0);
  const [thumbLeft, setThumbLeft] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  const updateThumbMetrics = () => {
    if (!viewportRef) return;

    const scrollHeight = viewportRef.scrollHeight;
    const clientHeight = viewportRef.clientHeight;
    const scrollWidth = viewportRef.scrollWidth;
    const clientWidth = viewportRef.clientWidth;

    // Track available lengths (considering 4px track padding)
    const trackHeight = verticalTrackRef ? verticalTrackRef.clientHeight - 4 : clientHeight - 4;
    const trackWidth = horizontalTrackRef ? horizontalTrackRef.clientWidth - 4 : clientWidth - 4;

    // Vertical thumb metrics
    if (scrollHeight > clientHeight && clientHeight > 0) {
      const vRatio = clientHeight / scrollHeight;
      const calculatedHeight = Math.max(vRatio * trackHeight, 20);
      const maxTop = trackHeight - calculatedHeight;
      const topPct = scrollPos.y() / (scrollHeight - clientHeight);
      setThumbHeight(calculatedHeight);
      setThumbTop(topPct * maxTop);
    } else {
      setThumbHeight(0);
    }

    // Horizontal thumb metrics
    if (scrollWidth > clientWidth && clientWidth > 0) {
      const hRatio = clientWidth / scrollWidth;
      const calculatedWidth = Math.max(hRatio * trackWidth, 20);
      const maxLeft = trackWidth - calculatedWidth;
      const leftPct = scrollPos.x() / (scrollWidth - clientWidth);
      setThumbWidth(calculatedWidth);
      setThumbLeft(leftPct * maxLeft);
    } else {
      setThumbWidth(0);
    }
  };

  createEffect(() => {
    viewportSize.width();
    viewportSize.height();
    scrollPos.x();
    scrollPos.y();
    updateThumbMetrics();
  });

  // Enable mouse drag on Vertical Thumb
  const handleVerticalThumbPointerDown = (e: PointerEvent) => {
    if (!viewportRef || !verticalTrackRef) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    const startY = e.clientY;
    const startScrollTop = viewportRef.scrollTop;
    const scrollHeight = viewportRef.scrollHeight;
    const clientHeight = viewportRef.clientHeight;
    const trackHeight = verticalTrackRef.clientHeight - 4;

    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - thumbHeight();
    const ratio = maxThumbTop > 0 ? maxScrollTop / maxThumbTop : 0;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      viewportRef!.scrollTop = Math.max(0, Math.min(maxScrollTop, startScrollTop + deltaY * ratio));
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Enable mouse drag on Horizontal Thumb
  const handleHorizontalThumbPointerDown = (e: PointerEvent) => {
    if (!viewportRef || !horizontalTrackRef) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    const startX = e.clientX;
    const startScrollLeft = viewportRef.scrollLeft;
    const scrollWidth = viewportRef.scrollWidth;
    const clientWidth = viewportRef.clientWidth;
    const trackWidth = horizontalTrackRef.clientWidth - 4;

    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth();
    const ratio = maxThumbLeft > 0 ? maxScrollLeft / maxThumbLeft : 0;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      viewportRef!.scrollLeft = Math.max(0, Math.min(maxScrollLeft, startScrollLeft + deltaX * ratio));
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Convert vertical mouse wheel into horizontal scroll proportionally
  const handleWheel = (e: WheelEvent) => {
    if (orientation() === "horizontal" && viewportRef) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        viewportRef.scrollLeft += e.deltaY;
      }
    }
  };

  return (
    <div
      class={cn("relative overflow-hidden group/scroll-area", local.class)}
      onWheel={handleWheel}
      {...rest}
    >
      {/* Scroll Viewport Container */}
      <div
        ref={viewportRef}
        class="h-full w-full max-h-[inherit] overflow-auto scrollbar-none rounded-[inherit]"
        style={{
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
        }}
      >
        {local.children}
      </div>

      {/* Vertical Scrollbar Track & Thumb */}
      {(orientation() === "vertical" || orientation() === "both") && thumbHeight() > 0 && (
        <div
          ref={verticalTrackRef}
          class={cn(
            "absolute right-0 top-0 bottom-0 w-2.5 p-0.5 select-none transition-opacity duration-300 pointer-events-none",
            scrollPos.isScrolling() || isDragging()
              ? "opacity-100"
              : "opacity-0 group-hover/scroll-area:opacity-100"
          )}
        >
          <div
            class="w-1.5 rounded-lg bg-border hover:bg-muted-foreground/50 transition-colors cursor-pointer pointer-events-auto"
            style={{
              height: `${thumbHeight()}px`,
              transform: `translateY(${thumbTop()}px)`,
            }}
            onPointerDown={handleVerticalThumbPointerDown}
          />
        </div>
      )}

      {/* Horizontal Scrollbar Track & Thumb */}
      {(orientation() === "horizontal" || orientation() === "both") && thumbWidth() > 0 && (
        <div
          ref={horizontalTrackRef}
          class={cn(
            "absolute bottom-0 left-0 right-0 h-2.5 p-0.5 select-none transition-opacity duration-300 pointer-events-none",
            scrollPos.isScrolling() || isDragging()
              ? "opacity-100"
              : "opacity-0 group-hover/scroll-area:opacity-100"
          )}
        >
          <div
            class="h-1.5 rounded-lg bg-border hover:bg-muted-foreground/50 transition-colors cursor-pointer pointer-events-auto"
            style={{
              width: `${thumbWidth()}px`,
              transform: `translateX(${thumbLeft()}px)`,
            }}
            onPointerDown={handleHorizontalThumbPointerDown}
          />
        </div>
      )}
    </div>
  );
};
