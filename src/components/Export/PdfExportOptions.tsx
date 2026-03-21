/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and header/footer.
 */

import { useCallback, useId, useRef, useState } from "react";
import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfOrientation,
  PdfMarginPreset,
  PdfHeaderFooter,
  PdfCustomPageSize,
  ExportOptions,
} from "@/utils/export/types";
import type { ProjectLogo } from "@/types/logo.types";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  DEFAULT_PDF_OPTIONS,
} from "@/utils/export/types";
import { CheckboxGroup } from "@/components/common/CheckboxGroup";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/common/SegmentedControl";
import { ZoomModeSelector } from "./ZoomModeSelector";
import {
  processLogoFile,
  formatFileSize,
  LOGO_ACCEPT,
  logoToDataUrl,
} from "@/utils/logoUpload";

// =============================================================================
// Constants
// =============================================================================

/** Minimum custom page dimension in mm */
const MIN_CUSTOM_PAGE_MM = 100;
/** Maximum custom page dimension in mm */
const MAX_CUSTOM_PAGE_MM = 5000;
/** Default custom page width in mm — used when no custom size has been configured yet */
const DEFAULT_CUSTOM_WIDTH_MM = 500;
/** Default custom page height in mm — used when no custom size has been configured yet */
const DEFAULT_CUSTOM_HEIGHT_MM = 300;

/**
 * Fallback for custom page size when not yet configured.
 * `DEFAULT_PDF_OPTIONS.customPageSize` is always defined, but the type allows
 * undefined (optional field) — the ?? keeps this resilient to future changes.
 */
const DEFAULT_CUSTOM_SIZE: PdfCustomPageSize =
  DEFAULT_PDF_OPTIONS.customPageSize ?? {
    width: DEFAULT_CUSTOM_WIDTH_MM,
    height: DEFAULT_CUSTOM_HEIGHT_MM,
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
 * Explicit ordering for page size options.
 * Safer than Object.keys(PAGE_SIZE_NAMES) which relies on insertion order,
 * and makes the intended sequence obvious at a glance.
 */
const PAGE_SIZE_ORDER: PdfPageSize[] = [
  "a4",
  "a3",
  "a2",
  "a1",
  "a0",
  "letter",
  "legal",
  "tabloid",
  "custom",
];

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
  <span
    aria-hidden="true"
    className="w-4 h-2.5 border-2 border-current rounded-sm"
  />
);
const PORTRAIT_ICON = (
  <span
    aria-hidden="true"
    className="w-2.5 h-4 border-2 border-current rounded-sm"
  />
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
  { key: "showLogo", label: "Logo" },
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

  const handleChange = useCallback(
    (key: string, checked: boolean): void => {
      const opt = HEADER_FOOTER_OPTIONS.find((o) => o.key === key);
      if (!opt) return;
      // Build update via typed key — TypeScript verifies opt.key is a PdfHeaderFooter field
      const update: PdfHeaderFooter = { ...values };
      update[opt.key] = checked;
      onValuesChange(update);
    },
    [values, onValuesChange]
  );

  return (
    <div>
      <FieldLabel>{title}</FieldLabel>
      <CheckboxGroup items={items} onChange={handleChange} ariaLabel={title} />
    </div>
  );
}

interface DimensionInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (raw: string) => void;
  min: number;
  max: number;
}

/** Renders a single labeled number input for a custom page dimension */
function DimensionInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: DimensionInputProps): JSX.Element {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        mono
      />
    </div>
  );
}

interface CustomPageSizeInputsProps {
  customPageSize: PdfCustomPageSize | undefined;
  onChange: (options: Partial<PdfOptions>) => void;
}

