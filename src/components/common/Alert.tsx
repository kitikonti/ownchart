/**
 * Alert - Reusable alert/info box component with multiple variants.
 *
 * Variants:
 * - info: Blue background, for tips and helpful information
 * - warning: Amber background, for warnings and cautions
 * - error: Red background, for error messages
 * - neutral: Gray background, for informational messages
 */

import type { ReactNode } from "react";
import { Info, Warning, WarningCircle, Lightbulb } from "@phosphor-icons/react";

export type AlertVariant = "info" | "warning" | "error" | "neutral";

export interface AlertProps {
  /** The variant determines colors and default icon */
  variant: AlertVariant;
  /** Content to display inside the alert */
  children: ReactNode;
  /** Optional custom icon to override the default */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    icon: string;
    text: string;
  }
> = {
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    text: "text-blue-900",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    text: "text-amber-700",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    text: "text-red-700",
  },
  neutral: {
    container: "bg-neutral-100 border-neutral-200",
    icon: "text-neutral-500",
    text: "text-neutral-600",
  },
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: <Lightbulb size={16} weight="fill" />,
  warning: <Warning size={16} weight="fill" />,
  error: <WarningCircle size={16} weight="fill" />,
  neutral: <Info size={16} weight="fill" />,
};

export function Alert({
  variant,
  children,
  icon,
  className = "",
}: AlertProps): JSX.Element {
  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded border ${styles.container} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
        {displayIcon}
      </span>
      <div className={`text-xs ${styles.text}`}>{children}</div>
    </div>
  );
}
