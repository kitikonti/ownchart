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
import { TOOLBAR, TYPOGRAPHY } from "../../styles/design-tokens";
import { Button } from "../common/Button";
import type { ColorMode } from "../../types/colorMode.types";
import type { HexColor, PaletteId } from "../../types/branded.types";
import {
  COLOR_PALETTES,
  CATEGORY_LABELS,
  PALETTE_CATEGORIES,
  type PaletteCategory,
} from "../../utils/colorPalettes";

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

/**
 * Color swatch for palette preview
 */
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

/**
 * Palette preview row showing all color swatches
 */
function PalettePreview({ colors }: { colors: string[] }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {colors.map((color, i) => (
        <ColorSwatch key={i} color={color} size={10} />
      ))}
    </div>
  );
}

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

  // Group palettes by category
  const palettesByCategory = Object.fromEntries(
    PALETTE_CATEGORIES.map((cat) => [
      cat,
      COLOR_PALETTES.filter((p) => p.category === cat),
    ])
  ) as Record<PaletteCategory, typeof COLOR_PALETTES>;

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

  // ── Mode-specific option renderers ─────────────────────────────────────

  const renderManualOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          fontSize: "13px",
          color: "rgb(100, 100, 100)",
        }}
      >
        Use the color picker in the task list to set individual task colors.
      </div>
    </div>
  );

  const renderThemeOptions = (): JSX.Element => (
    <div style={{ padding: "8px 0" }}>
      {PALETTE_CATEGORIES.map((category) => (
        <div key={category} style={{ marginBottom: "8px" }}>
          <div
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(100, 100, 100)",
              textTransform: "uppercase",
              letterSpacing: TYPOGRAPHY.letterSpacing.wide,
            }}
          >
            {CATEGORY_LABELS[category]}
          </div>

          {palettesByCategory[category].map((palette) => {
            const isSelected =
              colorModeState.themeOptions.selectedPaletteId === palette.id;
            return (
              <DropdownItem
                key={palette.id}
                isSelected={isSelected}
                showCheckmark={false}
                onClick={() => handleSelectPalette(palette.id)}
                trailing={<PalettePreview colors={palette.colors} />}
              >
                {palette.name}
              </DropdownItem>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderSummaryOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          fontSize: "13px",
          color: "rgb(100, 100, 100)",
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
          checked={colorModeState.summaryOptions.useMilestoneAccent}
          onChange={(e) =>
            setSummaryOptions({ useMilestoneAccent: e.target.checked })
          }
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <span style={{ fontSize: "13px" }}>Milestones in accent color</span>
      </label>

      {colorModeState.summaryOptions.useMilestoneAccent && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "rgb(100, 100, 100)" }}>
            Accent:
          </span>
          <input
            type="color"
            value={colorModeState.summaryOptions.milestoneAccentColor}
            onChange={(e) =>
              setSummaryOptions({
                milestoneAccentColor: e.target.value as HexColor,
              })
            }
            style={{
              width: "28px",
              height: "28px",
              border: "1px solid rgb(200, 200, 200)",
              borderRadius: "4px",
              cursor: "pointer",
              padding: "2px",
            }}
            title="Milestone accent color"
          />
        </div>
      )}
    </div>
  );

  const renderTaskTypeOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "13px" }}>Summary</span>
        <input
          type="color"
          value={colorModeState.taskTypeOptions.summaryColor}
          onChange={(e) =>
            setTaskTypeOptions({ summaryColor: e.target.value as HexColor })
          }
          style={{
            width: "32px",
            height: "24px",
            border: "1px solid rgb(200, 200, 200)",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "2px",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "13px" }}>Task</span>
        <input
          type="color"
          value={colorModeState.taskTypeOptions.taskColor}
          onChange={(e) =>
            setTaskTypeOptions({ taskColor: e.target.value as HexColor })
          }
          style={{
            width: "32px",
            height: "24px",
            border: "1px solid rgb(200, 200, 200)",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "2px",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "13px" }}>Milestone</span>
        <input
          type="color"
          value={colorModeState.taskTypeOptions.milestoneColor}
          onChange={(e) =>
            setTaskTypeOptions({
              milestoneColor: e.target.value as HexColor,
            })
          }
          style={{
            width: "32px",
            height: "24px",
            border: "1px solid rgb(200, 200, 200)",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "2px",
          }}
        />
      </div>
    </div>
  );

  const renderHierarchyOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "13px" }}>Base Color</span>
        <input
          type="color"
          value={colorModeState.hierarchyOptions.baseColor}
          onChange={(e) =>
            setHierarchyOptions({ baseColor: e.target.value as HexColor })
          }
          style={{
            width: "32px",
            height: "24px",
            border: "1px solid rgb(200, 200, 200)",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "2px",
          }}
        />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "13px" }}>Lighten per level</span>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            {colorModeState.hierarchyOptions.lightenPercentPerLevel}%
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="25"
          value={colorModeState.hierarchyOptions.lightenPercentPerLevel}
          onChange={(e) =>
            setHierarchyOptions({
              lightenPercentPerLevel: parseInt(e.target.value),
            })
          }
          style={{ width: "100%", cursor: "pointer" }}
        />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "13px" }}>Max lighten</span>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            {colorModeState.hierarchyOptions.maxLightenPercent}%
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="60"
          value={colorModeState.hierarchyOptions.maxLightenPercent}
          onChange={(e) =>
            setHierarchyOptions({ maxLightenPercent: parseInt(e.target.value) })
          }
          style={{ width: "100%", cursor: "pointer" }}
        />
      </div>
    </div>
  );

  const renderOptions = (): JSX.Element => {
    switch (currentMode) {
      case "theme":
        return renderThemeOptions();
      case "summary":
        return renderSummaryOptions();
      case "taskType":
        return renderTaskTypeOptions();
      case "hierarchy":
        return renderHierarchyOptions();
      case "manual":
      default:
        return renderManualOptions();
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
              backgroundColor: "rgb(230, 230, 230)",
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
                borderTop: "1px solid rgb(230, 230, 230)",
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
