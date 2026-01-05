/**
 * Welcome Tour component for first-time users.
 */

import { useState } from "react";
import { HandWaving, Cursor, ArrowsOutCardinal } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";

/**
 * Welcome Tour component.
 */
export function WelcomeTour(): JSX.Element | null {
  const { isWelcomeTourOpen, dismissWelcome, openHelpPanel } = useUIStore();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleGetStarted = () => {
    dismissWelcome(dontShowAgain);
  };

  const handleShowShortcuts = () => {
    dismissWelcome(dontShowAgain);
    // Delay opening help panel to ensure welcome is closed first
    setTimeout(() => {
      openHelpPanel();
    }, 100);
  };

  const handleClose = () => {
    dismissWelcome(dontShowAgain);
  };

  const footer = (
    <>
      <button
        onClick={handleShowShortcuts}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Show Shortcuts
      </button>
      <button
        onClick={handleGetStarted}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
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
      icon={<HandWaving size={24} weight="fill" className="text-yellow-500" />}
      footer={footer}
      widthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Description */}
        <p className="text-gray-600">
          Your privacy-first Gantt chart creator. All data stays on your device
          - no cloud, no tracking.
        </p>

        {/* Quick tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Quick tips:</h3>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cursor size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click the empty row to add tasks
              </p>
              <p className="text-xs text-gray-500">
                Start building your project timeline
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowsOutCardinal size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drag task bars to change dates
              </p>
              <p className="text-xs text-gray-500">
                Resize edges to adjust duration
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <span className="text-lg font-bold text-purple-600">?</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Press ? anytime for shortcuts
              </p>
              <p className="text-xs text-gray-500">
                Keyboard shortcuts for power users
              </p>
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2 pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-500">
            Don&apos;t show this again
          </span>
        </label>
      </div>
    </Modal>
  );
}
