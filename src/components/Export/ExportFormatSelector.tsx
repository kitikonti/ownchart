/**
 * Export format selector component.
 * Allows users to choose between PNG, PDF, and SVG export formats.
 */

import { Image, FilePdf, FileCode } from "@phosphor-icons/react";
import type { ExportFormat } from "../../utils/export/types";

interface FormatOption {
  format: ExportFormat;
  icon: typeof Image;
  label: string;
  description: string;
  bestFor: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "png",
    icon: Image,
    label: "PNG",
    description: "Raster image",
    bestFor: "Best for web & slides",
  },
  {
    format: "pdf",
    icon: FilePdf,
    label: "PDF",
    description: "Vector document",
    bestFor: "Best for print",
  },
  {
    format: "svg",
    icon: FileCode,
    label: "SVG",
    description: "Editable vector",
    bestFor: "Best for design tools",
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
  return (
    <div className="flex gap-2">
      {FORMAT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedFormat === option.format;

        return (
          <button
            key={option.format}
            type="button"
            onClick={() => onFormatChange(option.format)}
            className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-150 ${
              isSelected
                ? "bg-brand-50 border-[var(--color-brand-gray-400)] shadow-sm"
                : "bg-white border-neutral-200 hover:border-[var(--color-brand-gray-400)] hover:bg-brand-50/30"
            }`}
            aria-pressed={isSelected}
          >
            <Icon
              size={24}
              weight="light"
              className={
                isSelected
                  ? "text-[var(--color-brand-gray-700)]"
                  : "text-neutral-400"
              }
            />
            <span
              className={`text-sm font-semibold ${isSelected ? "text-[var(--color-brand-gray-900)]" : "text-neutral-600"}`}
            >
              {option.label}
            </span>
            <span
              className={`text-[10px] leading-tight text-center ${isSelected ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
            >
              {option.bestFor}
            </span>
          </button>
        );
      })}
    </div>
  );
}
