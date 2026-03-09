/**
 * ZoomDialog - Modal dialog for selecting zoom presets
 *
 * Similar to MS Word's "Zoom to" dialog with radio button options
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react";

import { MagnifyingGlass } from "@phosphor-icons/react";

import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Radio } from "../common/Radio";

interface ZoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentZoom: number;
  /**
   * Called with the selected zoom value when the user confirms.
   * The caller is responsible for closing the dialog (e.g. by setting
   * isOpen=false) in response to this callback.
   */
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

/**
 * Tolerance for floating-point comparison when matching a zoom level to a preset.
 * Chosen to be smaller than the smallest gap between consecutive presets (0.05),
 * so only exact-match presets are selected, avoiding false positives.
 */
const ZOOM_MATCH_EPSILON = 0.01;

/**
 * Finds the closest preset to the given zoom level.
 * Returns the exact preset value when within ZOOM_MATCH_EPSILON, otherwise defaults to 100%.
 *
 * Note: "fit" is not auto-detected from the zoom number — callers that want
 * the "fit" preset pre-selected must pass a sentinel value that maps to it.
 * Defaulting to 100% on no match is intentional: it avoids ambiguity when
 * the zoom level was set by a fit-to-view operation with an arbitrary value.
 */
function findClosestPreset(zoom: number): number | "fit" {
  const exactMatch = ZOOM_PRESETS.find(
    (p) =>
      typeof p.value === "number" &&
      Math.abs(p.value - zoom) < ZOOM_MATCH_EPSILON
  );
  if (exactMatch && typeof exactMatch.value === "number") {
    return exactMatch.value;
  }
  // Default to 100% if no exact match
  return 1.0;
}

export const ZoomDialog = memo(function ZoomDialog({
  isOpen,
  onClose,
  currentZoom,
  onSelect,
}: ZoomDialogProps): JSX.Element | null {
  const [selectedValue, setSelectedValue] = useState<number | "fit">(() =>
    findClosestPreset(currentZoom)
  );

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedValue(findClosestPreset(currentZoom));
    }
  }, [isOpen, currentZoom]);

  const handleOk = useCallback((): void => {
    onSelect(selectedValue);
  }, [onSelect, selectedValue]);

  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleOk}>
          OK
        </Button>
      </>
    ),
    [onClose, handleOk]
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
      headerStyle="bordered"
      footerStyle="bordered"
    >
      <div className="space-y-1" role="radiogroup" aria-label="Zoom level">
        {ZOOM_PRESETS.map((preset) => (
          <label
            key={String(preset.value)}
            className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer hover:bg-neutral-50 transition-colors duration-150"
          >
            <Radio
              name="zoom-preset"
              value={String(preset.value)}
              checked={selectedValue === preset.value}
              onChange={() => setSelectedValue(preset.value)}
            />
            <span className="text-sm text-neutral-800">{preset.label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
});
