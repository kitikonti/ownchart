/**
 * Collapsible section with header button and expandable content.
 * Used in export dialogs for Layout Options and Display Options.
 */

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Section content */
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
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

      {/* Keep the panel in the DOM at all times so aria-controls always
          references a valid element; visibility is toggled via `hidden`. */}
      <div
        id={contentId}
        hidden={!isOpen}
        className="mt-3 bg-neutral-50 rounded px-6 py-4 space-y-5"
      >
        {children}
      </div>
    </section>
  );
}
