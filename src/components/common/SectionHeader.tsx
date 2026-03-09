/**
 * SectionHeader - Reusable section header component for dialogs.
 *
 * Variants:
 * - default: Icon + title inline
 * - simple: Title only with bottom margin
 * - bordered: Title with bottom border (for lists)
 */

import type { JSX, ReactNode } from "react";

export type SectionHeaderVariant = "default" | "simple" | "bordered";

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional icon (for default variant) */
  icon?: ReactNode;
  /** Style variant */
  variant?: SectionHeaderVariant;
  /**
   * HTML element to use — choose based on the heading hierarchy of the surrounding context.
   * - `"h2"` / `"h3"`: most common choices for nested section headers within a dialog or panel.
   * - `"h1"`: use only for top-level page headings where no parent heading exists.
   * - `"span"`: use only when the heading must remain inline and the surrounding context
   *   already provides a proper sectioning landmark (e.g. the parent renders an `<h2>` or a
   *   `<section aria-labelledby="...">` that establishes the region). Avoid `"span"` for
   *   standalone section headers as it breaks heading-based document navigation for screen readers.
   * @default "h3"
   */
  as?: "h1" | "h2" | "h3" | "span";
  /** Optional id so a parent <section> can reference this heading via aria-labelledby */
  id?: string;
  /**
   * Additional CSS classes applied to the outermost element.
   * For the `default` variant this is the wrapping `<div>`; for `simple` and
   * `bordered` variants it is the heading element itself.
   */
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  variant = "default",
  as: Element = "h3",
  id,
  className,
}: SectionHeaderProps): JSX.Element {
  if (variant === "simple") {
    return (
      <Element
        id={id}
        className={[
          "block text-sm font-semibold text-neutral-900 mb-3",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </Element>
    );
  }

  if (variant === "bordered") {
    return (
      <Element
        id={id}
        className={[
          "text-sm font-semibold text-neutral-900 mb-2.5 pb-1.5 border-b border-neutral-200",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </Element>
    );
  }

  // default variant with icon
  return (
    <div
      className={["flex items-center gap-2 mb-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <span className="text-neutral-500 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <Element id={id} className="text-sm font-semibold text-neutral-900">
        {title}
      </Element>
    </div>
  );
}
