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

import { useState, useRef, useEffect } from "react";
import { CaretDown, Sliders } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import {
  COLOR_PALETTES,
  CATEGORY_LABELS,
  type PaletteCategory,
} from "../../utils/colorPalettes";
import { generateMonochromePalette } from "../../utils/colorUtils";
import { TOOLBAR } from "../../styles/design-tokens";

/**
 * Color swatch component for palette preview
 */
function ColorSwatch({
  color,
  size = 16,
}: {
  color: string;
  size?: number;
}) {
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
function PalettePreview({ colors }: { colors: string[] }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {colors.slice(0, 5).map((color, i) => (
        <ColorSwatch key={i} color={color} size={14} />
      ))}
    </div>
  );
}

export function ColorOptionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMonoInput, setCustomMonoInput] = useState("#0F6CBD");
  const containerRef = useRef<HTMLDivElement>(null);

  const colorModeState = useChartStore((state) => state.colorModeState);
  const setThemeOptions = useChartStore((state) => state.setThemeOptions);
  const setSummaryOptions = useChartStore((state) => state.setSummaryOptions);
  const setTaskTypeOptions = useChartStore((state) => state.setTaskTypeOptions);
  const setHierarchyOptions = useChartStore(
    (state) => state.setHierarchyOptions
  );

  const currentMode = colorModeState.mode;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectPalette = (paletteId: string) => {
    setThemeOptions({ selectedPaletteId: paletteId, customMonochromeBase: null });
    setIsOpen(false);
  };

  const handleCreateMonochrome = () => {
    setThemeOptions({
      selectedPaletteId: null,
      customMonochromeBase: customMonoInput,
    });
    setIsOpen(false);
  };

  // Group palettes by category
  const palettesByCategory: Record<PaletteCategory, typeof COLOR_PALETTES> = {
    corporate: COLOR_PALETTES.filter((p) => p.category === "corporate"),
    nature: COLOR_PALETTES.filter((p) => p.category === "nature"),
    creative: COLOR_PALETTES.filter((p) => p.category === "creative"),
  };

  const renderThemeOptions = () => (
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
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => handleSelectPalette(palette.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "6px 12px",
                    backgroundColor: isSelected
                      ? "rgb(235, 245, 255)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgb(235, 245, 255)"
                      : "rgb(245, 245, 245)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgb(235, 245, 255)"
                      : "transparent";
                  }}
                >
                  <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                    {palette.name}
                  </span>
                  <PalettePreview colors={palette.colors} />
                </button>
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

  const renderSummaryOptions = () => (
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

  const renderTaskTypeOptions = () => (
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

  const renderHierarchyOptions = () => (
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

  const renderManualOptions = () => (
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

  const renderContent = () => {
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
  const getLabel = () => {
    switch (currentMode) {
      case "theme":
        const selectedPalette = COLOR_PALETTES.find(
          (p) => p.id === colorModeState.themeOptions.selectedPaletteId
        );
        return selectedPalette?.name || "Select Palette";
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
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Color Options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Color mode options"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          height: `${TOOLBAR.buttonHeight}px`,
          padding: "5px 8px",
          backgroundColor: isOpen ? "rgb(230, 230, 230)" : "transparent",
          color: "rgb(66, 66, 66)",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: 400,
          userSelect: "none",
          whiteSpace: "nowrap",
          transition: "background 0.1s cubic-bezier(0.33, 0, 0.67, 1)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "rgb(243, 243, 243)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen
            ? "rgb(230, 230, 230)"
            : "transparent";
        }}
      >
        <Sliders size={18} weight="light" />
        <span>{getLabel()}</span>
        <CaretDown size={12} weight="bold" style={{ marginLeft: "2px" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "2px",
            backgroundColor: "#ffffff",
            borderRadius: "4px",
            boxShadow:
              "0 0 2px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.14)",
            zIndex: 1000,
            minWidth: currentMode === "theme" ? "280px" : "200px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
}
