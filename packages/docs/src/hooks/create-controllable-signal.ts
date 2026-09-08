import { createSignal, type Accessor } from "solid-js";

export interface CreateControllableSignalOptions<T> {
  /** Controlled value accessor or raw value */
  value?: Accessor<T | undefined> | T;
  /** Uncontrolled default initial value */
  defaultValue?: T;
  /** Callback fired whenever the value changes */
  onChange?: (value: T) => void;
}

/**
 * SolidJS reactive primitive for managing state supporting both controlled and uncontrolled modes.
 *
 * @param options Configuration options for value, defaultValue, and onChange callback.
 * @returns A tuple containing [valueAccessor, setValueFunction].
 */
export function createControllableSignal<T>(
  options: CreateControllableSignalOptions<T>
): [Accessor<T | undefined>, (nextValue: T | ((prev: T | undefined) => T)) => void] {
  const [internalValue, setInternalValue] = createSignal<T | undefined>(
    options.defaultValue
  );

  const getValue = (): T | undefined => {
    if (typeof options.value === "function") {
      return (options.value as Accessor<T | undefined>)();
    }
    return options.value;
  };

  const isControlled = () => getValue() !== undefined;

  const value = () => {
    const controlledVal = getValue();
    return controlledVal !== undefined ? controlledVal : internalValue();
  };

  const setValue = (nextValue: T | ((prev: T | undefined) => T)) => {
    const current = value();
    const resolvedNext =
      typeof nextValue === "function"
        ? (nextValue as (prev: T | undefined) => T)(current)
        : nextValue;

    if (!isControlled()) {
      setInternalValue(resolvedNext as any);
    }

    if (typeof options.onChange === "function") {
      options.onChange(resolvedNext);
    }
  };

  return [value, setValue];
}