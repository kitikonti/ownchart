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

import { Palette, PaintBucket } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";
import { TOOLBAR, COLORS } from "../../styles/design-tokens";
import { Button } from "../common/Button";
import type { ColorMode } from "../../types/colorMode.types";
import type {
  SummaryModeOptions,
  TaskTypeModeOptions,
  HierarchyModeOptions,
} from "../../types/colorMode.types";
import type { HexColor, PaletteId } from "../../types/branded.types";
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
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "2px",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        flexShrink: 0,
      }}
    />
  );
}

function PalettePreview({ colors }: { colors: string[] }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {colors.map((color, i) => (
        <ColorSwatch key={i} color={color} size={10} />
      ))}
    </div>
  );
}

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (hex: HexColor) => void;
  marginBottom?: string;
}

function ColorPickerRow({
  label,
  value,
  onChange,
  marginBottom = "10px",
}: ColorPickerRowProps): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom,
      }}
    >
      <span style={{ fontSize: "13px" }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value as HexColor)}
        aria-label={`${label} color`}
        style={{
          width: "32px",
          height: "24px",
          border: `1px solid ${COLORS.neutral[200]}`,
          borderRadius: "4px",
          cursor: "pointer",
          padding: "2px",
        }}
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
  marginBottom?: string;
}

function RangeSliderRow({
  label,
  value,
  min,
  max,
  onChange,
  marginBottom = "12px",
}: RangeSliderRowProps): JSX.Element {
  return (
    <div style={{ marginBottom }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "13px" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={label}
        style={{ width: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

// ── Mode option panels ──────────────────────────────────────────────────────

function ManualOptions(): JSX.Element {
  return (
    <div style={{ padding: "12px" }}>
      <div style={{ fontSize: "13px", color: COLORS.neutral[500] }}>
        Use the color picker in the task list to set individual task colors.
      </div>
    </div>
  );
}

interface ThemeOptionsProps {
  selectedPaletteId: PaletteId | null;
  onSelectPalette: (id: string) => void;
}

function ThemeOptions({
  selectedPaletteId,
  onSelectPalette,
}: ThemeOptionsProps): JSX.Element {
  return (
    <div style={{ padding: "8px 0" }}>
      {PALETTE_CATEGORIES.map((category) => (
        <div key={category} style={{ marginBottom: "8px" }}>
          <div
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              color: COLORS.neutral[500],
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {CATEGORY_LABELS[category]}
          </div>

          {PALETTES_BY_CATEGORY[category].map((palette) => (
            <DropdownItem
              key={palette.id}
              isSelected={selectedPaletteId === palette.id}
              showCheckmark={false}
              onClick={() => onSelectPalette(palette.id)}
              trailing={<PalettePreview colors={palette.colors} />}
            >
              {palette.name}
            </DropdownItem>
          ))}
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
    <div style={{ padding: "12px" }}>
      <div
        style={{
          fontSize: "13px",
          color: COLORS.neutral[500],
          marginBottom: "12px",
        }}
      >
        Set colors on summary tasks — children inherit automatically.
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        <input
          type="checkbox"
          checked={options.useMilestoneAccent}
          onChange={(e) => onChange({ useMilestoneAccent: e.target.checked })}
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <span style={{ fontSize: "13px" }}>Milestones in accent color</span>
      </label>

      {options.useMilestoneAccent && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: COLORS.neutral[500] }}>
            Accent:
          </span>
          <input
            type="color"
            value={options.milestoneAccentColor}
            onChange={(e) =>
              onChange({ milestoneAccentColor: e.target.value as HexColor })
            }
            aria-label="Milestone accent color"
            style={{
              width: "28px",
              height: "28px",
              border: `1px solid ${COLORS.neutral[200]}`,
              borderRadius: "4px",
              cursor: "pointer",
              padding: "2px",
            }}
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
    <div style={{ padding: "12px" }}>
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
        marginBottom="0"
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
    <div style={{ padding: "12px" }}>
      <ColorPickerRow
        label="Base Color"
        value={options.baseColor}
        onChange={(hex) => onChange({ baseColor: hex })}
        marginBottom="12px"
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
        marginBottom="0"
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

  const currentMode = colorModeState.mode;

  const handleModeSelect = (mode: ColorMode): void => {
    setColorMode(mode);
    // Panel stays open — don't call close()
  };

  const handleSelectPalette = (paletteId: string): void => {
    setThemeOptions({
      selectedPaletteId: paletteId as PaletteId,
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
        aria-label="Color"
        aria-haspopup="listbox"
        title="Color mode and options"
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel minWidth="280px">
          {/* Mode selection (fixed) */}
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

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: COLORS.neutral[100],
              margin: "4px 0",
            }}
          />

          {/* Mode-specific options (scrollable) */}
          <div style={{ overflowY: "auto", maxHeight: "320px" }}>
            {renderOptions()}
          </div>

          {/* Apply Colors to Manual footer (only in auto modes) */}
          {currentMode !== "manual" && (
            <div
              style={{
                borderTop: `1px solid ${COLORS.neutral[100]}`,
                padding: "8px",
              }}
            >
              <Button
                variant="secondary"
                fullWidth
                icon={<PaintBucket size={16} weight="light" />}
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
