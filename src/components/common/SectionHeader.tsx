/**
 * SectionHeader - Reusable section header component for dialogs.
 *
 * Variants:
 * - default: Icon + title inline
 * - simple: Title only with bottom margin
 * - bordered: Title with bottom border (for lists)
 */

import type { ReactNode } from "react";

export type SectionHeaderVariant = "default" | "simple" | "bordered";

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional icon (for default variant) */
  icon?: ReactNode;
  /** Style variant */
  variant?: SectionHeaderVariant;
  /** HTML element to use (h3 or span) */
  as?: "h3" | "span";
}

export function SectionHeader({
  title,
  icon,
  variant = "default",
  as: Element = "h3",
}: SectionHeaderProps): JSX.Element {
  if (variant === "simple") {
    return (
      <Element className="block text-sm font-semibold text-neutral-900 mb-3">
        {title}
      </Element>
    );
  }

  if (variant === "bordered") {
    return (
      <Element className="text-sm font-semibold text-neutral-900 mb-2.5 pb-1.5 border-b border-neutral-200">
        {title}
      </Element>
    );
  }

  // default variant with icon
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-neutral-500 flex-shrink-0">{icon}</span>}
      <Element className="text-sm font-semibold text-neutral-900">
        {title}
      </Element>
    </div>
  );
}
