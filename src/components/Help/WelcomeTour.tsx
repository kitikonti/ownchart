/**
 * Welcome Tour component for first-time users.
 */

import { useState } from "react";
import { HandWaving, Cursor, ArrowsOutCardinal } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Checkbox } from "../common/Checkbox";
import { useUIStore } from "../../store/slices/uiSlice";

/**
 * Opens chart settings dialog after a short delay to ensure welcome modal is closed first.
 */
function openChartSettingsAfterDelay(openFn: () => void): void {
  setTimeout(() => {
    openFn();
  }, 100);
}

/**
 * Welcome Tour component.
 */
export function WelcomeTour(): JSX.Element | null {
  const {
    isWelcomeTourOpen,
    dismissWelcome,
    openHelpPanel,
    openChartSettingsDialog,
  } = useUIStore();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleGetStarted = (): void => {
    dismissWelcome(dontShowAgain);
    // Open chart settings dialog for new project configuration
    openChartSettingsAfterDelay(openChartSettingsDialog);
  };

  const handleShowShortcuts = (): void => {
    dismissWelcome(dontShowAgain);
    // Delay opening help panel to ensure welcome is closed first
    setTimeout(() => {
      openHelpPanel();
    }, 100);
    // Note: Don't open chart settings when showing shortcuts - user can access it later
  };

  const handleClose = (): void => {
    dismissWelcome(dontShowAgain);
    // Open chart settings dialog for new project configuration
    openChartSettingsAfterDelay(openChartSettingsDialog);
  };

  const footer = (
    <div className="flex items-center w-full gap-3">
      <div className="flex-1" />
      <Button variant="secondary" onClick={handleShowShortcuts}>
        Show Shortcuts
      </Button>
      <Button variant="primary" onClick={handleGetStarted}>
        Get Started
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isWelcomeTourOpen}
      onClose={handleClose}
      title="Welcome to OwnChart!"
      icon={<HandWaving size={24} weight="light" className="text-amber-500" />}
      footer={footer}
      widthClass="max-w-md"
      headerStyle="figma"
      footerStyle="figma"
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

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded border border-neutral-200">
            <div className="p-2 bg-neutral-100 rounded">
              <Cursor size={18} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Click the empty row to add tasks
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Start building your project timeline
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded border border-neutral-200">
            <div className="p-2 bg-emerald-100 rounded">
              <ArrowsOutCardinal size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Drag task bars to change dates
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Resize edges to adjust duration
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded border border-neutral-200">
            <div className="p-2 bg-violet-100 rounded">
              <span className="text-base font-bold text-violet-600 block w-[18px] text-center">
                ?
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Press ? anytime for shortcuts
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Keyboard shortcuts for power users
              </p>
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-3 pt-2 cursor-pointer group">
          <Checkbox
            checked={dontShowAgain}
            onChange={setDontShowAgain}
            aria-label="Don't show this again"
          />
          <span className="text-sm text-neutral-500 group-hover:text-neutral-600 transition-colors">
            Don&apos;t show this again
          </span>
        </label>
      </div>
    </Modal>
  );
}
