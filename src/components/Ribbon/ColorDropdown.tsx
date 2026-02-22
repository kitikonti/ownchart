/**
 * ColorDropdown - Merged Color Mode + Options dropdown
 *
 * Single dropdown combining mode selection and mode-specific options.
 * Panel stays open on mode switch so users can immediately see the effect.
 *
 * Layout:
 * ┌──────────────────────────┐
 * │ Mode Selection (fixed)   │
 * │  ✓ None                  │
 * │    Theme                 │
 * │    Summary Group         │
 * │    Task Type             │
 * │    Hierarchy             │
 * ├──────────────────────────┤
 * │ Mode Options (scrollable)│
 * │  (varies by mode)        │
 * └──────────────────────────┘
 */

import { useEffect } from "react";
import { Palette, PaintBucket } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";
import { TOOLBAR } from "../../styles/design-tokens";
import { Button } from "../common/Button";
import type { ColorMode } from "../../types/colorMode.types";
import type {
  SummaryModeOptions,
  TaskTypeModeOptions,
  HierarchyModeOptions,
} from "../../types/colorMode.types";
import {
  toHexColor,
  toPaletteId,
  type HexColor,
  type PaletteId,
} from "../../types/branded.types";
import {
  COLOR_PALETTES,
  CATEGORY_LABELS,
  PALETTE_CATEGORIES,
  type PaletteCategory,
} from "../../utils/colorPalettes";

// ── Constants ───────────────────────────────────────────────────────────────

interface ColorModeOption {
  value: ColorMode;
  label: string;
  description: string;
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  {
    value: "manual",
    label: "None",
    description: "No automatic coloring",
  },
  {
    value: "theme",
    label: "Theme",
    description: "One-click palette themes",
  },
  {
    value: "summary",
    label: "Summary Group",
    description: "Children inherit parent color",
  },
  {
    value: "taskType",
    label: "Task Type",
    description: "Color by Summary/Task/Milestone",
  },
  {
    value: "hierarchy",
    label: "Hierarchy",
    description: "Darker\u2192lighter by depth",
  },
];

/** Palettes grouped by category (static — computed once at module load) */
const PALETTES_BY_CATEGORY = Object.fromEntries(
  PALETTE_CATEGORIES.map((cat) => [
    cat,
    COLOR_PALETTES.filter((p) => p.category === cat),
  ])
) as Record<PaletteCategory, typeof COLOR_PALETTES>;

// ── Shared sub-components ───────────────────────────────────────────────────

function ColorSwatch({
  color,
  size = 14,
}: {
  color: string;
  size?: number;
}): JSX.Element {
  return (
    <span
      className="inline-block rounded-sm border border-neutral-200 shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

function PalettePreview({ colors }: { colors: string[] }): JSX.Element {
  return (
    <div className="flex gap-px">
      {colors.map((color, index) => (
        <ColorSwatch key={`${color}-${index}`} color={color} size={10} />
      ))}
    </div>
  );
}

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (hex: HexColor) => void;
  className?: string;
}

function ColorPickerRow({
  label,
  value,
  onChange,
  className = "mb-2.5",
}: ColorPickerRowProps): JSX.Element {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(toHexColor(e.target.value))}
        aria-label={`${label} color`}
        className="w-8 h-6 border border-neutral-200 rounded cursor-pointer p-0.5"
      />
    </div>
  );
}

interface RangeSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

