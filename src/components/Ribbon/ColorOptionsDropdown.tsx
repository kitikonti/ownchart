/**
 * ColorOptionsDropdown - Context-dependent color options
 *
 * Shows different options based on selected color mode:
 * - Manual: Quick swatches from project colors
 * - Theme: Palette selection with categories
 * - Summary: Milestone accent toggle
 * - Task Type: Color pickers for each type
 * - Hierarchy: Base color and lightness settings
 */

import { useState } from "react";
import { Sliders } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";
import {
  COLOR_PALETTES,
  CATEGORY_LABELS,
  type PaletteCategory,
} from "../../utils/colorPalettes";
import { generateMonochromePalette } from "../../utils/colorUtils";

/**
 * Color swatch component for palette preview
 */
function ColorSwatch({
  color,
  size = 16,
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
 * Palette preview row showing 5 color swatches
 */
function PalettePreview({ colors }: { colors: string[] }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {colors.slice(0, 5).map((color, i) => (
        <ColorSwatch key={i} color={color} size={14} />
      ))}
    </div>
  );
}

interface ColorOptionsDropdownProps {
  labelPriority?: number;
}

export function ColorOptionsDropdown({
  labelPriority,
}: ColorOptionsDropdownProps = {}): JSX.Element {
  const [customMonoInput, setCustomMonoInput] = useState("#0F6CBD");
  const { isOpen, toggle, close, containerRef } = useDropdown();

  const colorModeState = useChartStore((state) => state.colorModeState);
  const setThemeOptions = useChartStore((state) => state.setThemeOptions);
  const setSummaryOptions = useChartStore((state) => state.setSummaryOptions);
  const setTaskTypeOptions = useChartStore((state) => state.setTaskTypeOptions);
  const setHierarchyOptions = useChartStore(
    (state) => state.setHierarchyOptions
  );

  const currentMode = colorModeState.mode;

  const handleSelectPalette = (paletteId: string): void => {
    setThemeOptions({
      selectedPaletteId: paletteId,
      customMonochromeBase: null,
    });
    close();
  };

  const handleCreateMonochrome = (): void => {
    setThemeOptions({
      selectedPaletteId: null,
      customMonochromeBase: customMonoInput,
    });
    close();
  };

  // Group palettes by category
  const palettesByCategory: Record<PaletteCategory, typeof COLOR_PALETTES> = {
    corporate: COLOR_PALETTES.filter((p) => p.category === "corporate"),
    nature: COLOR_PALETTES.filter((p) => p.category === "nature"),
    creative: COLOR_PALETTES.filter((p) => p.category === "creative"),
  };

  const renderThemeOptions = (): JSX.Element => (
    <div style={{ padding: "8px 0" }}>
      {(["corporate", "nature", "creative"] as PaletteCategory[]).map(
        (category) => (
          <div key={category} style={{ marginBottom: "8px" }}>
            {/* Category Header */}
            <div
              style={{
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                color: "rgb(100, 100, 100)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {CATEGORY_LABELS[category]}
            </div>

            {/* Palettes in category */}
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
        )
      )}

      {/* Divider */}
      <div
        style={{
          height: "1px",
          backgroundColor: "rgb(230, 230, 230)",
          margin: "8px 12px",
        }}
      />

      {/* Custom Monochrome */}
      <div style={{ padding: "8px 12px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "rgb(100, 100, 100)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}
        >
          Custom Monochrome
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="color"
            value={customMonoInput}
            onChange={(e) => setCustomMonoInput(e.target.value)}
            style={{
              width: "28px",
              height: "28px",
              border: "1px solid rgb(200, 200, 200)",
              borderRadius: "4px",
              cursor: "pointer",
              padding: "2px",
            }}
            title="Pick base color"
          />
          <PalettePreview colors={generateMonochromePalette(customMonoInput)} />
          <button
            type="button"
            onClick={handleCreateMonochrome}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              backgroundColor: "rgb(15, 108, 189)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  const renderSummaryOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
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
              setSummaryOptions({ milestoneAccentColor: e.target.value })
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
      {/* Summary Color */}
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
          onChange={(e) => setTaskTypeOptions({ summaryColor: e.target.value })}
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

      {/* Task Color */}
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
          onChange={(e) => setTaskTypeOptions({ taskColor: e.target.value })}
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

      {/* Milestone Color */}
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
            setTaskTypeOptions({ milestoneColor: e.target.value })
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
      {/* Base Color */}
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
          onChange={(e) => setHierarchyOptions({ baseColor: e.target.value })}
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

      {/* Lightening per level */}
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

      {/* Max lightening */}
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

  const renderManualOptions = (): JSX.Element => (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          fontSize: "13px",
          color: "rgb(100, 100, 100)",
          textAlign: "center",
        }}
      >
        Use the color picker in the task list to set individual task colors.
      </div>
    </div>
  );

  const renderContent = (): JSX.Element => {
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

  // Get label based on current mode
  const getLabel = (): string => {
    switch (currentMode) {
      case "theme": {
        const selectedPalette = COLOR_PALETTES.find(
          (p) => p.id === colorModeState.themeOptions.selectedPaletteId
        );
        return selectedPalette?.name || "Select Palette";
      }
      case "summary":
        return "Options";
      case "taskType":
        return "Type Colors";
      case "hierarchy":
        return "Settings";
      case "manual":
      default:
        return "Options";
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Sliders size={18} weight="light" />}
        label={getLabel()}
        aria-label="Color Options"
        title="Color mode options"
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel
          minWidth={currentMode === "theme" ? "280px" : "200px"}
          maxHeight="400px"
        >
          {renderContent()}
        </DropdownPanel>
      )}
    </div>
  );
}
