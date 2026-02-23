/**
 * Export Dialog component for PNG, PDF, and SVG export with options.
 * Rendering-only — all state and logic lives in useExportDialog hook.
 */

import { Spinner, FilePdf, FileCode, Image } from "@phosphor-icons/react";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";
import { EXPORT_MAX_SAFE_WIDTH } from "../../utils/export/types";
import type { ExportFormat } from "../../utils/export/types";
import { Modal } from "../common/Modal";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { SharedExportOptions } from "./SharedExportOptions";
import { ScaleOptions } from "./ScaleOptions";
import { PdfExportOptions } from "./PdfExportOptions";
import { ExportPreview } from "./ExportPreview";
import { useExportPreview } from "../../hooks/useExportPreview";
import { useExportDialog } from "../../hooks/useExportDialog";

/** Layout constants for the export dialog */
const CONTENT_HEIGHT = "h-[65vh]";
const OPTIONS_PANEL_WIDTH = "w-[480px]";

/** Format-specific button configuration */
const FORMAT_CONFIG: Record<
  ExportFormat,
  { icon: typeof Image; label: string }
> = {
  png: { icon: Image, label: "Export PNG" },
  pdf: { icon: FilePdf, label: "Export PDF" },
  svg: { icon: FileCode, label: "Export SVG" },
};

interface ExportDialogFooterProps {
  isExporting: boolean;
  exportProgress: number;
  selectedExportFormat: ExportFormat;
  onExport: () => void;
  onCancel: () => void;
}

function ExportDialogFooter({
  isExporting,
  exportProgress,
  selectedExportFormat,
  onExport,
  onCancel,
}: ExportDialogFooterProps): JSX.Element {
  const currentFormat = FORMAT_CONFIG[selectedExportFormat];
  const FormatIcon = currentFormat.icon;
  const showProgress = isExporting && exportProgress > 0;

  return (
    <div className="flex items-center w-full gap-3">
      <div className="flex-1">
        {showProgress && (
          <div className="flex items-center gap-2">
            <div
              className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={exportProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Export progress"
            >
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {exportProgress}%
            </span>
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        onClick={onCancel}
        disabled={isExporting}
        className="flex-1 max-w-[140px]"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onExport}
        disabled={isExporting}
        icon={
          isExporting ? (
            <Spinner size={16} className="animate-spin" />
          ) : (
            <FormatIcon size={16} weight="regular" />
          )
        }
        className="flex-1 max-w-[180px]"
      >
        {isExporting ? "Exporting..." : currentFormat.label}
      </Button>
    </div>
  );
}

/**
 * Export Dialog component.
 */
export function ExportDialog(): JSX.Element {
  const {
    isExportDialogOpen,
    closeExportDialog,
    selectedExportFormat,
    setExportFormat,
    exportOptions,
    setExportOptions,
    pdfExportOptions,
    setPdfExportOptions,
    isExporting,
    exportProgress,
    exportError,
    handleExport,
    tasks,
    columnWidths,
    currentAppZoom,
    projectTitle,
    projectAuthor,
    setProjectAuthor,
    effectiveExportOptions,
    estimatedDimensions,
    taskTableWidth,
    effectiveZoom,
    readabilityStatus,
    projectDateRange,
    visibleDateRange,
    showDimensions,
    hasWarning,
    hasInfo,
  } = useExportDialog();

  const {
    previewDataUrl,
    previewDimensions,
    isRendering: isPreviewRendering,
    error: previewError,
  } = useExportPreview({
    tasks,
    options: effectiveExportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    enabled: isExportDialogOpen,
  });

  return (
    <Modal
      isOpen={isExportDialogOpen}
      onClose={closeExportDialog}
      title="Export Gantt Chart"
      subtitle="Choose format and customize your export"
      footer={
        <ExportDialogFooter
          isExporting={isExporting}
          exportProgress={exportProgress}
          selectedExportFormat={selectedExportFormat}
          onExport={handleExport}
          onCancel={closeExportDialog}
        />
      }
      widthClass="max-w-7xl"
      headerStyle="figma"
      footerStyle="figma"
      contentPadding="p-0"
    >
      <div className={`flex ${CONTENT_HEIGHT}`}>
        {/* Left: Preview Panel */}
        <div className="flex-1 bg-neutral-50 p-6 border-r border-neutral-200">
          <ExportPreview
            format={selectedExportFormat}
            previewDataUrl={previewDataUrl}
            dimensions={
              previewDimensions.width > 0
                ? previewDimensions
                : estimatedDimensions
            }
            isRendering={isPreviewRendering}
            error={previewError}
            isTransparent={exportOptions.background === "transparent"}
            pdfOptions={pdfExportOptions}
            projectTitle={projectTitle || undefined}
            projectAuthor={projectAuthor || undefined}
            effectiveZoom={effectiveZoom}
            readabilityStatus={readabilityStatus}
          />

          {showDimensions && (hasWarning || hasInfo) && (
            <div className="mt-4">
              {hasWarning ? (
                <Alert variant="warning">
                  <span className="font-medium">
                    Export exceeds {EXPORT_MAX_SAFE_WIDTH.toLocaleString()}px -
                    may cause issues
                  </span>
                </Alert>
              ) : (
                <Alert variant="neutral">
                  <span className="font-medium">
                    Large export - generation may take a moment
                  </span>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Right: Options Panel */}
        <div
          className={`${OPTIONS_PANEL_WIDTH} flex-shrink-0 overflow-y-auto p-8 scrollbar-thin`}
        >
          <div className="space-y-8">
            <ExportFormatSelector
              selectedFormat={selectedExportFormat}
              onFormatChange={setExportFormat}
            />

            <div className="divider-h" />

            {/* Scale options for PNG and SVG (shared component) */}
            {(selectedExportFormat === "png" ||
              selectedExportFormat === "svg") && (
              <ScaleOptions
                options={exportOptions}
                onChange={setExportOptions}
                currentAppZoom={currentAppZoom}
                taskTableWidth={taskTableWidth}
              />
            )}

            {selectedExportFormat === "pdf" && (
              <PdfExportOptions
                options={pdfExportOptions}
                onChange={setPdfExportOptions}
                exportOptions={exportOptions}
                onExportOptionsChange={setExportOptions}
                currentAppZoom={currentAppZoom}
                projectAuthor={projectAuthor}
                onProjectAuthorChange={setProjectAuthor}
              />
            )}

            <div className="divider-h" />

            <SharedExportOptions
              options={exportOptions}
              onChange={setExportOptions}
              format={selectedExportFormat}
              projectDateRange={projectDateRange}
              visibleDateRange={visibleDateRange}
            />

            {exportError && <Alert variant="error">{exportError}</Alert>}

            <Alert variant="info">
              <strong className="font-semibold">Tip:</strong> For detailed
              documentation, use 100% zoom. For overview posters, use 25-50%
              zoom.
            </Alert>
          </div>
        </div>
      </div>
    </Modal>
  );
}
