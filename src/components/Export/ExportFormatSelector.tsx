/**
 * Export format selector component.
 * Allows users to choose between PNG, PDF, and SVG export formats.
 * Figma-style: Selected card has solid brand-600 background.
 */

import { Image, FilePdf, FileCode, Info } from "@phosphor-icons/react";
import type { ExportFormat } from "../../utils/export/types";

interface FormatOption {
  format: ExportFormat;
  icon: typeof Image;
  label: string;
  helpText: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "png",
    icon: Image,
    label: "PNG",
    helpText: "Best for presentations and sharing. High quality raster image.",
  },
  {
    format: "pdf",
    icon: FilePdf,
    label: "PDF",
    helpText: "Best for printing and professional documentation.",
  },
  {
    format: "svg",
    icon: FileCode,
    label: "SVG",
    helpText: "Best for web and scalable graphics. Smallest file size.",
  },
];

interface ExportFormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export function ExportFormatSelector({
  selectedFormat,
  onFormatChange,
}: ExportFormatSelectorProps): JSX.Element {
  const selectedOption = FORMAT_OPTIONS.find(
    (opt) => opt.format === selectedFormat
  );

  return (
    <div>
      <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
        Format
      </span>

      {/* Format Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {FORMAT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedFormat === option.format;

          return (
            <button
              key={option.format}
              type="button"
              onClick={() => onFormatChange(option.format)}
              className={`flex flex-col items-center gap-2.5 px-4 py-4 rounded-lg border-2 transition-all duration-200 active:scale-[0.98] min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand-600 bg-brand-600 shadow-md"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
              aria-pressed={isSelected}
              title={option.helpText}
            >
              <Icon
                size={24}
                weight="light"
                className={isSelected ? "text-white" : "text-neutral-500"}
              />
              <span
                className={`text-xs font-semibold uppercase ${
                  isSelected ? "text-white" : "text-neutral-700"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Help Text Box */}
      {selectedOption && (
        <div className="mt-3 flex items-start gap-2 text-xs text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
          <Info
            className="size-4 text-neutral-500 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p>{selectedOption.helpText}</p>
        </div>
      )}
    </div>
  );
}
