/**
 * Welcome Tour component for first-time users.
 */

import { useState, useEffect, useRef, memo, type ReactNode } from "react";

import {
  HandWaving,
  Cursor,
  ArrowsOutCardinal,
  Question,
} from "@phosphor-icons/react";

import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Checkbox } from "../common/Checkbox";
import { useUIStore } from "../../store/slices/uiSlice";

/** Delay (ms) before opening the help panel after the welcome modal closes. */
const HELP_PANEL_OPEN_DELAY_MS = 100;

interface TourTip {
  /** Icon element to render inside the tip card. */
  icon: ReactNode;
  /** Tailwind classes for the icon container background. */
  iconBg: string;
  /** Primary tip text. */
  label: string;
  /** Supporting description text. */
  description: string;
}

/**
 * Tour tip metadata. Centralised here so colours and copy are co-located
 * and not scattered across JSX.
 */
const TOUR_TIPS: TourTip[] = [
  {
    icon: <Cursor size={18} className="text-neutral-600" />,
    iconBg: "bg-neutral-100",
    label: "Click the empty row to add tasks",
    description: "Start building your project timeline",
  },
  {
    icon: <ArrowsOutCardinal size={18} className="text-brand-600" />,
    iconBg: "bg-brand-100",
    label: "Drag task bars to change dates",
    description: "Resize edges to adjust duration",
  },
  {
    icon: <Question size={18} className="text-brand-600" />,
    iconBg: "bg-brand-50",
    label: "Press ? anytime for shortcuts",
    description: "Keyboard shortcuts for power users",
  },
];

/**
 * Welcome Tour component.
 */
export const WelcomeTour = memo(function WelcomeTour(): JSX.Element | null {
  const { isWelcomeTourOpen, dismissWelcome, openHelpPanel } = useUIStore();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  // Track pending timer so it can be cancelled on unmount, preventing a
  // stale openHelpPanel() call if the component unmounts before the timer fires.
  const helpPanelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (helpPanelTimerRef.current !== null) {
        clearTimeout(helpPanelTimerRef.current);
      }
    };
  }, []);

  const dismiss = (): void => {
    dismissWelcome(dontShowAgain);
  };

  const handleShowShortcuts = (): void => {
    dismiss();
    // Delay opening help panel to let the modal finish closing before the
    // help panel mounts. The animation duration is ~100 ms (Modal fade-out).
    if (helpPanelTimerRef.current !== null) {
      clearTimeout(helpPanelTimerRef.current);
    }
    helpPanelTimerRef.current = setTimeout(() => {
      helpPanelTimerRef.current = null;
      openHelpPanel();
    }, HELP_PANEL_OPEN_DELAY_MS);
  };

  const footer = (
    <div className="flex items-center justify-end w-full gap-3">
      <Button variant="secondary" onClick={handleShowShortcuts}>
        Show Shortcuts
      </Button>
      <Button variant="primary" onClick={dismiss}>
        Get Started
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isWelcomeTourOpen}
      onClose={dismiss}
      title="Welcome to OwnChart!"
      icon={<HandWaving size={24} weight="light" className="text-amber-500" />}
      footer={footer}
      widthClass="max-w-md"
      headerStyle="bordered"
      footerStyle="bordered"
    >
      <div className="space-y-5">
        {/* Description */}
        <p className="text-neutral-600 text-balance">
          Your privacy-first Gantt chart creator. All data stays on your device
          - no cloud, no tracking.
        </p>

        {/* Quick tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">Quick tips</h3>

          {TOUR_TIPS.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-neutral-50 rounded border border-neutral-200"
            >
              <div className={`p-2 ${tip.iconBg} rounded`} aria-hidden="true">
                {tip.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {tip.label}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-3 pt-2 cursor-pointer group">
          <Checkbox checked={dontShowAgain} onChange={setDontShowAgain} />
          <span className="text-sm text-neutral-500 group-hover:text-neutral-600 transition-colors">
            Don&apos;t show this again
          </span>
        </label>
      </div>
    </Modal>
  );
});
