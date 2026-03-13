/**
 * ZoomControls - Status bar zoom controls
 *
 * Contains: zoom out, zoom slider, zoom in, zoom percentage (clickable),
 * and fit-to-view button. Manages zoom dialog state locally.
 *
 * Tasks are read at interaction time via getState() rather than subscribed
 * reactively, so this component does not re-render on task changes.
 */

import { useState, useCallback, memo } from "react";
import { Minus, Plus, ArrowsOutLineHorizontal } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";
// Non-reactive utilities exported from useZoom — not hook calls.
import {
  computeViewportCenterAnchor,
  applyScrollLeft,
} from "../../hooks/useZoom";
import { ZoomDialog } from "./ZoomDialog";

export const ZoomControls = memo(function ZoomControls(): JSX.Element {
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);

  // useShallow merges the five subscriptions into one — Zustand actions are
  // stable references and `zoom` is a primitive, so shallow equality prevents
  // spurious re-renders when unrelated chart state changes.
  const { zoom, setZoom, zoomIn, zoomOut, fitToView } = useChartStore(
    useShallow((state) => ({
      zoom: state.zoom,
      setZoom: state.setZoom,
      zoomIn: state.zoomIn,
      zoomOut: state.zoomOut,
      fitToView: state.fitToView,
    }))
  );

  const zoomPercentage = Math.round(zoom * 100);
  const isAtMinZoom = zoom <= MIN_ZOOM;
  const isAtMaxZoom = zoom >= MAX_ZOOM;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newZoom = parseFloat(e.target.value) / 100;
      const anchor = computeViewportCenterAnchor();
      const result = setZoom(newZoom, anchor);
      applyScrollLeft(result.newScrollLeft);
    },
    [setZoom]
  );

  const handleZoomIn = useCallback((): void => {
    // Guard for aria-disabled: the button stays in the tab order but must not
    // perform any action at the maximum zoom level. Using the already-derived
    // `isAtMaxZoom` boolean keeps the guard and the aria-disabled attribute
    // in perfect sync.
    if (isAtMaxZoom) return;
    const anchor = computeViewportCenterAnchor();
    const result = zoomIn(anchor);
    applyScrollLeft(result.newScrollLeft);
  }, [isAtMaxZoom, zoomIn]);

  const handleZoomOut = useCallback((): void => {
    // Guard for aria-disabled: the button stays in the tab order but must not
    // perform any action at the minimum zoom level. Using the already-derived
    // `isAtMinZoom` boolean keeps the guard and the aria-disabled attribute
    // in perfect sync.
    if (isAtMinZoom) return;
    const anchor = computeViewportCenterAnchor();
    const result = zoomOut(anchor);
    applyScrollLeft(result.newScrollLeft);
  }, [isAtMinZoom, zoomOut]);

  const handleFitToView = useCallback((): void => {
    // Non-reactive: read tasks at call time to avoid re-renders on task changes.
    // fitToView handles its own scroll positioning internally, unlike zoomIn /
    // zoomOut / setZoom which return `newScrollLeft` for the caller to apply.
    fitToView(useTaskStore.getState().tasks);
  }, [fitToView]);

  // Passed to memoized ZoomDialog — stable references prevent unnecessary
  // re-renders of the dialog when ZoomControls re-renders on zoom changes.
  const handleOpenZoomDialog = useCallback((): void => {
    setIsZoomDialogOpen(true);
  }, []);

  const handleCloseZoomDialog = useCallback((): void => {
    setIsZoomDialogOpen(false);
  }, []);

  const handleZoomSelect = useCallback(
    (newZoom: number | "fit"): void => {
      if (newZoom === "fit") {
        fitToView(useTaskStore.getState().tasks);
      } else {
        const anchor = computeViewportCenterAnchor();
        const result = setZoom(newZoom, anchor);
        applyScrollLeft(result.newScrollLeft);
      }
      setIsZoomDialogOpen(false);
    },
    [fitToView, setZoom]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {/* aria-disabled keeps the button in the tab order so keyboard users
            can discover it and hear its state announced, unlike native disabled
            which removes the element from the tab order entirely. */}
        <button
          type="button"
          onClick={handleZoomOut}
          aria-disabled={isAtMinZoom ? "true" : "false"}
          className={`p-0.5 transition-colors ${isAtMinZoom ? "text-neutral-300 cursor-not-allowed" : "text-neutral-500 hover:text-neutral-700"}`}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={16} weight="bold" />
        </button>

        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          value={zoomPercentage}
          onChange={handleSliderChange}
          className="status-bar-slider w-24 h-1 bg-neutral-300 rounded-full appearance-none cursor-pointer"
          aria-label="Zoom level"
          aria-valuemin={MIN_ZOOM * 100}
          aria-valuemax={MAX_ZOOM * 100}
          aria-valuenow={zoomPercentage}
          aria-valuetext={`${zoomPercentage}%`}
        />

        <button
          type="button"
          onClick={handleZoomIn}
          aria-disabled={isAtMaxZoom ? "true" : "false"}
          className={`p-0.5 transition-colors ${isAtMaxZoom ? "text-neutral-300 cursor-not-allowed" : "text-neutral-500 hover:text-neutral-700"}`}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus size={16} weight="bold" />
        </button>

        {/* min-w-[44px] = WCAG 2.5.5 minimum touch-target width */}
        <button
          type="button"
          onClick={handleOpenZoomDialog}
          className="min-w-[44px] text-right text-neutral-600 hover:text-neutral-800 hover:underline cursor-pointer transition-colors"
          aria-label={`Zoom: ${zoomPercentage}%. Open zoom dialog`}
        >
          {zoomPercentage}%
        </button>

        <button
          type="button"
          onClick={handleFitToView}
          className="p-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
          aria-label="Fit to view"
          title="Fit to View (F)"
        >
          <ArrowsOutLineHorizontal size={16} weight="bold" />
        </button>
      </div>

      <ZoomDialog
        isOpen={isZoomDialogOpen}
        onClose={handleCloseZoomDialog}
        currentZoom={zoom}
        onSelect={handleZoomSelect}
      />
    </>
  );
});
