/**
 * ZoomControls - Status bar zoom controls
 *
 * Contains: zoom out, zoom slider, zoom in, zoom percentage (clickable),
 * and fit-to-view button. Manages zoom dialog state locally.
 *
 * Tasks are read at interaction time via getState() rather than subscribed
 * reactively, so this component does not re-render on task changes.
 */

import { useState, useCallback } from "react";
import { Minus, Plus, ArrowsOutLineHorizontal } from "@phosphor-icons/react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";
import {
  computeViewportCenterAnchor,
  applyScrollLeft,
} from "../../hooks/useZoom";
import { ZoomDialog } from "./ZoomDialog";

export function ZoomControls(): JSX.Element {
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);

  const zoom = useChartStore((state) => state.zoom);
  const setZoom = useChartStore((state) => state.setZoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const fitToView = useChartStore((state) => state.fitToView);

  const zoomPercentage = Math.round(zoom * 100);
  const isAtMinZoom = zoom <= MIN_ZOOM;
  const isAtMaxZoom = zoom >= MAX_ZOOM;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newZoom = parseInt(e.target.value, 10) / 100;
    const anchor = computeViewportCenterAnchor();
    const result = setZoom(newZoom, anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleZoomIn = (): void => {
    const anchor = computeViewportCenterAnchor();
    const result = zoomIn(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleZoomOut = (): void => {
    const anchor = computeViewportCenterAnchor();
    const result = zoomOut(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleFitToView = (): void => {
    fitToView(useTaskStore.getState().tasks);
  };

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
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={isAtMinZoom}
          className="p-0.5 text-neutral-500 hover:text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom out"
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
        />

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={isAtMaxZoom}
          className="p-0.5 text-neutral-500 hover:text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom in"
        >
          <Plus size={16} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handleOpenZoomDialog}
          className="min-w-[44px] text-right text-neutral-600 hover:text-neutral-800 hover:underline cursor-pointer transition-colors"
          aria-label="Open zoom dialog"
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
}
