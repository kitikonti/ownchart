/**
 * FieldLabel - Reusable label for form fields in dialogs.
 * Renders <label> when `htmlFor` is provided, <span> otherwise.
 */

import type { ReactNode } from "react";

export interface FieldLabelProps {
  /** Label text or content */
  children: ReactNode;
  /** Links to input via htmlFor — also switches to <label> element */
  htmlFor?: string;
}

export function FieldLabel({
  children,
  htmlFor,
}: FieldLabelProps): JSX.Element {
  const className = "block text-sm font-medium text-neutral-700 mb-2";

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor}>
        {children}
      </label>
    );
  }

  return <span className={className}>{children}</span>;
}
