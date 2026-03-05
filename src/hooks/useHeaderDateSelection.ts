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
import { useChartStore } from "../store/slices/chartSlice";
import type {
  ContextMenuPosition,
  ContextMenuItem,
} from "../components/ContextMenu/ContextMenu";
import { CONTEXT_MENU } from "../styles/design-tokens";
import { clientToSvgCoords } from "../utils/svgCoords";

/** Minimum pixel width for a selection to be rendered (ignores single-click without drag) */
const MIN_SELECTION_WIDTH_PX = 2;

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

/** Ensure startDate <= endDate */
export function normalizeSelection(
  dateA: string,
  dateB: string
): HeaderDateSelection {
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

  // Keep latest scale in a ref so mouse-event handlers remain stable across
  // scale changes (prevents orphaned event listeners when scale updates during drag).
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Keep latest selection in a ref so ESC / click-outside handlers are stable
  // and don't re-register on every drag-frame (selection changes on every mousemove).
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

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
  // Reads selection via selectionRef so the listener is registered once on
  // mount rather than re-registered on every drag-frame.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && selectionRef.current) {
        setSelection(null);
        setContextMenu(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // selectionRef is always current — no selection dep needed

  // --- Clear selection on click outside header ---
  // Always-on listener guarded by selectionRef so it doesn't re-register on
  // every drag-frame. setTimeout(0) avoids reacting to the same mousedown
  // that started the drag.
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent): void => {
      if (!selectionRef.current) return;
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
  }, [headerSvgRef]); // selectionRef is always current — no selection dep needed; headerSvgRef is a stable RefObject

  // --- Mouse move during drag ---
  // Deps are empty because all values are read through stable refs:
  // scaleRef (updated every render), headerSvgRef (stable RefObject),
  // isDraggingRef and dragStartDateRef (internal stable refs).
  // This ensures the same function reference is registered/unregistered
  // even if scale changes mid-drag, preventing orphaned listeners.
  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!isDraggingRef.current || !scaleRef.current) return;
      const svg = headerSvgRef.current;
      if (!svg) return;
      const { x: svgX } = clientToSvgCoords(e.clientX, e.clientY, svg);
      const currentDate = pixelToDate(svgX, scaleRef.current);
      const startDate = dragStartDateRef.current;
      if (!startDate) return;
      setSelection(normalizeSelection(startDate, currentDate));
    },
    [headerSvgRef]
  ); // headerSvgRef is a stable RefObject; scale read via scaleRef

  // --- Mouse up: end drag ---
  const handleMouseUp = useCallback((): void => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]); // handleMouseMove is stable, so this is stable too

  // Cleanup on unmount — both handlers are stable so this runs exactly once.
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --- Mouse down on header SVG ---
  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      // Only left click
      if (e.button !== 0 || !scaleRef.current) return;

      const svg = headerSvgRef.current;
      if (!svg) return;

      const { x: svgX } = clientToSvgCoords(e.clientX, e.clientY, svg);
      const clickDate = pixelToDate(svgX, scaleRef.current);

      // Close any open context menu
      setContextMenu(null);

      // Shift+click: extend existing selection (read via ref — no dep on selection state)
      const currentSelection = selectionRef.current;
      if (e.shiftKey && currentSelection) {
        const extendedStart =
          clickDate < currentSelection.startDate
            ? clickDate
            : currentSelection.startDate;
        const extendedEnd =
          clickDate > currentSelection.endDate
            ? clickDate
            : currentSelection.endDate;
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
    [handleMouseMove, handleMouseUp, headerSvgRef] // selectionRef is always current — no selection dep
  );

  // --- Right-click on header SVG ---
  const onContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      e.preventDefault();

      const currentSelection = selectionRef.current;
      if (!currentSelection || !scaleRef.current) return;

      const svg = headerSvgRef.current;
      if (!svg) return;

      const { x: svgX } = clientToSvgCoords(e.clientX, e.clientY, svg);
      const clickDate = pixelToDate(svgX, scaleRef.current);

      // Only show context menu if right-click is within the selection
      if (
        clickDate >= currentSelection.startDate &&
        clickDate <= currentSelection.endDate
      ) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      } else {
        // Right-click outside selection: clear it
        setSelection(null);
        setContextMenu(null);
      }
    },
    [headerSvgRef] // selectionRef + scaleRef are always current — no state deps
  );

  // --- Close context menu ---
  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  // --- Context menu items ---
  // onClick reads selection via selectionRef so this memo only recomputes when
  // the context menu opens/closes, not on every drag-frame selection change.
  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    return [
      {
        id: "zoomToSelection",
        label: "Zoom to Selection",
        icon: createElement(MagnifyingGlassPlus, {
          size: CONTEXT_MENU.iconSize,
          weight: CONTEXT_MENU.iconWeight,
        }),
        onClick: (): void => {
          const sel = selectionRef.current;
          if (sel) {
            zoomToDateRange(sel.startDate, sel.endDate);
          }
          setSelection(null);
          setContextMenu(null);
        },
      },
    ];
  }, [contextMenu, zoomToDateRange]); // selectionRef is always current — no selection dep

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
