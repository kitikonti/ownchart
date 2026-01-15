/**
 * Collapsible section with header button and expandable content.
 * Used in export dialogs for Layout Options and Display Options.
 */

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Section content */
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 rounded hover:bg-neutral-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-neutral-900">{title}</span>
        <CaretDown
          className={`size-4 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          weight="bold"
        />
      </button>

      {isOpen && (
        <div className="mt-3 bg-neutral-50 rounded px-6 py-4 space-y-5">
          {children}
        </div>
      )}
    </section>
  );
}
