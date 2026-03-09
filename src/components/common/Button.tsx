/**
 * Button - Standard button component with design system styling
 *
 * Based on Fluent UI design:
 * - Primary: Brand blue (bg-brand-600) background
 * - Secondary: White background with neutral border
 * - Ghost: Transparent background
 * - Danger: Red background for destructive actions
 */

import {
  forwardRef,
  memo,
  useEffect,
  Children,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /**
   * Icon to display before the label.
   * When used without `children` (icon-only button), an `aria-label` prop
   * must be supplied to ensure the button is accessible to screen readers.
   */
  icon?: ReactNode;
  /** Icon to display after the label */
  iconAfter?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white border border-transparent hover:bg-brand-500 active:bg-brand-800 disabled:bg-neutral-300 disabled:text-neutral-400",
  secondary:
    "bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-300 disabled:border-neutral-200",
  ghost:
    "bg-transparent text-neutral-700 border border-transparent hover:bg-neutral-100 hover:text-neutral-800 active:bg-neutral-200 disabled:text-neutral-300",
  danger:
    "bg-red-600 text-white border border-transparent hover:bg-red-700 active:bg-red-800 disabled:bg-neutral-300 disabled:text-neutral-400",
};

// Fluent button sizing: height ~31px, min-width 96px, padding 5px 12px
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 min-w-[72px] px-2.5 py-1 text-xs gap-1.5",
  md: "h-8 min-w-[96px] px-3 py-[5px] text-sm gap-2",
  lg: "h-10 min-w-[120px] px-4 py-2 text-base gap-2.5",
};

/**
 * Tracks icon-only buttons that have already triggered the missing-aria-label
 * warning in DEV mode. Keyed on the button's `id` prop when present, so only
 * identified buttons are deduplicated (one warning per unique id).
 * Anonymous buttons (no `id`) always emit a warning — deduplicating them by a
 * shared sentinel would silently suppress warnings for distinct buttons added
 * later in the session.
 *
 * Lives at module scope intentionally: persists for the entire browser session
 * so that repeated re-renders of the same identified button only warn once.
 * Always `null` in production to avoid any memory usage outside DEV.
 */
const warnedIconOnlyKeys = import.meta.env.DEV ? new Set<string>() : null;

/**
 * Clears the DEV-mode deduplication set so that unit tests that run within the
 * same module instance start with a clean slate.
 *
 * Call this in `beforeEach` when testing `warnIfIconOnlyWithoutLabel` to
 * prevent a button `id` warned in one test from suppressing warnings in a
 * later test that reuses the same `id`.
 *
 * No-op in production (the set is `null` outside DEV).
 */
export function resetWarnedIconOnlyKeys(): void {
  warnedIconOnlyKeys?.clear();
}

/**
 * Emits a DEV-only console warning when an icon-only button lacks an
 * `aria-label`. Deduplicates by `id` to avoid flooding the console on
 * re-renders of the same identified button.
 *
 * Extracted from the render body so it can be unit-tested in isolation.
 */
export function warnIfIconOnlyWithoutLabel(
  icon: ReactNode,
  children: ReactNode,
  props: { id?: string; "aria-label"?: string }
): void {
  if (!import.meta.env.DEV) return;
  if (!icon) return;
  // Treat both "no children passed" and "empty children" as icon-only.
  if (Children.count(children) !== 0 && children) return;
  if (props["aria-label"]) return;

  const warnKey = props.id;
  if (
    warnedIconOnlyKeys &&
    (warnKey === undefined || !warnedIconOnlyKeys.has(warnKey))
  ) {
    if (warnKey !== undefined) {
      warnedIconOnlyKeys.add(warnKey);
    }
    console.warn(
      "[Button] Icon-only button detected without an `aria-label`. " +
        "Screen readers will not be able to announce this button's purpose. " +
        "Add an `aria-label` prop describing the action."
    );
  }
}

// Fluent: font-weight 600, transition 0.1s cubic-bezier(0.33, 0, 0.67, 1)
const baseStyles =
  "inline-flex items-center justify-center font-semibold rounded transition-all duration-100 ease-[cubic-bezier(0.33,0,0.67,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed select-none";

/**
 * Standard button component following the OwnChart design system.
 *
 * @example
 * ```tsx
 * // Primary action
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 *
 * // Secondary action
 * <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 *
 * // With icon
 * <Button variant="primary" icon={<DownloadIcon size={16} />}>Export</Button>
 * ```
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      variant = "primary",
      size = "md",
      icon,
      iconAfter,
      fullWidth = false,
      // Destructured explicitly so it is consumed from props before the
      // {...props} spread, preventing it from appearing twice on the element.
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    // useEffect prevents this side-effecting call from running during React
    // StrictMode's double-invoke of the render body, which would otherwise
    // emit duplicate warnings for anonymous icon-only buttons in DEV mode.
    //
    // Dependency rationale: only the identity-relevant properties are listed.
    // `props` (the full rest-spread object) is intentionally excluded — it is
    // a new object reference on every render and would cause the warning check
    // to fire continuously. We only need to re-check when `icon`, `children`,
    // `aria-label`, or `id` change, as those are the only properties that
    // affect whether a warning should be emitted.
    useEffect(() => {
      warnIfIconOnlyWithoutLabel(icon, children, props);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `props` intentionally excluded; only identity-relevant properties (aria-label, id) are listed individually
    }, [icon, children, props["aria-label"], props.id]);

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={[
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
      </button>
    );
  })
);

Button.displayName = "Button";
