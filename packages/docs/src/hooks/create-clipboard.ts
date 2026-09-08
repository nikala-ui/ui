import { createSignal, onCleanup, type Accessor } from "solid-js";

export interface CreateClipboardOptions {
  /** Time in milliseconds to maintain the copied state before resetting. Defaults to 2000ms. */
  timeout?: number;
}

export interface CreateClipboardReturn {
  /** Signal accessor indicating if content was recently copied */
  copied: Accessor<boolean>;
  /** Function to copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Error state if clipboard write fails */
  error: Accessor<Error | undefined>;
}

/**
 * SolidJS reactive primitive for copying text to clipboard with automatic reset state.
 *
 * @param options Configuration options including copied status reset timeout duration.
 */
export function createClipboard(options: CreateClipboardOptions = {}): CreateClipboardReturn {
  const timeoutDuration = options.timeout ?? 2000;
  const [copied, setCopied] = createSignal(false);
  const [error, setError] = createSignal<Error | undefined>(undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const copy = async (text: string): Promise<boolean> => {
    clearTimer();
    setError(undefined);

    try {
      if (typeof window !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        timer = setTimeout(() => {
          setCopied(false);
        }, timeoutDuration);

        return true;
      }

      throw new Error("Clipboard API not supported");
    } catch (err) {
      const copyError = err instanceof Error ? err : new Error(String(err));
      setError(copyError);
      setCopied(false);
      return false;
    }
  };

  onCleanup(() => {
    clearTimer();
  });

  return {
    copied,
    copy,
    error,
  };
}
