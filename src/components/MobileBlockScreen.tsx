/**
 * MobileBlockScreen - Fullscreen overlay shown on mobile devices.
 *
 * Displays a friendly message asking users to switch to a desktop browser,
 * with a "Continue anyway" escape hatch for power users.
 */

import { Desktop } from "@phosphor-icons/react";
import OwnChartLogo from "../assets/logo.svg?react";
import { APP_CONFIG } from "../config/appConfig";

interface MobileBlockScreenProps {
  onDismiss: () => void;
}

export function MobileBlockScreen({
  onDismiss,
}: MobileBlockScreenProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center px-8 text-center">
      <OwnChartLogo
        width={48}
        height={48}
        className="text-brand-600"
        aria-hidden="true"
      />

      <h1 className="mt-4 text-xl font-semibold text-neutral-900">
        {APP_CONFIG.name}
      </h1>

      <Desktop
        size={48}
        weight="light"
        className="mt-8 text-neutral-400"
        aria-hidden="true"
      />

      <h2 className="mt-4 text-lg font-medium text-neutral-800">
        Desktop browser required
      </h2>

      <p className="mt-2 text-sm text-neutral-500 max-w-xs leading-relaxed">
        {APP_CONFIG.name} is a full-featured Gantt chart editor designed for
        desktop browsers.
      </p>

      <p className="mt-4 text-sm text-neutral-500">
        Please open{" "}
        <span className="font-medium text-neutral-700">ownchart.app</span> on a
        desktop or laptop.
      </p>

      <button
        onClick={onDismiss}
        className="mt-10 text-xs text-neutral-500 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:rounded transition-colors"
      >
        Continue anyway
      </button>
    </div>
  );
}
