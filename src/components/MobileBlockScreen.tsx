/**
 * MobileBlockScreen - Fullscreen overlay shown on mobile devices.
 *
 * Displays a friendly message asking users to switch to a desktop browser,
 * with a "Continue anyway" escape hatch for power users.
 */

import {
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Desktop } from "@phosphor-icons/react";
import OwnChartLogo from "../assets/logo.svg?react";
import { APP_CONFIG } from "../config/appConfig";

// Strip protocol from URL for display (e.g. "ownchart.app" instead of "https://ownchart.app").
// Computed once at module scope — APP_CONFIG is a static constant and this never changes.
// Fallback for the degenerate case of a URL with no host (e.g. "https://") where the
// replace would produce an empty string — preserves the original in that edge case.
const DISPLAY_URL =
  APP_CONFIG.appUrl.replace(/^https?:\/\//, "") || APP_CONFIG.appUrl;

interface MobileBlockScreenProps {
  onDismiss: () => void;
}

export const MobileBlockScreen = memo(function MobileBlockScreen({
  onDismiss,
}: MobileBlockScreenProps): JSX.Element {
  // useId produces a stable, unique ID — avoids collisions if multiple instances
  // are ever rendered simultaneously (e.g. in tests).
  const headingId = useId();
  const descriptionId = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);
  // Capture the previously focused element at mount time so focus can be
  // restored when the overlay is dismissed (WCAG 2.1 §2.4.3 / ARIA dialog pattern).
  const previousFocusRef = useRef<Element | null>(null);

  // Move focus into the overlay synchronously before the browser paints, so
  // keyboard/AT users cannot interact with any content that was visible in the
  // frame before this screen appeared. useLayoutEffect runs after DOM mutations
  // but before paint, eliminating the brief unfocused window that useEffect
  // would leave (useEffect fires after paint on the initial render).
  // On cleanup (unmount), restore focus to the element that had focus when the
  // overlay appeared — without this, keyboard/AT users lose their position.
  useLayoutEffect(() => {
    previousFocusRef.current = document.activeElement;
    dismissRef.current?.focus();
    return () => {
      if (
        previousFocusRef.current instanceof HTMLElement ||
        previousFocusRef.current instanceof SVGElement
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Handles keyboard interactions on the single interactive element:
  //  - Tab / Shift+Tab: prevent default to keep focus trapped on this button
  //    (there is only one focusable element, so both directions must stay here).
  //  - Escape: WCAG 2.1 §3.2.5 / ARIA dialog pattern — dismiss the dialog.
  // Note: both Tab and Shift+Tab share e.key === "Tab" (Shift is only in e.shiftKey),
  // so a single "Tab" check correctly traps both directions.
  //
  // NOTE: This trap assumes a SINGLE focusable element. If additional buttons or
  // links are ever added to this overlay, replace this handler with a proper
  // focus-trap loop that cycles between the first and last focusable elements.
  const handleButtonKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === "Tab") {
        e.preventDefault();
      } else if (e.key === "Escape") {
        onDismiss();
      }
    },
    [onDismiss]
  );

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
      aria-describedby={descriptionId}
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

      <p
        id={descriptionId}
        className="mt-2 text-sm text-neutral-500 max-w-xs leading-relaxed"
      >
        {APP_CONFIG.name} is a full-featured Gantt chart editor designed for
        desktop browsers.
      </p>

      <p className="mt-4 text-sm text-neutral-500">
        Please open{" "}
        <span className="font-medium text-neutral-700">{DISPLAY_URL}</span> on a
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
