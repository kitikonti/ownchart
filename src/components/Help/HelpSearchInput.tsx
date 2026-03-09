/**
 * HelpSearchInput — text input with clear button for searching help topics.
 */

import { useRef, useEffect, useCallback, useId } from "react";
import type { ChangeEvent, JSX } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Input } from "../common/Input";

/** Delay (ms) before auto-focusing the input — avoids focus race with modal focus trap */
const AUTOFOCUS_DELAY_MS = 50;

export interface HelpSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function HelpSearchInput({
  value,
  onChange,
}: HelpSearchInputProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  // Stable id so the <label htmlFor> association is valid from the first render.
  const inputId = useId();

  // Auto-focus the search input when mounted
  useEffect(() => {
    const timer = setTimeout(
      () => inputRef.current?.focus(),
      AUTOFOCUS_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => onChange(e.target.value),
    [onChange]
  );

  const handleClear = useCallback((): void => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div role="search" aria-label="Search help topics" className="relative">
      {/* Visually-hidden label for the input — avoids the duplicate-announcement
          that occurs when both the search landmark and the input carry the same
          aria-label. The landmark provides the outer context; the label names the
          input specifically. */}
      <label htmlFor={inputId} className="sr-only">
        Search help topics
      </label>
      <MagnifyingGlass
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        id={inputId}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search help topics..."
        variant="figma"
        className="pl-9 pr-8"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
