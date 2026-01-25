/**
 * ZoomDialog - Modal dialog for selecting zoom presets
 *
 * Similar to MS Word's "Zoom to" dialog with radio button options
 */

import { useState, useEffect } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Radio } from "../common/Radio";

interface ZoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentZoom: number;
  onSelect: (zoom: number | "fit") => void;
}

// Zoom preset options
const ZOOM_PRESETS = [
  { value: "fit" as const, label: "Fit to View" },
  { value: 2.0, label: "200%" },
  { value: 1.5, label: "150%" },
  { value: 1.25, label: "125%" },
  { value: 1.0, label: "100%" },
  { value: 0.75, label: "75%" },
  { value: 0.5, label: "50%" },
  { value: 0.25, label: "25%" },
  { value: 0.1, label: "10%" },
];

export function ZoomDialog({
  isOpen,
  onClose,
  currentZoom,
  onSelect,
}: ZoomDialogProps) {
  // Find the closest preset to current zoom, or null if using "fit"
  const findClosestPreset = (zoom: number): number | "fit" => {
    // Find exact match first
    const exactMatch = ZOOM_PRESETS.find(
      (p) => typeof p.value === "number" && Math.abs(p.value - zoom) < 0.01
    );
    if (exactMatch && typeof exactMatch.value === "number") {
      return exactMatch.value;
    }
    // Default to 100% if no exact match
    return 1.0;
  };

  const [selectedValue, setSelectedValue] = useState<number | "fit">(() =>
    findClosestPreset(currentZoom)
  );

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedValue(findClosestPreset(currentZoom));
    }
  }, [isOpen, currentZoom]);

  const handleOk = () => {
    onSelect(selectedValue);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleOk}>
        OK
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zoom to"
      icon={
        <MagnifyingGlass
          size={24}
          weight="regular"
          className="text-brand-600"
        />
      }
      footer={footer}
      widthClass="max-w-xs"
      headerStyle="figma"
      footerStyle="figma"
    >
      <div className="space-y-1">
        {ZOOM_PRESETS.map((preset) => (
          <label
            key={String(preset.value)}
            className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer hover:bg-neutral-50 transition-colors duration-150"
          >
            <Radio
              name="zoom-preset"
              checked={selectedValue === preset.value}
              onChange={() => setSelectedValue(preset.value)}
              aria-label={preset.label}
            />
            <span className="text-sm text-neutral-800">{preset.label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
