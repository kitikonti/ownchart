/**
 * FieldLabel - Reusable label for form fields in dialogs.
 * Renders <label> when `htmlFor` is provided, <span> otherwise.
 */

import { memo } from "react";
import type { ReactNode } from "react";

export interface FieldLabelProps {
  /** Label text or content */
  children: ReactNode;
  /**
   * Links to input via htmlFor — also switches to <label> element.
   *
   * @remarks When omitted, the component renders a <span> with no programmatic
   * association to any control. Callers must then ensure the associated control
   * is labelled by other means (`aria-label` or `aria-labelledby`).
   */
  htmlFor?: string;
}

export const FieldLabel = memo(function FieldLabel({
  children,
  htmlFor,
}: FieldLabelProps): JSX.Element {
  const className = "block text-sm font-medium text-slate-700 mb-2";

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor}>
        {children}
      </label>
    );
  }

  return <span className={className}>{children}</span>;
});
