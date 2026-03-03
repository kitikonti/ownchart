/**
 * useExportPreview - Hook for generating live preview in export dialog.
 * Adapts captureChart logic for preview use with debouncing and memory management.
 */

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  createElement,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { toCanvas } from "html-to-image";
import type { Task } from "../types/chart.types";
import type { ExportOptions } from "../utils/export/types";
import { ExportRenderer } from "../components/Export/ExportRenderer";
import { calculateExportDimensions } from "../utils/export/exportLayout";

/** Debounce delay before triggering a new preview render */
const DEBOUNCE_MS = 300;
/** Time to wait for React to settle after root.render() before capturing */
const RENDER_SETTLE_MS = 100;
/** Pixel ratio for preview capture — intentionally reduced for performance */
const PREVIEW_PIXEL_RATIO = 1;
/** White background hex used for container background and canvas capture */
const WHITE_HEX = "#ffffff";

export interface UseExportPreviewResult {
  /** Data URL of the preview image (use with <img src={...}>) */
  previewDataUrl: string | null;
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
  await document.fonts?.ready;
}

/**
 * Wait for the next two animation frames so the DOM is fully painted.
 * Two rAF calls are needed: the first schedules after the current paint,
 * the second ensures any layout-triggered repaints have also settled.
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
 * Create the off-screen DOM wrapper and container for rendering.
 * The wrapper uses height:0 + overflow:hidden to hide content visually
 * while still allowing html-to-image to capture it (height-overflow method).
 *
 * Inline styles (cssText) are used intentionally — these elements are created
 * imperatively outside React's render tree, so Tailwind classes cannot apply.
 */
function buildRenderContainer(
  renderId: number,
  dimensions: { width: number; height: number },
  background: string
): { wrapper: HTMLDivElement; container: HTMLDivElement } {
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

  const container = document.createElement("div");
  container.id = `export-preview-container-${renderId}`;
  container.style.cssText = `
    width: ${dimensions.width}px;
    height: ${dimensions.height}px;
    overflow: hidden;
    background: ${background};
  `;
  wrapper.appendChild(container);

  return { wrapper, container };
}

/**
 * Mount the ExportRenderer into the container and wait for React to settle.
 * Returns the created React root for later cleanup.
 *
 * Two-phase wait strategy:
 *  1. setTimeout(RENDER_SETTLE_MS) — gives React time to complete its render cycle.
 *     React 18 concurrent mode can yield to the main thread, so a fixed timeout
 *     is an empirical lower bound, not a completion signal.
 *  2. waitForPaint() — double rAF ensures any layout-triggered repaints have
 *     been committed to the DOM before the caller captures the container.
 */
async function renderToContainer(
  container: HTMLDivElement,
  props: {
    tasks: Task[];
    options: ExportOptions;
    columnWidths: Record<string, number>;
    currentAppZoom: number;
    projectDateRange?: { start: Date; end: Date };
    visibleDateRange?: { start: Date; end: Date };
  }
): Promise<Root> {
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(createElement(ExportRenderer, props));
    setTimeout(resolve, RENDER_SETTLE_MS);
  });
  await waitForPaint();
  return root;
}

/**
 * Wait for fonts and paint, then capture the container to a PNG data URL.
 */
async function captureContainerToDataUrl(
  container: HTMLDivElement,
  dimensions: { width: number; height: number },
  backgroundColor: string | undefined
): Promise<string> {
  await waitForFonts();
  await waitForPaint();

  const canvas = await toCanvas(container, {
    pixelRatio: PREVIEW_PIXEL_RATIO,
    backgroundColor,
    width: dimensions.width,
    height: dimensions.height,
    style: {
      transform: "none",
      left: "0",
      top: "0",
    },
  });

  return canvas.toDataURL("image/png");
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

  const renderPreview = useCallback(async () => {
    if (!enabled || tasks.length === 0) {
      setPreviewDataUrl(null);
      setPreviewDimensions({ width: 0, height: 0 });
      return;
    }

    const renderId = ++renderIdRef.current;
    abortRef.current = false;
    setIsRendering(true);
    setError(null);
    cleanup();

    try {
      const fullDimensions = calculateExportDimensions({
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      });

      // Phase 1: Build off-screen container
      const background =
        options.background === "white" ? WHITE_HEX : "transparent";
      const { wrapper, container } = buildRenderContainer(
        renderId,
        fullDimensions,
        background
      );
      overlayRef.current = wrapper;
      containerRef.current = container;

      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Phase 2: Render React tree and wait for it to settle
      const root = await renderToContainer(container, {
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      });
      rootRef.current = root;

      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      // Phase 3: Wait for fonts/paint, then capture to data URL
      const backgroundColor =
        options.background === "white" ? WHITE_HEX : undefined;
      const dataUrl = await captureContainerToDataUrl(
        container,
        fullDimensions,
        backgroundColor
      );

      if (abortRef.current || renderId !== renderIdRef.current) {
        cleanup();
        return;
      }

      cleanup();
      setPreviewDataUrl(dataUrl);
      setPreviewDimensions(fullDimensions);
    } catch (err) {
      if (!abortRef.current && renderId === renderIdRef.current) {
        const message =
          err instanceof Error ? err.message : "Preview generation failed";
        setError(message);
        setPreviewDataUrl(null);
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

  // Memoized key capturing all options that affect visual output
  const optionsKey = useMemo(
    () => createOptionsKey(options, projectDateRange, visibleDateRange),
    [options, projectDateRange, visibleDateRange]
  );

  // Debounced render effect — re-runs when task data, options, or zoom change.
  //
  // Dual dependency path for task changes (intentional design):
  //  - tasks.length  → direct dep for task add/remove (count change)
  //  - renderPreview → indirect dep for task property edits: when any task
  //    property changes, `tasks` (in renderPreview's useCallback deps) changes,
  //    which recreates renderPreview, which triggers this effect.
  //
  // Debouncing absorbs the occasional double-trigger when both paths fire at once
  // (e.g., task count AND a property change in the same update).
  useEffect(() => {
    if (!enabled) {
      setPreviewDataUrl(null);
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
    tasks.length,
    optionsKey,
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
    previewDimensions,
    isRendering,
    error,
  };
}
