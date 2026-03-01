/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and header/footer.
 */

import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfOrientation,
  PdfMarginPreset,
  PdfHeaderFooter,
  PdfCustomPageSize,
  ExportOptions,
  ExportZoomMode,
} from "../../utils/export/types";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  DEFAULT_PDF_OPTIONS,
} from "../../utils/export/types";
import { CheckboxGroup } from "../common/CheckboxGroup";
import { FieldLabel } from "../common/FieldLabel";
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

/**
 * Fallback for custom page size when not yet configured.
 * `DEFAULT_PDF_OPTIONS.customPageSize` is always defined, but the type allows
 * undefined (optional field) — the ?? keeps this resilient to future changes.
 */
const DEFAULT_CUSTOM_SIZE: PdfCustomPageSize =
  DEFAULT_PDF_OPTIONS.customPageSize ?? {
    width: 500,
    height: 300,
  };

/**
 * Human-readable names for each page size.
 * Dimensions are derived from PDF_PAGE_SIZES (single source of truth, all in mm)
 * so dropdown labels stay in sync automatically if sizes change.
 */
const PAGE_SIZE_NAMES: Record<PdfPageSize, string> = {
  a4: "A4",
  a3: "A3",
  a2: "A2",
  a1: "A1",
  a0: "A0",
  letter: "Letter",
  legal: "Legal",
  tabloid: "Tabloid",
  custom: "Custom",
};

/**
 * Format a page size option label including landscape dimensions in mm.
 * Dimensions come from PDF_PAGE_SIZES (stored as landscape: width × height).
 * The hint text below the select shows orientation-corrected effective dimensions.
 */
function formatPageSizeLabel(key: PdfPageSize): string {
  if (key === "custom") return PAGE_SIZE_NAMES[key];
  const { width, height } = PDF_PAGE_SIZES[key];
  return `${PAGE_SIZE_NAMES[key]} (${width} × ${height} mm)`;
}

// Named icon constants — static React elements, defined once at module scope
const LANDSCAPE_ICON = (
  <span className="w-4 h-2.5 border-2 border-current rounded-sm" />
);
const PORTRAIT_ICON = (
  <span className="w-2.5 h-4 border-2 border-current rounded-sm" />
);

const ORIENTATION_OPTIONS: SegmentedControlOption<PdfOrientation>[] = [
  { value: "landscape", label: "Landscape", icon: LANDSCAPE_ICON },
  { value: "portrait", label: "Portrait", icon: PORTRAIT_ICON },
];

const MARGIN_OPTIONS: SegmentedControlOption<PdfMarginPreset>[] = [
  { value: "normal", label: "Normal" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" },
  { value: "none", label: "None" },
  // Note: "custom" exists in PdfMarginPreset but is intentionally not listed here.
  // It is reserved for a future "custom margins" editing feature.
];

/** Header/Footer checkbox options */
const HEADER_FOOTER_OPTIONS = [
  { key: "showProjectName", label: "Project title" },
  { key: "showAuthor", label: "Author" },
  { key: "showExportDate", label: "Export date" },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/** Validates that a string is a valid PdfPageSize */
const isPageSize = (value: string): value is PdfPageSize =>
  value in PAGE_SIZE_NAMES;

/** Clamp a parsed input value to the allowed page dimension range */
function clampDimension(raw: string, fallback: number): number {
  const parsed = parseInt(raw, 10);
  const value = Number.isNaN(parsed) ? fallback : parsed;
  return Math.max(MIN_CUSTOM_PAGE_MM, Math.min(MAX_CUSTOM_PAGE_MM, value));
}

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
    const opt = HEADER_FOOTER_OPTIONS.find((o) => o.key === key);
    if (!opt) return;
    // Build update via typed key — TypeScript verifies opt.key is a PdfHeaderFooter field
    const update: PdfHeaderFooter = { ...values };
    update[opt.key] = checked;
    onValuesChange(update);
  };

  return (
    <div>
      <FieldLabel>{title}</FieldLabel>
      <CheckboxGroup items={items} onChange={handleChange} ariaLabel={title} />
    </div>
  );
}

interface CustomPageSizeInputsProps {
  customPageSize: { width: number; height: number } | undefined;
  onChange: (options: Partial<PdfOptions>) => void;
}

/** Renders width/height inputs for custom page dimensions */
function CustomPageSizeInputs({
  customPageSize,
  onChange,
}: CustomPageSizeInputsProps): JSX.Element {
  const currentWidth = customPageSize?.width ?? DEFAULT_CUSTOM_SIZE.width;
  const currentHeight = customPageSize?.height ?? DEFAULT_CUSTOM_SIZE.height;

  const handleDimensionChange = (
    dimension: "width" | "height",
    raw: string
  ): void => {
    const clamped = clampDimension(
      raw,
      dimension === "width"
        ? DEFAULT_CUSTOM_SIZE.width
        : DEFAULT_CUSTOM_SIZE.height
    );
    onChange({
      customPageSize: {
        width: dimension === "width" ? clamped : currentWidth,
        height: dimension === "height" ? clamped : currentHeight,
      },
    });
  };

  return (
    <div className="mt-5 grid grid-cols-2 gap-4">
      <div>
        <FieldLabel htmlFor="pdf-custom-width">Width (mm)</FieldLabel>
        <Input
          id="pdf-custom-width"
          type="number"
          value={currentWidth}
          onChange={(e) => handleDimensionChange("width", e.target.value)}
          min={MIN_CUSTOM_PAGE_MM}
          max={MAX_CUSTOM_PAGE_MM}
          mono
        />
      </div>
      <div>
        <FieldLabel htmlFor="pdf-custom-height">Height (mm)</FieldLabel>
        <Input
          id="pdf-custom-height"
          type="number"
          value={currentHeight}
          onChange={(e) => handleDimensionChange("height", e.target.value)}
          min={MIN_CUSTOM_PAGE_MM}
          max={MAX_CUSTOM_PAGE_MM}
          mono
        />
      </div>
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
            <FieldLabel htmlFor="pdf-page-size">Page Size</FieldLabel>
            <Select
              id="pdf-page-size"
              value={options.pageSize}
              onChange={(e) => {
                if (isPageSize(e.target.value)) {
                  onChange({ pageSize: e.target.value });
                }
              }}
            >
              {(Object.keys(PAGE_SIZE_NAMES) as PdfPageSize[]).map((key) => (
                <option key={key} value={key}>
                  {formatPageSizeLabel(key)}
                </option>
              ))}
            </Select>
            {options.pageSize !== "custom" && (
              <p className="text-xs text-neutral-500 mt-2">
                {displayWidth} × {displayHeight} mm
              </p>
            )}
          </div>

          {/* Orientation */}
          <div>
            <FieldLabel>Orientation</FieldLabel>
            <SegmentedControl
              options={ORIENTATION_OPTIONS}
              value={options.orientation}
              onChange={(value) => onChange({ orientation: value })}
              ariaLabel="Page orientation"
            />
          </div>
        </div>

        {/* Custom page size */}
        {options.pageSize === "custom" && (
          <CustomPageSizeInputs
            customPageSize={options.customPageSize}
            onChange={onChange}
          />
        )}

        {/* Margins */}
        <div className="mt-6">
          <FieldLabel>Margins</FieldLabel>
          <SegmentedControl
            options={MARGIN_OPTIONS}
            value={options.marginPreset}
            onChange={(value) => onChange({ marginPreset: value })}
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
            <FieldLabel htmlFor="pdf-author">Author</FieldLabel>
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
