/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and header/footer.
 */

import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfHeaderFooter,
  ExportOptions,
  ExportZoomMode,
} from "../../utils/export/types";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  DEFAULT_PDF_OPTIONS,
} from "../../utils/export/types";
import { CheckboxGroup } from "../common/CheckboxGroup";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { SectionHeader } from "../common/SectionHeader";
import { SegmentedControl } from "../common/SegmentedControl";
import type { SegmentedControlOption } from "../common/SegmentedControl";
import { ZoomModeSelector } from "./ZoomModeSelector";

// =============================================================================
// Constants
// =============================================================================

/** Minimum custom page dimension in mm */
const MIN_CUSTOM_PAGE_MM = 100;
/** Maximum custom page dimension in mm */
const MAX_CUSTOM_PAGE_MM = 5000;

/** Fallback for custom page size when not yet configured */
const DEFAULT_CUSTOM_SIZE = DEFAULT_PDF_OPTIONS.customPageSize ?? {
  width: 500,
  height: 300,
};

const PAGE_SIZE_LABELS: Record<PdfPageSize, { label: string; size: string }> = {
  a4: { label: "A4", size: "297 × 210 mm" },
  a3: { label: "A3", size: "420 × 297 mm" },
  a2: { label: "A2", size: "594 × 420 mm" },
  a1: { label: "A1", size: "841 × 594 mm" },
  a0: { label: "A0", size: "1189 × 841 mm" },
  letter: { label: "Letter", size: "11 × 8.5 in" },
  legal: { label: "Legal", size: "14 × 8.5 in" },
  tabloid: { label: "Tabloid", size: "17 × 11 in" },
  custom: { label: "Custom", size: "" },
};

const ORIENTATION_OPTIONS: SegmentedControlOption[] = [
  {
    value: "landscape",
    label: "Landscape",
    icon: <span className="w-4 h-2.5 border-2 border-current rounded-sm" />,
  },
  {
    value: "portrait",
    label: "Portrait",
    icon: <span className="w-2.5 h-4 border-2 border-current rounded-sm" />,
  },
];

