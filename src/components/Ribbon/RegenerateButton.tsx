/**
 * RegenerateButton - Intelligent color regeneration
 *
 * Context-aware regeneration based on color mode:
 * - Manual: Generate new color suggestions
 * - Theme: Re-distribute palette colors
 * - Summary: Re-apply parent colors to children
 * - Task Type: Re-apply type colors
 * - Hierarchy: Recalculate lightness gradient
 */

import { useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { TOOLBAR } from "../../styles/design-tokens";

export function RegenerateButton(): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);

  const colorModeState = useChartStore((state) => state.colorModeState);
  const currentMode = colorModeState.mode;

  // Get tooltip text based on current mode
  const getTooltip = (): string => {
    switch (currentMode) {
      case "theme":
        return "Re-distribute palette colors to all tasks";
      case "summary":
        return "Re-apply parent colors to children";
      case "taskType":
        return "Re-apply type colors to all tasks";
      case "hierarchy":
        return "Recalculate hierarchy colors";
      case "manual":
      default:
        return "Generate new color suggestions";
    }
  };

  const handleClick = (): void => {
    // TODO: Implement regeneration logic in useComputedTaskColor hook
    // For now, this is a placeholder that will trigger re-computation
    // The actual logic will be implemented when we create the hook
    console.log(`Regenerating colors for mode: ${currentMode}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={getTooltip()}
      aria-label="Regenerate colors"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${TOOLBAR.buttonHeight}px`,
        height: `${TOOLBAR.buttonHeight}px`,
        backgroundColor: isHovered ? "rgb(243, 243, 243)" : "transparent",
        color: "rgb(66, 66, 66)",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        transition:
          "background 0.1s cubic-bezier(0.33, 0, 0.67, 1), transform 0.15s ease",
        transform: isHovered ? "rotate(15deg)" : "rotate(0deg)",
      }}
    >
      <ArrowsClockwise size={18} weight="light" />
    </button>
  );
}
