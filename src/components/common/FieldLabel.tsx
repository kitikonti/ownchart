/**
 * Reusable field label component for form sections.
 * Provides consistent styling across export dialogs and settings forms.
 */

interface FieldLabelProps {
  /** The label text to display */
  children: React.ReactNode;
  /** Optional htmlFor to link to an input (renders as label element) */
  htmlFor?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A styled label/span for form field sections.
 * Renders as <label> when htmlFor is provided, otherwise <span>.
 */
export function FieldLabel({
  children,
  htmlFor,
  className = "",
}: FieldLabelProps): JSX.Element {
  const baseClasses = "text-xs font-medium text-slate-500 mb-2.5 block";
  const combinedClasses = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={combinedClasses}>
        {children}
      </label>
    );
  }

  return <span className={combinedClasses}>{children}</span>;
}
