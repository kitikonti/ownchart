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
}: SvgExportOptionsProps): JSX.Element {
  return (
    <div>
      {/* SVG hint */}
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          SVG files can be edited in Illustrator, Figma, Inkscape, etc.
        </p>
      </div>
    </div>
  );
}
