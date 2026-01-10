/**
 * SVG export options component.
 * Timeline scale options are shared with PNG export via PngScaleOptions.
 * This component is a placeholder for future SVG-specific options.
 */

import type { SvgExportOptions as SvgOptions } from "../../utils/export/types";

export interface SvgExportOptionsProps {
  options: SvgOptions;
  onChange: (options: Partial<SvgOptions>) => void;
}

/**
 * SVG-specific export options.
 * Currently returns null as timeline scale is handled by PngScaleOptions.
 */
export function SvgExportOptions(_: SvgExportOptionsProps): JSX.Element | null {
  void _; // Acknowledge unused parameter for future use
  // No SVG-specific options currently - timeline scale is handled by PngScaleOptions
  return null;
}
