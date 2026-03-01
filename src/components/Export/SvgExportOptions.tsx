/**
 * SVG export options component.
 * Timeline scale options are shared with PNG export via ScaleOptions.
 * This component is a placeholder for future SVG-specific options.
 */

import type { SvgExportOptions as SvgOptions } from "../../utils/export/types";

export interface SvgExportOptionsProps {
  options: SvgOptions;
  onChange: (options: Partial<SvgOptions>) => void;
}

/**
 * SVG-specific export options.
 * Currently returns null as timeline scale is handled by ScaleOptions.
 * TODO: add SVG-specific options (e.g. responsiveMode, includeAccessibility) when needed.
 */
export function SvgExportOptions(_: SvgExportOptionsProps): JSX.Element | null {
  void _; // props reserved for future SVG-specific options
  // No SVG-specific options currently - timeline scale is handled by ScaleOptions
  return null;
}
