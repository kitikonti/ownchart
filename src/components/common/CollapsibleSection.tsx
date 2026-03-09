/**
 * Collapsible section with header button and expandable content.
 * Used in export dialogs for Layout Options and Display Options.
 */

import { memo, useId, useState, useCallback } from "react";
import type { JSX, ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Section content */
  children: ReactNode;
  /** Additional CSS classes for the outer <section> element */
  className?: string;
}

export const CollapsibleSection = memo(function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  // Use functional update to avoid stale-closure over `isOpen`
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    // aria-label directly on <section> avoids referencing an interactive
    // element's descendant (the title <span> lives inside the <button>),
    // which some screen readers would otherwise announce with toggle state noise.
    <section aria-label={title} className={className}>
      <button
        type="button"
        onClick={toggleOpen}
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
          aria-hidden="true"
        />
      </button>

      {/* Keep the panel in the DOM at all times so aria-controls always
          references a valid element. The Tailwind `hidden` class (display:none)
          is used instead of the HTML `hidden` attribute — the HTML attribute
          removes the element from the accessibility tree entirely, making the
          aria-controls reference invisible to assistive technologies. CSS
          display:none preserves DOM presence for aria-controls without needing
          aria-hidden (which would also hide the panel from assistive technologies
          when open, contradicting the aria-controls relationship). */}
      <div
        id={contentId}
        className={[
          "mt-3 bg-neutral-50 rounded px-6 py-4 space-y-5",
          isOpen ? "" : "hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </section>
  );
});
