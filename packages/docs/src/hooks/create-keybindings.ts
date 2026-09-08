import { onMount, onCleanup, type Accessor } from "solid-js";

export interface KeybindingDefinition {
  /** Key combination string, e.g. "meta+k", "ctrl+k", "Escape", "Shift+Enter" */
  key: string | string[];
  /** Callback handler invoked when the key combination is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Whether to prevent default browser action. Defaults to false. */
  preventDefault?: boolean;
  /** Whether to stop event propagation. Defaults to false. */
  stopPropagation?: boolean;
}

export interface CreateKeybindingsOptions {
  /** Event target to attach listener to. Defaults to window. */
  target?: HTMLElement | Window | Accessor<HTMLElement | Window | undefined>;
  /** Event type: "keydown" (default) or "keyup" */
  eventType?: "keydown" | "keyup";
  /** Whether keybinding listeners are active. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
}

/**
 * Normalizes key string into standardized combination signature (e.g. "ctrl+meta+k").
 */
function normalizeKeyCombination(keyStr: string): string {
  const parts = keyStr.toLowerCase().split("+").map((p) => p.trim());
  const modifiers = new Set<string>();
  let mainKey = "";

  for (const part of parts) {
    if (part === "meta" || part === "cmd" || part === "command" || part === "⌘") {
      modifiers.add("meta");
    } else if (part === "ctrl" || part === "control") {
      modifiers.add("ctrl");
    } else if (part === "alt" || part === "option" || part === "⌥") {
      modifiers.add("alt");
    } else if (part === "shift" || part === "⇧") {
      modifiers.add("shift");
    } else {
      mainKey = part;
    }
  }

  const sortedMods = Array.from(modifiers).sort();
  return [...sortedMods, mainKey].join("+");
}

/**
 * Checks if a KeyboardEvent matches a normalized key combination.
 */
function isEventMatch(event: KeyboardEvent, targetCombination: string): boolean {
  const modifiers = new Set<string>();
  if (event.metaKey) modifiers.add("meta");
  if (event.ctrlKey) modifiers.add("ctrl");
  if (event.altKey) modifiers.add("alt");
  if (event.shiftKey) modifiers.add("shift");

  const mainKey = event.key.toLowerCase();
  const eventCombination = [...Array.from(modifiers).sort(), mainKey].join("+");

  return eventCombination === targetCombination;
}

/**
 * SolidJS reactive primitive for listening to single or multiple keyboard shortcuts.
 *
 * @param bindings Array of keybinding definitions or single definition object.
 * @param options Configuration options including target, event type, and enabled state.
 */
export function createKeybindings(
  bindings: KeybindingDefinition | KeybindingDefinition[],
  options: CreateKeybindingsOptions = {}
): void {
  const bindingList = Array.isArray(bindings) ? bindings : [bindings];

  const isEnabled = () => {
    if (typeof options.enabled === "function") {
      return options.enabled();
    }
    return options.enabled ?? true;
  };

  const getTargetElement = (): HTMLElement | Window | undefined => {
    if (!options.target) {
      return typeof window !== "undefined" ? window : undefined;
    }
    if (typeof options.target === "function") {
      return (options.target as Accessor<HTMLElement | Window | undefined>)();
    }
    return options.target;
  };

  const handleKeyboardEvent = (event: KeyboardEvent) => {
    if (!isEnabled()) return;

    for (const binding of bindingList) {
      const keys = Array.isArray(binding.key) ? binding.key : [binding.key];

      for (const keyCombo of keys) {
        const normalizedCombo = normalizeKeyCombination(keyCombo);

        if (isEventMatch(event, normalizedCombo)) {
          if (binding.preventDefault) {
            event.preventDefault();
          }
          if (binding.stopPropagation) {
            event.stopPropagation();
          }
          binding.handler(event);
          break;
        }
      }
    }
  };

  onMount(() => {
    const target = getTargetElement();
    if (!target) return;

    const eventType = options.eventType || "keydown";
    target.addEventListener(eventType, handleKeyboardEvent as EventListener);

    onCleanup(() => {
      target.removeEventListener(eventType, handleKeyboardEvent as EventListener);
    });
  });
}

/**
 * SolidJS primitive specialized for handling Escape key presses.
 *
 * @param handler Callback invoked when Escape key is pressed.
 * @param options Keybindings options.
 */
export function createEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options: CreateKeybindingsOptions = {}
): void {
  createKeybindings(
    {
      key: "Escape",
      handler,
      preventDefault: true,
    },
    options
  );
}