const MARGIN_OPTIONS: SegmentedControlOption[] = [
  { value: "normal", label: "Normal" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" },
  { value: "none", label: "None" },
];

/** Header/Footer checkbox options */
const HEADER_FOOTER_OPTIONS = [
  { key: "showProjectName", label: "Project title" },
  { key: "showAuthor", label: "Author" },
  { key: "showExportDate", label: "Export date" },
] as const;

// =============================================================================
// Type Guards
// =============================================================================

/** Validates that a string is a valid PdfPageSize */
const isPageSize = (value: string): value is PdfPageSize =>
  value in PAGE_SIZE_LABELS;

// =============================================================================
// Sub-Components
// =============================================================================

interface HeaderFooterColumnProps {
  title: string;
  values: PdfHeaderFooter;
  onValuesChange: (values: PdfHeaderFooter) => void;
}

/** Renders a header or footer checkbox column using CheckboxGroup */
function HeaderFooterColumn({
  title,
  values,
  onValuesChange,
}: HeaderFooterColumnProps): JSX.Element {
  const items = HEADER_FOOTER_OPTIONS.map((opt) => ({
    key: opt.key,
    label: opt.label,
    checked: values[opt.key],
  }));

  const handleChange = (key: string, checked: boolean): void => {
    if (!HEADER_FOOTER_OPTIONS.some((opt) => opt.key === key)) return;
    onValuesChange({ ...values, [key]: checked } as PdfHeaderFooter);
  };

  return (
    <div>
      <span className="block text-sm font-medium text-neutral-700 mb-3">
        {title}
      </span>
      <CheckboxGroup items={items} onChange={handleChange} />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export interface PdfExportOptionsProps {
  options: PdfOptions;
  onChange: (options: Partial<PdfOptions>) => void;
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  projectAuthor: string;
  onProjectAuthorChange: (author: string) => void;
}

export function PdfExportOptions({
  options,
  onChange,
  exportOptions,
  onExportOptionsChange,
  currentAppZoom,
  projectAuthor,
  onProjectAuthorChange,
}: PdfExportOptionsProps): JSX.Element {
  const pageDims =
    options.pageSize === "custom"
      ? options.customPageSize || DEFAULT_CUSTOM_SIZE
      : PDF_PAGE_SIZES[options.pageSize];
  const displayWidth =
    options.orientation === "landscape" ? pageDims.width : pageDims.height;
  const displayHeight =
    options.orientation === "landscape" ? pageDims.height : pageDims.width;

  return (
    <div className="space-y-8">
      {/* ============ TIMELINE SCALE ============ */}
      <ZoomModeSelector
        zoomMode={exportOptions.zoomMode}
        onZoomModeChange={(mode: ExportZoomMode) =>
          onExportOptionsChange({ zoomMode: mode })
        }
        timelineZoom={exportOptions.timelineZoom}
        onTimelineZoomChange={(zoom: number) =>
          onExportOptionsChange({ timelineZoom: zoom })
        }
        currentAppZoom={currentAppZoom}
        format="pdf"
      />

      <div className="divider-h" />

      {/* ============ PAGE SETUP ============ */}
      <section>
        <SectionHeader title="Page Setup" variant="simple" />

        <div className="space-y-5">
          {/* Page Size */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Page Size
            </span>
            <Select
              value={options.pageSize}
              onChange={(e) => {
                if (isPageSize(e.target.value)) {
                  onChange({ pageSize: e.target.value });
                }
              }}
            >
              {Object.entries(PAGE_SIZE_LABELS).map(
                ([key, { label, size }]) => (
                  <option key={key} value={key}>
                    {size ? `${label} (${size})` : label}
                  </option>
                )
              )}
            </Select>
            {options.pageSize !== "custom" && (
              <p className="text-xs text-neutral-500 mt-2">
                {displayWidth} × {displayHeight} mm
              </p>
            )}
          </div>

          {/* Orientation */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Orientation
            </span>
            <SegmentedControl
              options={ORIENTATION_OPTIONS}
              value={options.orientation}
              onChange={(value) =>
                onChange({ orientation: value as "landscape" | "portrait" })
              }
              ariaLabel="Page orientation"
            />
          </div>
        </div>

        {/* Custom page size */}
        {options.pageSize === "custom" && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="pdf-custom-width"
              >
                Width (mm)
              </label>
              <Input
                id="pdf-custom-width"
                type="number"
                value={
                  options.customPageSize?.width || DEFAULT_CUSTOM_SIZE.width
                }
                onChange={(e) =>
                  onChange({
                    customPageSize: {
                      width: Math.max(
                        MIN_CUSTOM_PAGE_MM,
                        parseInt(e.target.value) || DEFAULT_CUSTOM_SIZE.width
                      ),
                      height:
                        options.customPageSize?.height ||
                        DEFAULT_CUSTOM_SIZE.height,
                    },
                  })
                }
                min={MIN_CUSTOM_PAGE_MM}
                max={MAX_CUSTOM_PAGE_MM}
                mono
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="pdf-custom-height"
              >
                Height (mm)
              </label>
              <Input
                id="pdf-custom-height"
                type="number"
                value={
                  options.customPageSize?.height || DEFAULT_CUSTOM_SIZE.height
                }
                onChange={(e) =>
                  onChange({
                    customPageSize: {
                      width:
                        options.customPageSize?.width ||
                        DEFAULT_CUSTOM_SIZE.width,
                      height: Math.max(
                        MIN_CUSTOM_PAGE_MM,
                        parseInt(e.target.value) || DEFAULT_CUSTOM_SIZE.height
                      ),
                    },
                  })
                }
                min={MIN_CUSTOM_PAGE_MM}
                max={MAX_CUSTOM_PAGE_MM}
                mono
              />
            </div>
          </div>
        )}

        {/* Margins */}
        <div className="mt-6">
          <span className="block text-sm font-medium text-neutral-700 mb-2">
            Margins
          </span>
          <SegmentedControl
            options={MARGIN_OPTIONS}
            value={options.marginPreset}
            onChange={(value) =>
              onChange({ marginPreset: value as PdfOptions["marginPreset"] })
            }
            layout="grid"
            ariaLabel="Margin preset"
          />
          {options.marginPreset !== "none" && (
            <p className="text-xs text-neutral-500 mt-2">
              {PDF_MARGIN_PRESETS[options.marginPreset].top}mm top/bottom,{" "}
              {PDF_MARGIN_PRESETS[options.marginPreset].left}mm left/right
            </p>
          )}
        </div>
      </section>

      <div className="divider-h" />

      {/* ============ HEADER / FOOTER ============ */}
      <section>
        <SectionHeader title="Header / Footer" variant="simple" />

        <div className="grid grid-cols-2 gap-6">
          <HeaderFooterColumn
            title="Header"
            values={options.header}
            onValuesChange={(header) => onChange({ header })}
          />
          <HeaderFooterColumn
            title="Footer"
            values={options.footer}
            onValuesChange={(footer) => onChange({ footer })}
          />
        </div>

        {/* Author input - shown when any "Author" checkbox is enabled */}
        {(options.header.showAuthor || options.footer.showAuthor) && (
          <div className="mt-4">
            <label
              htmlFor="pdf-author"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Author
            </label>
            <Input
              id="pdf-author"
              type="text"
              value={projectAuthor}
              onChange={(e) => onProjectAuthorChange(e.target.value)}
              placeholder="Your name"
            />
          </div>
        )}
      </section>
    </div>
  );
}
