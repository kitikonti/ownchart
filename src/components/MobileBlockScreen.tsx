/**
 * MobileBlockScreen - Fullscreen overlay shown on mobile devices.
 *
 * Displays a friendly message asking users to switch to a desktop browser,
 * with a "Continue anyway" escape hatch for power users.
 */

import {
  memo,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Desktop } from "@phosphor-icons/react";
import OwnChartLogo from "../assets/logo.svg?react";
import { APP_CONFIG } from "../config/appConfig";

interface MobileBlockScreenProps {
  onDismiss: () => void;
}

export const MobileBlockScreen = memo(function MobileBlockScreen({
  onDismiss,
}: MobileBlockScreenProps): JSX.Element {
  // Strip protocol from URL for display (e.g. "ownchart.app" instead of "https://ownchart.app")
  const displayUrl = APP_CONFIG.appUrl.replace(/^https?:\/\//, "");
  // useId produces a stable, unique ID — avoids collisions if multiple instances
  // are ever rendered simultaneously (e.g. in tests).
  const headingId = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);

  // Move focus into the overlay when it mounts so keyboard/AT users
  // do not interact with hidden content behind the blocking screen.
  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  // Handles keyboard interactions on the single interactive element:
  //  - Tab / Shift+Tab: prevent default to keep focus trapped on this button
  //    (there is only one focusable element, so both directions must stay here).
  //  - Escape: WCAG 2.1 §3.2.5 / ARIA dialog pattern — dismiss the dialog.
  // Note: both Tab and Shift+Tab share e.key === "Tab" (Shift is only in e.shiftKey),
  // so a single "Tab" check correctly traps both directions.
  function handleButtonKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>): void {
    if (e.key === "Tab") {
      e.preventDefault();
    } else if (e.key === "Escape") {
      onDismiss();
    }
  }

  return (
    // role="dialog" + aria-modal="true" tells AT this is a blocking overlay.
    // z-[2000]: above all other overlays including the export dialog (modal = 1100).
    //
    // Note on AT compatibility: aria-modal="true" prevents most screen readers
    // from navigating behind the dialog via virtual cursor, but older NVDA +
    // Firefox and some JAWS configurations may still allow virtual-cursor escape.
    // Unlike a modal overlay rendered on top of live content, this component is
    // rendered via an early-return in AppInner — AppContent is never mounted
    // while this screen is visible, so there is no background DOM to `inert`.
    // This architecture already provides the strongest possible isolation:
    // background content simply does not exist in the DOM.
    // The single-button focus trap (Tab key handler below) covers keyboard users.
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center px-8 text-center"
    >
      <OwnChartLogo
        width={48}
        height={48}
        className="text-brand-600"
        aria-hidden="true"
      />

      {/* App name as non-heading branding element — aria-hidden because the
          dialog's accessible name already comes from the <h1> via aria-labelledby,
          and announcing the app name twice before the heading would be redundant for AT. */}
      <p
        aria-hidden="true"
        className="mt-4 text-xl font-semibold text-neutral-900"
      >
        {APP_CONFIG.name}
      </p>

      <Desktop
        size={48}
        weight="light"
        className="mt-8 text-neutral-400"
        aria-hidden="true"
      />

      {/* h1: this overlay IS the entire visible page when rendered — heading hierarchy starts here */}
      <h1 id={headingId} className="mt-4 text-lg font-medium text-neutral-800">
        Desktop browser required
      </h1>

      <p className="mt-2 text-sm text-neutral-500 max-w-xs leading-relaxed">
        {APP_CONFIG.name} is a full-featured Gantt chart editor designed for
        desktop browsers.
      </p>

      <p className="mt-4 text-sm text-neutral-500">
        Please open{" "}
        <span className="font-medium text-neutral-700">{displayUrl}</span> on a
        desktop or laptop.
      </p>

      <button
        ref={dismissRef}
        type="button"
        onClick={onDismiss}
        onKeyDown={handleButtonKeyDown}
        className="mt-10 text-xs text-neutral-500 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 focus-visible:rounded transition-colors"
      >
        Continue anyway
      </button>
    </div>
  );
});
