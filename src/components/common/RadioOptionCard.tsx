/**
 * Reusable radio option card with consistent styling.
 * Used throughout export dialogs for selecting options.
 */

import { Radio } from "./Radio";

export interface RadioOptionCardProps {
  /** Radio group name */
  name: string;
  /** Whether this option is selected */
  selected: boolean;
  /** Called when this option is selected */
  onChange: () => void;
  /** Main label text */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional badge (e.g., "100%" for current zoom) */
  badge?: string;
  /** Expandable content shown when selected */
  children?: React.ReactNode;
  /** Align radio to top (for cards with children) */
  alignTop?: boolean;
  /** Optional aria-label override */
  ariaLabel?: string;
}

export function RadioOptionCard({
  name,
  selected,
  onChange,
  title,
  description,
  badge,
  children,
  alignTop = false,
  ariaLabel,
}: RadioOptionCardProps): JSX.Element {
  const hasChildren = !!children;
  const showAlignTop = alignTop || hasChildren;

  return (
    <label
      className={`flex ${showAlignTop ? "items-start" : "items-center"} gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
        selected
          ? "border-neutral-300 border-l-[3px] border-l-brand-600"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div className={showAlignTop ? "mt-0.5" : ""}>
        <Radio
          checked={selected}
          onChange={onChange}
          name={name}
          aria-label={ariaLabel || title}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">{title}</span>
          {badge && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
        {selected && children && <div className="mt-4">{children}</div>}
      </div>
    </label>
  );
}
