/**
 * Welcome Tour component for first-time users.
 */

import { useState } from "react";
import { HandWaving, Cursor, ArrowsOutCardinal } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
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

  const handleGetStarted = () => {
    dismissWelcome(dontShowAgain);
    // Open chart settings dialog for new project configuration
    openChartSettingsAfterDelay(openChartSettingsDialog);
  };

  const handleShowShortcuts = () => {
    dismissWelcome(dontShowAgain);
    // Delay opening help panel to ensure welcome is closed first
    setTimeout(() => {
      openHelpPanel();
    }, 100);
    // Note: Don't open chart settings when showing shortcuts - user can access it later
  };

  const handleClose = () => {
    dismissWelcome(dontShowAgain);
    // Open chart settings dialog for new project configuration
    openChartSettingsAfterDelay(openChartSettingsDialog);
  };

  const footer = (
    <>
      <button
        onClick={handleShowShortcuts}
        className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-150 shadow-xs"
      >
        Show Shortcuts
      </button>
      <button
        onClick={handleGetStarted}
        className="px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded-lg hover:bg-neutral-600 active:bg-neutral-800 transition-colors"
      >
        Get Started
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isWelcomeTourOpen}
      onClose={handleClose}
      title="Welcome to OwnChart!"
      icon={<HandWaving size={24} weight="light" className="text-amber-500" />}
      footer={footer}
      widthClass="max-w-md"
    >
      <div className="space-y-5">
        {/* Description */}
        <p className="text-neutral-600 text-balance">
          Your privacy-first Gantt chart creator. All data stays on your device
          - no cloud, no tracking.
        </p>

        {/* Quick tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            Quick tips
          </h3>

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="p-2 bg-neutral-100 rounded-lg">
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

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="p-2 bg-emerald-100 rounded-lg">
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

          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="p-2 bg-violet-100 rounded-lg">
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
        <label className="flex items-center gap-2.5 pt-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className=""
          />
          <span className="text-sm text-neutral-500 group-hover:text-neutral-600 transition-colors">
            Don&apos;t show this again
          </span>
        </label>
      </div>
    </Modal>
  );
}
