/**
 * HelpSearchInput — text input with clear button for searching help topics.
 */

import { useRef, useEffect } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

interface HelpSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function HelpSearchInput({
  value,
  onChange,
}: HelpSearchInputProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input when mounted
  useEffect(() => {
    // Small delay to avoid focus race with modal focus
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <MagnifyingGlass
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search help topics..."
        className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-200 rounded bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-colors"
        aria-label="Search help topics"
      />
      {value.length > 0 && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
