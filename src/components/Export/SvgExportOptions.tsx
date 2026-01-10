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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SvgExportOptions(_props: SvgExportOptionsProps): JSX.Element | null {
  // No SVG-specific options currently - timeline scale is handled by PngScaleOptions
  return null;
}
