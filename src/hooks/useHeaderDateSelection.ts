/**
 * useHeaderDateSelection - Drag-to-select a date range in the timeline header.
 * Right-click the selection to zoom to it via context menu.
 *
 * Selection is stored in date domain (zoom-resilient) and converted to
 * pixel coordinates for rendering via useMemo.
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  createElement,
} from "react";
import { MagnifyingGlassPlus } from "@phosphor-icons/react";
import type { TimelineScale } from "../utils/timelineUtils";
import { dateToPixel, pixelToDate } from "../utils/timelineUtils";

/** Minimum pixel width for a selection to be rendered (ignores single-click without drag) */
const MIN_SELECTION_WIDTH_PX = 2;
import { useChartStore } from "../store/slices/chartSlice";
import type { ContextMenuPosition } from "../components/ContextMenu/ContextMenu";
import type { ContextMenuItem } from "../components/ContextMenu/ContextMenu";
import { CONTEXT_MENU } from "../styles/design-tokens";

export interface HeaderDateSelection {
  startDate: string; // ISO date string
  endDate: string; // ISO date string (always >= startDate)
}

interface UseHeaderDateSelectionOptions {
  /** Ref to the header SVG element */
  headerSvgRef: React.RefObject<SVGSVGElement | null>;
  /** Current timeline scale */
  scale: TimelineScale | null;
}

interface UseHeaderDateSelectionResult {
  /** Selection pixel rect for rendering (null if no selection) */
  selectionPixelRect: { x: number; width: number } | null;
  /** Whether the user is currently dragging */
  isDragging: boolean;
  /** Context menu position (null if not shown) */
  contextMenu: ContextMenuPosition | null;
  /** Context menu items */
  contextMenuItems: ContextMenuItem[];
  /** Close the context menu */
  closeContextMenu: () => void;
  /** Mouse down handler for the header SVG */
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  /** Context menu handler for the header SVG */
  onContextMenu: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/** Convert a client X position to an SVG-local X.
 *  getBoundingClientRect() already reflects scroll position of the parent container,
 *  so no need to add scrollLeft (that would double-count). */
function clientXToSvgX(clientX: number, svgEl: SVGSVGElement): number {
  const rect = svgEl.getBoundingClientRect();
  return clientX - rect.left;
}

/** Ensure startDate <= endDate */
function normalizeSelection(dateA: string, dateB: string): HeaderDateSelection {
  return dateA <= dateB
    ? { startDate: dateA, endDate: dateB }
    : { startDate: dateB, endDate: dateA };
}

export function useHeaderDateSelection({
  headerSvgRef,
  scale,
}: UseHeaderDateSelectionOptions): UseHeaderDateSelectionResult {
  const [selection, setSelection] = useState<HeaderDateSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null
  );

  const isDraggingRef = useRef(false);
  const dragStartDateRef = useRef<string | null>(null);

  const zoomToDateRange = useChartStore((state) => state.zoomToDateRange);

  // --- Pixel rect derived from date selection and current scale ---
  const selectionPixelRect = useMemo(() => {
    if (!selection || !scale) return null;
    const x = dateToPixel(selection.startDate, scale);
    const xEnd = dateToPixel(selection.endDate, scale);
    const width = xEnd - x;
    // Don't render if width is too small (single-click without drag)
    if (width < MIN_SELECTION_WIDTH_PX) return null;
    return { x, width };
  }, [selection, scale]);

  // --- Clear selection on ESC ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && selection) {
        setSelection(null);
        setContextMenu(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selection]);

  // --- Clear selection on click outside header ---
  useEffect(() => {
    if (!selection) return;

    const handleMouseDown = (e: MouseEvent): void => {
      const svg = headerSvgRef.current;
      // If clicking inside the header SVG or inside a context menu, don't clear
      if (svg && svg.contains(e.target as Node)) return;
      if ((e.target as Element).closest(".context-menu-container")) return;
      setSelection(null);
      setContextMenu(null);
    };

    // Delay to avoid clearing on the same click that created the selection
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [selection, headerSvgRef]);

  // --- Mouse move during drag ---
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !scale) return;
      const svg = headerSvgRef.current;
      if (!svg) return;

      const svgX = clientXToSvgX(e.clientX, svg);
      const currentDate = pixelToDate(svgX, scale);
      const startDate = dragStartDateRef.current;
      if (!startDate) return;

      setSelection(normalizeSelection(startDate, currentDate));
    },
    [scale, headerSvgRef]
  );

  // --- Mouse up: end drag ---
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --- Mouse down on header SVG ---
  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Only left click
      if (e.button !== 0 || !scale) return;

      const svg = headerSvgRef.current;
      if (!svg) return;

      const svgX = clientXToSvgX(e.clientX, svg);
      const clickDate = pixelToDate(svgX, scale);

      // Close any open context menu
      setContextMenu(null);

      // Shift+click: extend existing selection
      if (e.shiftKey && selection) {
        // Extend to whichever side the click is on
        const extendedStart =
          clickDate < selection.startDate ? clickDate : selection.startDate;
        const extendedEnd =
          clickDate > selection.endDate ? clickDate : selection.endDate;
        setSelection({ startDate: extendedStart, endDate: extendedEnd });
        e.preventDefault();
        return;
      }

      // Start new drag
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartDateRef.current = clickDate;
      setSelection({ startDate: clickDate, endDate: clickDate });

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
    },
    [scale, selection, headerSvgRef, handleMouseMove, handleMouseUp]
  );

  // --- Right-click on header SVG ---
  const onContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();

      if (!selection || !scale) return;

      const svg = headerSvgRef.current;
      if (!svg) return;

      const svgX = clientXToSvgX(e.clientX, svg);
      const clickDate = pixelToDate(svgX, scale);

      // Only show context menu if right-click is within the selection
      if (clickDate >= selection.startDate && clickDate <= selection.endDate) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      } else {
        // Right-click outside selection: clear it
        setSelection(null);
        setContextMenu(null);
      }
    },
    [selection, scale, headerSvgRef]
  );

  // --- Close context menu ---
  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  // --- Context menu items ---
  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu || !selection) return [];

    return [
      {
        id: "zoomToSelection",
        label: "Zoom to Selection",
        icon: createElement(MagnifyingGlassPlus, {
          size: CONTEXT_MENU.iconSize,
          weight: CONTEXT_MENU.iconWeight,
        }),
        onClick: (): void => {
          zoomToDateRange(selection.startDate, selection.endDate);
          setSelection(null);
          setContextMenu(null);
        },
      },
    ];
  }, [contextMenu, selection, zoomToDateRange]);

  return {
    selectionPixelRect,
    isDragging,
    contextMenu,
    contextMenuItems,
    closeContextMenu,
    onMouseDown,
    onContextMenu,
  };
}
