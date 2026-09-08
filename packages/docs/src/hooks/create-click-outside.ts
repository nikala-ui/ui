import { onMount, onCleanup, type Accessor } from "solid-js";

export interface CreateClickOutsideOptions {
  /** Target HTML element or accessor returning the container element */
  target:
    | HTMLElement
    | Accessor<HTMLElement | undefined>
    | (HTMLElement | Accessor<HTMLElement | undefined>)[];
  /** Callback fired when a click/pointer event occurs outside the target element(s) */
  onInteractOutside: (event: MouseEvent | PointerEvent | TouchEvent) => void;
  /** Whether the listener is active. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
  /** Optional element or accessor to ignore when checking outside clicks (e.g. trigger button) */
  ignore?:
    | HTMLElement
    | Accessor<HTMLElement | undefined>
    | (HTMLElement | Accessor<HTMLElement | undefined>)[];
}

/**
 * SolidJS reactive primitive for detecting user interactions outside specified element(s).
 *
 * @param options Configuration options including target element(s), callback, and optional ignore elements.
 */
export function createClickOutside(options: CreateClickOutsideOptions): void {
  const isEnabled = () => {
    if (typeof options.enabled === "function") {
      return options.enabled();
    }
    return options.enabled ?? true;
  };

  const getElement = (
    el: HTMLElement | Accessor<HTMLElement | undefined> | undefined
  ): HTMLElement | undefined => {
    if (!el) return undefined;
    if (typeof el === "function") {
      return (el as Accessor<HTMLElement | undefined>)();
    }
    return el;
  };

  const getElements = (
    targets:
      | HTMLElement
      | Accessor<HTMLElement | undefined>
      | (HTMLElement | Accessor<HTMLElement | undefined>)[]
      | undefined
  ): HTMLElement[] => {
    if (!targets) return [];
    const list = Array.isArray(targets) ? targets : [targets];
    return list.map(getElement).filter((e): e is HTMLElement => e !== undefined);
  };

  const handlePointerDown = (event: MouseEvent | PointerEvent | TouchEvent) => {
    if (!isEnabled()) return;

    const targetNode = event.target as Node | null;
    if (!targetNode) return;

    const mainElements = getElements(options.target);
    if (mainElements.length === 0) return;

    const isInsideTarget = mainElements.some((el) => el.contains(targetNode));
    if (isInsideTarget) return;

    const ignoreElements = getElements(options.ignore);
    const isInsideIgnore = ignoreElements.some((el) => el.contains(targetNode));
    if (isInsideIgnore) return;

    options.onInteractOutside(event);
  };

  onMount(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("pointerdown", handlePointerDown, true);
    onCleanup(() => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
    });
  });
}
