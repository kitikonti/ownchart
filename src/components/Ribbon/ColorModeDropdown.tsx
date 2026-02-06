/**
 * ColorModeDropdown - Smart Color Management mode selector
 *
 * MS Office Ribbon-style dropdown for selecting color mode:
 * - Manual: Per-task control
 * - Theme: One-click palette themes
 * - Summary: Children inherit parent color
 * - Task Type: Summary/Task/Milestone each get fixed color
 * - Hierarchy: Darker->lighter based on depth
 */

import { Palette } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";
import { TOOLBAR } from "../../styles/design-tokens";
import type { ColorMode } from "../../types/colorMode.types";

interface ColorModeOption {
  value: ColorMode;
  label: string;
  description: string;
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Per-task color control",
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

interface ColorModeDropdownProps {
  labelPriority?: number;
}

export function ColorModeDropdown({
  labelPriority,
}: ColorModeDropdownProps = {}): JSX.Element {
  const { isOpen, toggle, close, containerRef } = useDropdown();

  const colorModeState = useChartStore((state) => state.colorModeState);
  const setColorMode = useChartStore((state) => state.setColorMode);

  const currentMode = colorModeState.mode;
  const currentOption = COLOR_MODE_OPTIONS.find((o) => o.value === currentMode);

  const handleSelect = (mode: ColorMode): void => {
    setColorMode(mode);
    close();
  };

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Palette size={TOOLBAR.iconSize} weight="light" />}
        label={currentOption?.label || "Color"}
        aria-label="Color Mode"
        aria-haspopup="listbox"
        title="Select color mode"
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel role="listbox" aria-label="Color mode" minWidth="200px">
          {COLOR_MODE_OPTIONS.map((option) => (
            <DropdownItem
              key={option.value}
              isSelected={option.value === currentMode}
              onClick={() => handleSelect(option.value)}
              description={option.description}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}