/** Renders width/height inputs for custom page dimensions */
function CustomPageSizeInputs({
  customPageSize,
  onChange,
}: CustomPageSizeInputsProps): JSX.Element {
  const currentWidth = customPageSize?.width ?? DEFAULT_CUSTOM_SIZE.width;
  const currentHeight = customPageSize?.height ?? DEFAULT_CUSTOM_SIZE.height;

  const handleDimensionChange = useCallback(
    (dimension: "width" | "height", raw: string): void => {
      const fallback =
        dimension === "width"
          ? DEFAULT_CUSTOM_SIZE.width
          : DEFAULT_CUSTOM_SIZE.height;
      const clamped = clampDimension(raw, fallback);
      onChange({
        customPageSize: {
          width: dimension === "width" ? clamped : currentWidth,
          height: dimension === "height" ? clamped : currentHeight,
        },
      });
    },
    [currentWidth, currentHeight, onChange]
  );

  return (
    <div className="mt-5 grid grid-cols-2 gap-4">
      <DimensionInput
        id="pdf-custom-width"
        label="Width (mm)"
        value={currentWidth}
        onChange={(raw) => handleDimensionChange("width", raw)}
        min={MIN_CUSTOM_PAGE_MM}
        max={MAX_CUSTOM_PAGE_MM}
      />
      <DimensionInput
        id="pdf-custom-height"
        label="Height (mm)"
        value={currentHeight}
        onChange={(raw) => handleDimensionChange("height", raw)}
        min={MIN_CUSTOM_PAGE_MM}
        max={MAX_CUSTOM_PAGE_MM}
      />
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
  projectLogo: ProjectLogo | null;
  onProjectLogoChange: (logo: ProjectLogo | null) => void;
}

export function PdfExportOptions({
  options,
  onChange,
  exportOptions,
  onExportOptionsChange,
  currentAppZoom,
  projectAuthor,
  onProjectAuthorChange,
  projectLogo,
  onProjectLogoChange,
}: PdfExportOptionsProps): JSX.Element {
  // Stable IDs for aria-labelledby on each section landmark
  const pageSetupId = useId();
  const headerFooterId = useId();

  // Logo upload state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLogoError(null);
      setIsUploading(true);
      try {
        const logo = await processLogoFile(file);
        onProjectLogoChange(logo);
      } catch (err) {
        setLogoError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setIsUploading(false);
        // Reset the input so the same file can be re-selected
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
    },
    [onProjectLogoChange]
  );

  const handleLogoRemove = useCallback((): void => {
    onProjectLogoChange(null);
    setLogoError(null);
  }, [onProjectLogoChange]);

  const showLogoSection = options.header.showLogo || options.footer.showLogo;

  const pageDims =
    options.pageSize === "custom"
      ? (options.customPageSize ?? DEFAULT_CUSTOM_SIZE)
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
        onZoomModeChange={(mode) => onExportOptionsChange({ zoomMode: mode })}
        timelineZoom={exportOptions.timelineZoom}
        onTimelineZoomChange={(zoom) =>
          onExportOptionsChange({ timelineZoom: zoom })
        }
        currentAppZoom={currentAppZoom}
        format="pdf"
      />

      <div className="divider-h" />

      {/* ============ PAGE SETUP ============ */}
      <section aria-labelledby={pageSetupId}>
        <SectionHeader id={pageSetupId} title="Page Setup" variant="simple" />

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
              {PAGE_SIZE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {formatPageSizeLabel(key)}
                </option>
              ))}
            </Select>
            {options.pageSize !== "custom" && (
              <p className="text-xs text-slate-600 mt-2">
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
            <p className="text-xs text-slate-600 mt-2">
              {PDF_MARGIN_PRESETS[options.marginPreset].top}mm top/bottom,{" "}
              {PDF_MARGIN_PRESETS[options.marginPreset].left}mm left/right
            </p>
          )}
        </div>
      </section>

      <div className="divider-h" />

      {/* ============ HEADER / FOOTER ============ */}
      <section aria-labelledby={headerFooterId}>
        <SectionHeader
          id={headerFooterId}
          title="Header / Footer"
          variant="simple"
        />

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

        {/* Logo upload - shown when any "Logo" checkbox is enabled */}
        {showLogoSection && (
          <div className="mt-4">
            <FieldLabel>Logo</FieldLabel>
            {projectLogo ? (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-md border border-slate-200">
                <img
                  src={logoToDataUrl(projectLogo)}
                  alt="Project logo"
                  className="h-8 w-auto object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    {projectLogo.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {projectLogo.width} × {projectLogo.height} px
                    {" · "}
                    {formatFileSize(Math.ceil(projectLogo.data.length * 0.75))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="text-xs text-slate-500 hover:text-slate-700 underline flex-shrink-0"
                  aria-label="Remove logo"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  aria-label="Upload logo"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploading}
                  aria-describedby="logo-upload-help"
                  className="w-full px-3 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-md hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  {isUploading ? "Uploading..." : "Upload Logo (PNG, JPG, SVG)"}
                </button>
                <p
                  id="logo-upload-help"
                  className="text-xs text-slate-500 mt-1"
                >
                  Max 512 KB. Saved with the project file.
                </p>
              </div>
            )}
            {logoError && (
              <p className="text-xs text-red-600 mt-1">{logoError}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
