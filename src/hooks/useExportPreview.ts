/**
 * useExportPreview - Hook for generating live preview in export dialog.
 * Adapts captureChart logic for preview use with debouncing and memory management.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { toCanvas } from "html-to-image";
import type { Task } from "../types/chart.types";
import type { ExportOptions } from "../utils/export/types";
import { ExportRenderer } from "../components/Export/ExportRenderer";
import { calculateExportDimensions } from "../utils/export/exportLayout";

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 300;

export interface UseExportPreviewResult {
  /** Data URL of the preview image (use with <img src={...}>) */
  previewDataUrl: string | null;
  /** @deprecated Use previewDataUrl instead */
  previewCanvas: HTMLCanvasElement | null;
  previewDimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
}

export interface UseExportPreviewParams {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
  enabled?: boolean;
}

/**
 * Wait for all fonts to be loaded.
 */
async function waitForFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

/**
 * Wait for next animation frame (ensures DOM is painted).
 */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

/**
 * Create a stable key for debouncing based on options.
 * Only includes options that affect the visual output.
 */
function createOptionsKey(
  options: ExportOptions,
  projectDateRange?: { start: Date; end: Date },
  visibleDateRange?: { start: Date; end: Date }
): string {
  return JSON.stringify({
    zoomMode: options.zoomMode,
    timelineZoom: options.timelineZoom,
    fitToWidth: options.fitToWidth,
    background: options.background,
    includeGridLines: options.includeGridLines,
    includeWeekends: options.includeWeekends,
    includeHolidays: options.includeHolidays,
    includeTodayMarker: options.includeTodayMarker,
    includeDependencies: options.includeDependencies,
    selectedColumns: options.selectedColumns,
    taskLabelPosition: options.taskLabelPosition,
    density: options.density,
    dateRangeMode: options.dateRangeMode,
    customDateStart: options.customDateStart,
    customDateEnd: options.customDateEnd,
    projectDateRange: projectDateRange
      ? {
          start: projectDateRange.start.toISOString(),
          end: projectDateRange.end.toISOString(),
        }
      : null,
    visibleDateRange: visibleDateRange
      ? {
          start: visibleDateRange.start.toISOString(),
          end: visibleDateRange.end.toISOString(),
        }
      : null,
  });
}

/**
 * Hook for generating live export preview with debouncing and memory management.
 */
export function useExportPreview({
  tasks,
  options,
  columnWidths,
  currentAppZoom,
  projectDateRange,
  visibleDateRange,
  enabled = true,
}: UseExportPreviewParams): UseExportPreviewResult {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(
    null
  );
  const [previewDimensions, setPreviewDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track current render for cleanup
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const abortRef = useRef(false);
  const renderIdRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (rootRef.current) {
      try {
        rootRef.current.unmount();
      } catch {
        // Ignore unmount errors
      }
      rootRef.current = null;
    }
    if (containerRef.current && containerRef.current.parentNode) {
      containerRef.current.parentNode.removeChild(containerRef.current);
      containerRef.current = null;
    }
    if (overlayRef.current && overlayRef.current.parentNode) {
      overlayRef.current.parentNode.removeChild(overlayRef.current);
      overlayRef.current = null;
    }
  }, []);

  // Render preview
  const renderPreview = useCallback(async () => {
    if (!enabled || tasks.length === 0) {
      setPreviewDataUrl(null);
      setPreviewCanvas(null);
      setPreviewDimensions({ width: 0, height: 0 });
      return;
    }

    const renderId = ++renderIdRef.current;
    abortRef.current = false;
    setIsRendering(true);
    setError(null);

    // Cleanup previous render
    cleanup();

    try {
      // Calculate full dimensions
      const fullDimensions = calculateExportDimensions({
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      });

      // Create wrapper with height:0 + overflow:hidden to hide content visually
      // while still allowing html-to-image to capture it (height-overflow method)
      const wrapper = document.createElement("div");
      wrapper.id = `export-preview-wrapper-${renderId}`;
      wrapper.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
      `;
      document.body.appendChild(wrapper);
      overlayRef.current = wrapper; // reuse overlayRef for wrapper cleanup

      // Create container inside wrapper - it renders but wrapper hides it
      const container = document.createElement("div");
      container.id = `export-preview-container-${renderId}`;
      container.style.cssText = `
        width: ${fullDimensions.width}px;
        height: ${fullDimensions.height}px;
        overflow: hidden;
        background: ${options.background === "white" ? "#ffffff" : "transparent"};
      `;
      wrapper.appendChild(container);
      containerRef.current = container;

      // Check if aborted
      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Create React root and render
      const root = createRoot(container);
      rootRef.current = root;

      await new Promise<void>((resolve) => {
        root.render(
          createElement(ExportRenderer, {
            tasks,
            options,
            columnWidths,
            currentAppZoom,
            projectDateRange,
            visibleDateRange,
          })
        );
        setTimeout(resolve, 100);
      });

      // Check if aborted
      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Wait for fonts and paint
      await waitForFonts();
      await waitForPaint();

      // Check if aborted
      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Capture to canvas at reduced resolution for preview
      const canvas = await toCanvas(container, {
        // Reduced pixel ratio for preview performance
        pixelRatio: 1,
        backgroundColor: options.background === "white" ? "#ffffff" : undefined,
        width: fullDimensions.width,
        height: fullDimensions.height,
        style: {
          transform: "none",
          left: "0",
          top: "0",
        },
      });

      // Check if aborted
      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Cleanup
      cleanup();

      // Convert canvas to data URL for flash-free display
      const dataUrl = canvas.toDataURL("image/png");

      // Update state with the data URL, canvas, and full dimensions
      setPreviewDataUrl(dataUrl);
      setPreviewCanvas(canvas);
      setPreviewDimensions(fullDimensions);
    } catch (err) {
      if (!abortRef.current && renderId === renderIdRef.current) {
        const message =
          err instanceof Error ? err.message : "Preview generation failed";
        setError(message);
        setPreviewDataUrl(null);
        setPreviewCanvas(null);
      }
      cleanup();
    } finally {
      if (renderId === renderIdRef.current) {
        setIsRendering(false);
      }
    }
  }, [
    enabled,
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    cleanup,
  ]);

  // Create options key for debouncing
  const optionsKey = createOptionsKey(
    options,
    projectDateRange,
    visibleDateRange
  );

  // Debounced render effect
  useEffect(() => {
    if (!enabled) {
      setPreviewDataUrl(null);
      setPreviewCanvas(null);
      setPreviewDimensions({ width: 0, height: 0 });
      return;
    }

    const timer = setTimeout(() => {
      renderPreview();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current = true;
    };
  }, [
    enabled,
    tasks.length, // Re-render when task count changes
    optionsKey, // Re-render when options change
    currentAppZoom,
    renderPreview,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    previewDataUrl,
    previewCanvas,
    previewDimensions,
    isRendering,
    error,
  };
}