function RangeSliderRow({
  label,
  value,
  min,
  max,
  onChange,
  className = "mb-3",
}: RangeSliderRowProps): JSX.Element {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={label}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

// ── Mode option panels ──────────────────────────────────────────────────────

function ManualOptions(): JSX.Element {
  return (
    <div className="p-3">
      <div className="text-xs text-neutral-500">
        Use the color picker in the task list to set individual task colors.
      </div>
    </div>
  );
}

interface ThemeOptionsProps {
  selectedPaletteId: PaletteId | null;
  onSelectPalette: (id: PaletteId) => void;
}

function ThemeOptions({
  selectedPaletteId,
  onSelectPalette,
}: ThemeOptionsProps): JSX.Element {
  return (
    <div className="py-2">
      {PALETTE_CATEGORIES.map((category) => (
        <div key={category} className="mb-2">
          <div className="px-3 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            {CATEGORY_LABELS[category]}
          </div>

          <div
            role="group"
            aria-label={`${CATEGORY_LABELS[category]} palettes`}
          >
            {PALETTES_BY_CATEGORY[category].map((palette) => (
              <DropdownItem
                key={palette.id}
                isSelected={selectedPaletteId === palette.id}
                showCheckmark={false}
                onClick={() => onSelectPalette(toPaletteId(palette.id))}
                trailing={<PalettePreview colors={palette.colors} />}
              >
                {palette.name}
              </DropdownItem>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SummaryOptionsProps {
  options: SummaryModeOptions;
  onChange: (update: Partial<SummaryModeOptions>) => void;
}

function SummaryOptions({
  options,
  onChange,
}: SummaryOptionsProps): JSX.Element {
  return (
    <div className="p-3">
      <div className="text-xs text-neutral-500 mb-3">
        Set colors on summary tasks — children inherit automatically.
      </div>
      <label className="flex items-center gap-2 cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={options.useMilestoneAccent}
          onChange={(e) => onChange({ useMilestoneAccent: e.target.checked })}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm">Milestones in accent color</span>
      </label>

      {options.useMilestoneAccent && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Accent:</span>
          <input
            type="color"
            value={options.milestoneAccentColor}
            onChange={(e) =>
              onChange({ milestoneAccentColor: toHexColor(e.target.value) })
            }
            aria-label="Milestone accent color"
            className="w-7 h-7 border border-neutral-200 rounded cursor-pointer p-0.5"
          />
        </div>
      )}
    </div>
  );
}

interface TaskTypeOptionsProps {
  options: TaskTypeModeOptions;
  onChange: (update: Partial<TaskTypeModeOptions>) => void;
}

function TaskTypeOptions({
  options,
  onChange,
}: TaskTypeOptionsProps): JSX.Element {
  return (
    <div className="p-3">
      <ColorPickerRow
        label="Summary"
        value={options.summaryColor}
        onChange={(hex) => onChange({ summaryColor: hex })}
      />
      <ColorPickerRow
        label="Task"
        value={options.taskColor}
        onChange={(hex) => onChange({ taskColor: hex })}
      />
      <ColorPickerRow
        label="Milestone"
        value={options.milestoneColor}
        onChange={(hex) => onChange({ milestoneColor: hex })}
        className=""
      />
    </div>
  );
}

interface HierarchyOptionsProps {
  options: HierarchyModeOptions;
  onChange: (update: Partial<HierarchyModeOptions>) => void;
}

function HierarchyOptions({
  options,
  onChange,
}: HierarchyOptionsProps): JSX.Element {
  return (
    <div className="p-3">
      <ColorPickerRow
        label="Base"
        value={options.baseColor}
        onChange={(hex) => onChange({ baseColor: hex })}
        className="mb-3"
      />
      <RangeSliderRow
        label="Lighten per level"
        value={options.lightenPercentPerLevel}
        min={5}
        max={25}
        onChange={(v) => onChange({ lightenPercentPerLevel: v })}
      />
      <RangeSliderRow
        label="Max lighten"
        value={options.maxLightenPercent}
        min={20}
        max={60}
        onChange={(v) => onChange({ maxLightenPercent: v })}
        className=""
      />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface ColorDropdownProps {
  labelPriority?: number;
}

export function ColorDropdown({
  labelPriority,
}: ColorDropdownProps): JSX.Element {
  const { isOpen, toggle, close, containerRef } = useDropdown();

  const colorModeState = useChartStore((state) => state.colorModeState);
  const setColorMode = useChartStore((state) => state.setColorMode);
  const setThemeOptions = useChartStore((state) => state.setThemeOptions);
  const setSummaryOptions = useChartStore((state) => state.setSummaryOptions);
  const setTaskTypeOptions = useChartStore((state) => state.setTaskTypeOptions);
  const setHierarchyOptions = useChartStore(
    (state) => state.setHierarchyOptions
  );
  const applyColorsToManual = useChartStore(
    (state) => state.applyColorsToManual
  );

  // Focus first option when panel opens (F002: dialog focus management)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const firstButton = containerRef.current.querySelector<HTMLElement>(
        '[role="dialog"] button'
      );
      firstButton?.focus();
    }
  }, [isOpen, containerRef]);

  const currentMode = colorModeState.mode;

  const handleModeSelect = (mode: ColorMode): void => {
    setColorMode(mode);
    // Panel stays open — don't call close()
  };

  const handleSelectPalette = (paletteId: PaletteId): void => {
    setThemeOptions({
      selectedPaletteId: paletteId,
      customMonochromeBase: null,
    });
    close();
  };

  const renderOptions = (): JSX.Element => {
    switch (currentMode) {
      case "theme":
        return (
          <ThemeOptions
            selectedPaletteId={colorModeState.themeOptions.selectedPaletteId}
            onSelectPalette={handleSelectPalette}
          />
        );
      case "summary":
        return (
          <SummaryOptions
            options={colorModeState.summaryOptions}
            onChange={setSummaryOptions}
          />
        );
      case "taskType":
        return (
          <TaskTypeOptions
            options={colorModeState.taskTypeOptions}
            onChange={setTaskTypeOptions}
          />
        );
      case "hierarchy":
        return (
          <HierarchyOptions
            options={colorModeState.hierarchyOptions}
            onChange={setHierarchyOptions}
          />
        );
      case "manual":
      default:
        return <ManualOptions />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Palette size={TOOLBAR.iconSize} weight="light" />}
        label="Color"
        aria-label="Color mode and options"
        aria-haspopup="dialog"
        title="Color mode and options"
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel
          minWidth="280px"
          role="dialog"
          aria-label="Color mode options"
        >
          {/* Mode selection (fixed) */}
          <div role="group" aria-label="Color modes">
            {COLOR_MODE_OPTIONS.map((option) => (
              <DropdownItem
                key={option.value}
                isSelected={option.value === currentMode}
                onClick={() => handleModeSelect(option.value)}
                description={option.description}
              >
                {option.label}
              </DropdownItem>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100 my-1" />

          {/* Mode-specific options (scrollable) */}
          <div className="overflow-y-auto max-h-80">{renderOptions()}</div>

          {/* Apply Colors to Manual footer (only in auto modes) */}
          {currentMode !== "manual" && (
            <div className="border-t border-neutral-100 p-2">
              <Button
                variant="secondary"
                fullWidth
                icon={
                  <PaintBucket size={TOOLBAR.iconSizeSmall} weight="light" />
                }
                onClick={() => {
                  applyColorsToManual();
                  close();
                }}
                title="Write current colors into each task and switch to manual mode"
              >
                Apply Colors to Manual
              </Button>
            </div>
          )}
        </DropdownPanel>
      )}
    </div>
  );
}
