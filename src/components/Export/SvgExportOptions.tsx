/**
 * SVG export options component.
 * Timeline scale options are shared with PNG export.
 */

import type { SvgExportOptions as SvgOptions } from "../../utils/export/types";

interface SvgExportOptionsProps {
  options: SvgOptions;
  onChange: (options: Partial<SvgOptions>) => void;
}

export function SvgExportOptions({
  options: _options,
  onChange: _onChange,
}: SvgExportOptionsProps): JSX.Element | null {
  // No SVG-specific options currently - timeline scale is handled by PngScaleOptions
  return null;
}
