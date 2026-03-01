/**
 * Export format selector component.
 * Allows users to choose between PNG, PDF, and SVG export formats.
 * Figma-style: Selected card has solid brand-600 background.
 */

import { useRef, useId } from "react";
import { Image, FilePdf, FileCode, Info } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { ExportFormat } from "@/utils/export/types";

const ICON_SIZE = 22;
// 80px: ensures icon + label always fit without clipping at any font scale
const FORMAT_CARD_HEIGHT_CLASS = "min-h-[80px]";

interface FormatOption {
  format: ExportFormat;
  icon: Icon;
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

interface FormatCardProps {
  option: FormatOption;
  isSelected: boolean;
  descriptionId: string;
  onSelect: (format: ExportFormat) => void;
}

function FormatCard({
  option,
  isSelected,
  descriptionId,
  onSelect,
}: FormatCardProps): JSX.Element {
  const Icon = option.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-describedby={isSelected ? descriptionId : undefined}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(option.format)}
      className={`flex flex-col items-center gap-2 px-4 py-3.5 rounded border transition-colors duration-150 ${FORMAT_CARD_HEIGHT_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        isSelected
          ? "border-brand-600 bg-brand-600"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <Icon
        size={ICON_SIZE}
        weight="light"
        className={isSelected ? "text-white" : "text-neutral-500"}
      />
      <span
        className={`text-xs font-semibold ${
          isSelected ? "text-white" : "text-neutral-700"
        }`}
      >
        {option.label}
      </span>
    </button>
  );
}

interface ExportFormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export function ExportFormatSelector({
  selectedFormat,
  onFormatChange,
}: ExportFormatSelectorProps): JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  const selectedOption = FORMAT_OPTIONS.find(
    (opt) => opt.format === selectedFormat
  );

  // Arrow keys navigate within the radiogroup (WAI-ARIA radiogroup pattern).
  // Only one tab stop in the group — Tab/Shift-Tab moves to the next widget.
  const handleGroupKeyDown = (e: React.KeyboardEvent): void => {
    const currentIndex = FORMAT_OPTIONS.findIndex(
      (opt) => opt.format === selectedFormat
    );
    let nextIndex: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % FORMAT_OPTIONS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex =
        (currentIndex - 1 + FORMAT_OPTIONS.length) % FORMAT_OPTIONS.length;
    }

    if (nextIndex !== null) {
      onFormatChange(FORMAT_OPTIONS[nextIndex].format);
      const buttons =
        groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div>
      <span className="block text-sm font-semibold text-neutral-900 mb-3">
        Format
      </span>

      {/* Format Cards Grid — radiogroup for correct single-selection semantics */}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Export format"
        // tabIndex={-1}: container is programmatically focusable (satisfies
        // interactive-supports-focus); Tab focus goes to the selected radio (tabIndex=0).
        tabIndex={-1}
        className="grid grid-cols-3 gap-2"
        onKeyDown={handleGroupKeyDown}
      >
        {FORMAT_OPTIONS.map((option) => (
          <FormatCard
            key={option.format}
            option={option}
            isSelected={selectedFormat === option.format}
            descriptionId={descriptionId}
            onSelect={onFormatChange}
          />
        ))}
      </div>

      {/* Help Text Box — id referenced by the selected radio button via aria-describedby */}
      {selectedOption && (
        <div className="mt-3 flex items-start gap-2 text-xs text-neutral-600 bg-neutral-50 rounded p-3 border border-neutral-200">
          <Info
            aria-hidden="true"
            className="size-4 text-neutral-500 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p id={descriptionId}>{selectedOption.helpText}</p>
        </div>
      )}
    </div>
  );
}
