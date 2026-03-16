/**
 * ZoomDialog - Modal dialog for selecting zoom presets via a radio button list.
 */

import { useState, useEffect, useCallback, memo } from "react";

import { MagnifyingGlass } from "@phosphor-icons/react";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Radio } from "@/components/common/Radio";

interface ZoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * The current zoom level to pre-select when the dialog opens.
   * Pass `"fit"` to pre-select the "Fit to View" preset.
   * Numeric values are matched to the nearest preset via `findClosestPreset`.
   */
  currentZoom: number | "fit";
  /**
   * Called with the selected zoom value when the user confirms.
   * The caller is responsible for closing the dialog (e.g. by setting
   * isOpen=false) in response to this callback.
   */
  onSelect: (zoom: number | "fit") => void;
}

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
 * Resolves the initial dialog selection from the caller-supplied zoom value.
 *
 * - Passing `"fit"` pre-selects the "Fit to View" preset directly.
 * - A numeric value that exactly matches a preset (within ZOOM_MATCH_EPSILON)
 *   selects that preset.
 * - Otherwise the numerically nearest numeric preset is selected so the dialog
 *   always opens with a selection that reflects the user's current zoom as
 *   closely as possible.
 *
 * Note: fit-to-view produces an arbitrary zoom float at the engine level.
 * Without the explicit `"fit"` sentinel there is no reliable way to distinguish
 * it from a regular zoom, so callers that apply fit-to-view should pass
 * `"fit"` instead of the resulting numeric zoom ratio.
 */
function findClosestPreset(zoom: number | "fit"): number | "fit" {
  if (zoom === "fit") return "fit";

  const exactMatch = ZOOM_PRESETS.find(
    (p) =>
      typeof p.value === "number" &&
      Math.abs(p.value - zoom) < ZOOM_MATCH_EPSILON
  );
  if (exactMatch && typeof exactMatch.value === "number") {
    return exactMatch.value;
  }

  // No exact match — select the numerically nearest numeric preset so the
  // dialog always opens with a selection that is closest to the current zoom.
  let nearestValue = 1.0;
  let nearestDistance = Infinity;
  for (const preset of ZOOM_PRESETS) {
    if (typeof preset.value !== "number") continue;
    const distance = Math.abs(preset.value - zoom);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestValue = preset.value;
    }
  }
  return nearestValue;
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

  /**
   * Allow keyboard users to confirm the selected preset by pressing Enter while
   * focus is inside the radio group — matching the expected behaviour of a
   * standard dialog with an OK button.
   */
  const handleRadioGroupKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleOk();
      }
    },
    [handleOk]
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
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleOk}>
            OK
          </Button>
        </>
      }
      widthClass="max-w-xs"
      headerStyle="bordered"
      footerStyle="bordered"
    >
      {/* tabIndex={-1} satisfies the jsx-a11y rule that interactive roles must be
          focusable, while not adding the container to the natural Tab order
          (individual radio inputs inside are already Tab-reachable). The
          onKeyDown handler intercepts Enter to confirm — radio inputs do not
          have a native Enter behaviour that submits without a <form>. */}
      <div
        className="space-y-1"
        role="radiogroup"
        aria-label="Zoom level"
        tabIndex={-1}
        onKeyDown={handleRadioGroupKeyDown}
      >
        {ZOOM_PRESETS.map((preset) => {
          // Stable id for explicit <label htmlFor> association — more robust
          // across assistive technologies than proximity-based label detection.
          const inputId = `zoom-preset-${String(preset.value)}`;
          return (
            <label
              key={String(preset.value)}
              htmlFor={inputId}
              className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer hover:bg-slate-50 transition-colors duration-150"
            >
              <Radio
                id={inputId}
                name="zoom-preset"
                value={String(preset.value)}
                checked={selectedValue === preset.value}
                onChange={() => setSelectedValue(preset.value)}
              />
              <span className="text-sm text-slate-800">{preset.label}</span>
            </label>
          );
        })}
      </div>
    </Modal>
  );
});
