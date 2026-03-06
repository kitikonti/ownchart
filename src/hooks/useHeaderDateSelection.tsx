/**
 * useHeaderDateSelection - Drag-to-select a date range in the timeline header.
 * Right-click the selection to zoom to it via context menu.
 *
 * Selection is stored in date domain (zoom-resilient) and converted to
 * pixel coordinates for rendering via useMemo.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { MagnifyingGlassPlus } from "@phosphor-icons/react";
import type { TimelineScale } from "../utils/timelineUtils";
import { dateToPixel, pixelToDate } from "../utils/timelineUtils";
import { useChartStore } from "../store/slices/chartSlice";
import type {
  ContextMenuPosition,
  ContextMenuItem,
} from "../components/ContextMenu/ContextMenu";
import { CONTEXT_MENU_CONTAINER_CLASS } from "../components/ContextMenu/ContextMenu";
import { CONTEXT_MENU } from "../styles/design-tokens";
import { clientToSvgCoords } from "../utils/svgCoords";

/** Minimum pixel width for a selection to be rendered (ignores single-click without drag) */
const MIN_SELECTION_WIDTH_PX = 2;

/** Next-tick deferral before activating the click-outside listener to avoid
 * reacting to the opening click (not a user-perceptible delay). */
const DEFER_LISTENER_MS = 0;

/** Left mouse button identifier */
const LEFT_MOUSE_BUTTON = 0;

export interface HeaderDateSelection {
  startDate: string; // ISO date string
  endDate: string; // ISO date string (always >= startDate)
}

export interface UseHeaderDateSelectionOptions {
  /** Ref to the header SVG element */
  headerSvgRef: React.RefObject<SVGSVGElement | null>;
  /** Current timeline scale */
  scale: TimelineScale | null;
}

export interface UseHeaderDateSelectionResult {
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

/** Extend the current selection to include a new click date without shrinking it. */
function computeExtendedSelection(
  clickDate: string,
  current: HeaderDateSelection
): HeaderDateSelection {
  return {
    startDate: clickDate < current.startDate ? clickDate : current.startDate,
    endDate: clickDate > current.endDate ? clickDate : current.endDate,
  };
}

/** Build the "Zoom to Selection" context menu item list for the header. */
function buildZoomContextMenuItems(
  selectionRef: { current: HeaderDateSelection | null },
  zoomToDateRange: (startDate: string, endDate: string) => void,
  clearSelection: () => void
): ContextMenuItem[] {
  return [
    {
      id: "zoomToSelection",
      label: "Zoom to Selection",
      icon: (
        <MagnifyingGlassPlus
          size={CONTEXT_MENU.iconSize}
          weight={CONTEXT_MENU.iconWeight}
        />
      ),
      onClick: (): void => {
        const sel = selectionRef.current;
        if (sel) {
          zoomToDateRange(sel.startDate, sel.endDate);
        }
        clearSelection();
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Module-level helpers extracted from sub-hooks (pure logic, no React state)
// ---------------------------------------------------------------------------

/** All state/refs needed to handle a header mousedown event. */
interface HeaderMouseDownContext {
  scaleRef: { current: TimelineScale | null };
  headerSvgRef: { current: SVGSVGElement | null };
  selectionRef: { current: HeaderDateSelection | null };
  isDraggingRef: { current: boolean };
  dragStartDateRef: { current: string | null };
  setIsDragging: (v: boolean) => void;
  setSelection: (v: HeaderDateSelection | null) => void;
  setContextMenu: (v: ContextMenuPosition | null) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
}

/** Pure handler extracted from useHeaderDrag.onMouseDown to keep the hook
 * body under the 50-line limit without losing any logic. */
function performHeaderMouseDown(
  e: React.MouseEvent<SVGSVGElement>,
  ctx: HeaderMouseDownContext
): void {
  if (e.button !== LEFT_MOUSE_BUTTON || !ctx.scaleRef.current) return;
  const svg = ctx.headerSvgRef.current;
  if (!svg) return;

  const { x: svgX } = clientToSvgCoords(e.clientX, e.clientY, svg);
  const clickDate = pixelToDate(svgX, ctx.scaleRef.current);

  // Close any open context menu
  ctx.setContextMenu(null);

  // Shift+click: extend existing selection (read via ref — no dep on selection state)
  const currentSelection = ctx.selectionRef.current;
  if (e.shiftKey && currentSelection) {
    ctx.setSelection(computeExtendedSelection(clickDate, currentSelection));
    e.preventDefault();
    return;
  }

  // Start new drag
  ctx.isDraggingRef.current = true;
  ctx.setIsDragging(true);
  ctx.dragStartDateRef.current = clickDate;
  ctx.setSelection({ startDate: clickDate, endDate: clickDate });
  document.addEventListener("mousemove", ctx.handleMouseMove);
  // { once: true } auto-removes the handler after the first mouseup fires,
  // so handleMouseUp never needs to reference its own identity to unregister.
  document.addEventListener("mouseup", ctx.handleMouseUp, { once: true });
  e.preventDefault();
}

/** All state/refs needed to handle a header context-menu event. */
interface HeaderContextMenuContext {
  headerSvgRef: { current: SVGSVGElement | null };
  scaleRef: { current: TimelineScale | null };
  selectionRef: { current: HeaderDateSelection | null };
  setContextMenu: (v: ContextMenuPosition | null) => void;
  clearSelection: () => void;
}

/** Pure handler extracted from useHeaderContextMenu.onContextMenu to keep
 * the hook body under the 50-line limit without losing any logic. */
function performContextMenuAction(
  e: React.MouseEvent<SVGSVGElement>,
  ctx: HeaderContextMenuContext
): void {
  e.preventDefault();

  const currentSelection = ctx.selectionRef.current;
  if (!currentSelection || !ctx.scaleRef.current) return;

  const svg = ctx.headerSvgRef.current;
  if (!svg) return;

  const { x: svgX } = clientToSvgCoords(e.clientX, e.clientY, svg);
  const clickDate = pixelToDate(svgX, ctx.scaleRef.current);

  // Only show context menu if right-click is within the selection
  if (
    clickDate >= currentSelection.startDate &&
    clickDate <= currentSelection.endDate
  ) {
    ctx.setContextMenu({ x: e.clientX, y: e.clientY });
  } else {
    // Right-click outside selection: clear it
    ctx.clearSelection();
  }
}

// ---------------------------------------------------------------------------
// Private sub-hooks (not exported — used only by useHeaderDateSelection)
// ---------------------------------------------------------------------------

/** Clears selection on Escape. Reads current selection via ref so the listener
 * is registered once on mount, not re-registered on every drag-frame. */
function useClearSelectionOnEscape(
  selectionRef: { current: HeaderDateSelection | null },
  clearSelection: () => void
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && selectionRef.current) {
        clearSelection();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection]); // selectionRef is always current — no selection dep needed
}

/** Clears selection when the user clicks outside the header SVG or context menu.
 * Defers listener registration by one tick so it isn't triggered by the same
 * click that started the drag. */
function useClearSelectionOnClickOutside(
  selectionRef: { current: HeaderDateSelection | null },
  headerSvgRef: { current: SVGSVGElement | null },
  clearSelection: () => void
): void {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent): void => {
      if (!selectionRef.current) return;
      const svg = headerSvgRef.current;
      // If clicking inside the header SVG or inside a context menu, don't clear
      if (svg && svg.contains(e.target as Node)) return;
      if ((e.target as Element).closest(`.${CONTEXT_MENU_CONTAINER_CLASS}`))
        return;
      clearSelection();
    };

    // Defer to avoid clearing on the same click that created the selection
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, DEFER_LISTENER_MS);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [headerSvgRef, clearSelection]); // selectionRef is always current — no selection dep needed
}

/** Stable mousemove/mouseup handlers + cleanup for a header drag session. */
function useMouseDragListeners(
  isDraggingRef: { current: boolean },
  scaleRef: { current: TimelineScale | null },
  headerSvgRef: { current: SVGSVGElement | null },
  dragStartDateRef: { current: string | null },
  setSelection: (v: HeaderDateSelection | null) => void,
  setIsDragging: (v: boolean) => void
): { handleMouseMove: (e: MouseEvent) => void; handleMouseUp: () => void } {
  // Mouse move during drag — reads scale/position via stable refs so
  // this function reference survives scale changes without re-registration.
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
    [headerSvgRef, scaleRef, setSelection]
  );

  // Mouse up: end drag. The mouseup listener is registered with { once: true }
  // so it auto-removes after firing — no self-reference needed here.
  const handleMouseUp = useCallback((): void => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, setIsDragging]);

  // Cleanup on unmount — both handlers are stable so this runs exactly once.
  // removeEventListener is a no-op if the { once: true } mouseup has already
  // auto-removed itself.
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { handleMouseMove, handleMouseUp };
}

/** Encapsulates the three pieces of mutable drag state so useHeaderDrag stays
 * focused on handler wiring without repeating the ref/state boilerplate. */
function useDragStateRefs(): {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  isDraggingRef: { current: boolean };
  dragStartDateRef: { current: string | null };
} {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartDateRef = useRef<string | null>(null);
  return { isDragging, setIsDragging, isDraggingRef, dragStartDateRef };
}

/** Stable onMouseDown callback for header SVG drag. Extracted from useHeaderDrag
 * to keep both hooks under the 50-line limit. All params are stable refs or callbacks. */
function useHeaderMouseDown(
  ctx: HeaderMouseDownContext
): (e: React.MouseEvent<SVGSVGElement>) => void {
  // Destructure only to give React individual stable values for the dep array.
  // isDraggingRef, dragStartDateRef, setIsDragging come from useDragStateRefs —
  // ESLint can't infer their stability, so listed explicitly; identities never change.
  const {
    handleMouseMove,
    handleMouseUp,
    headerSvgRef,
    scaleRef,
    selectionRef,
    setSelection,
    setContextMenu,
    isDraggingRef,
    dragStartDateRef,
    setIsDragging,
  } = ctx;
  return useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void =>
      performHeaderMouseDown(e, {
        scaleRef,
        headerSvgRef,
        selectionRef,
        isDraggingRef,
        dragStartDateRef,
        setIsDragging,
        setSelection,
        setContextMenu,
        handleMouseMove,
        handleMouseUp,
      }),
    [
      handleMouseMove,
      handleMouseUp,
      headerSvgRef,
      scaleRef,
      selectionRef,
      setSelection,
      setContextMenu,
      isDraggingRef,
      dragStartDateRef,
      setIsDragging,
    ]
  );
}

/** Manages drag state and handlers: isDragging, onMouseDown, mouse-move/up listeners. */
function useHeaderDrag(
  headerSvgRef: { current: SVGSVGElement | null },
  scaleRef: { current: TimelineScale | null },
  selectionRef: { current: HeaderDateSelection | null },
  setSelection: (value: HeaderDateSelection | null) => void,
  setContextMenu: (value: ContextMenuPosition | null) => void
): {
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
} {
  const { isDragging, setIsDragging, isDraggingRef, dragStartDateRef } =
    useDragStateRefs();

  const { handleMouseMove, handleMouseUp } = useMouseDragListeners(
    isDraggingRef,
    scaleRef,
    headerSvgRef,
    dragStartDateRef,
    setSelection,
    setIsDragging
  );

  const onMouseDown = useHeaderMouseDown({
    headerSvgRef,
    scaleRef,
    selectionRef,
    isDraggingRef,
    dragStartDateRef,
    setIsDragging,
    setSelection,
    setContextMenu,
    handleMouseMove,
    handleMouseUp,
  });

  return { isDragging, onMouseDown };
}

/** Manages context menu handlers and items: onContextMenu, closeContextMenu, contextMenuItems. */
function useHeaderContextMenu(
  headerSvgRef: { current: SVGSVGElement | null },
  scaleRef: { current: TimelineScale | null },
  selectionRef: { current: HeaderDateSelection | null },
  zoomToDateRange: (startDate: string, endDate: string) => void,
  contextMenu: ContextMenuPosition | null,
  setContextMenu: (value: ContextMenuPosition | null) => void,
  clearSelection: () => void
): {
  contextMenuItems: ContextMenuItem[];
  closeContextMenu: () => void;
  onContextMenu: (e: React.MouseEvent<SVGSVGElement>) => void;
} {
  // Right-click on header SVG — delegates to the module-level pure helper.
  const onContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      performContextMenuAction(e, {
        headerSvgRef,
        scaleRef,
        selectionRef,
        setContextMenu,
        clearSelection,
      });
    },
    [headerSvgRef, scaleRef, selectionRef, setContextMenu, clearSelection]
  );

  // Close context menu
  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, [setContextMenu]);

  // Context menu items — recomputes only when the menu opens/closes; onClick
  // reads selection via selectionRef so there is no dependency on drag-frame
  // selection changes.
  const contextMenuItems = useMemo(
    (): ContextMenuItem[] =>
      contextMenu
        ? buildZoomContextMenuItems(
            selectionRef,
            zoomToDateRange,
            clearSelection
          )
        : [],
    [contextMenu, selectionRef, zoomToDateRange, clearSelection]
  );

  return { contextMenuItems, closeContextMenu, onContextMenu };
}

/** Derives the selection pixel rect from the date selection and current scale.
 * Returns null when there is no selection or the width is below the minimum. */
function useSelectionPixelRect(
  selection: HeaderDateSelection | null,
  scale: TimelineScale | null
): { x: number; width: number } | null {
  return useMemo(() => {
    if (!selection || !scale) return null;
    const x = dateToPixel(selection.startDate, scale);
    const xEnd = dateToPixel(selection.endDate, scale);
    const width = xEnd - x;
    // Don't render if width is too small (single-click without drag)
    if (width < MIN_SELECTION_WIDTH_PX) return null;
    return { x, width };
  }, [selection, scale]);
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

/** Owns the date selection and context-menu state, the scale/selection refs,
 * the clearSelection callback, and the two dismissal side-effects (Escape and
 * click-outside).  Extracted from the main hook to keep it under 50 lines. */
function useSelectionManager(
  scale: TimelineScale | null,
  headerSvgRef: { current: SVGSVGElement | null }
): {
  selection: HeaderDateSelection | null;
  setSelection: (v: HeaderDateSelection | null) => void;
  selectionRef: { current: HeaderDateSelection | null };
  contextMenu: ContextMenuPosition | null;
  setContextMenu: (v: ContextMenuPosition | null) => void;
  scaleRef: { current: TimelineScale | null };
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<HeaderDateSelection | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null
  );

  // Keep latest scale in a ref so mouse-event handlers remain stable across
  // scale changes (prevents orphaned event listeners when scale updates during drag).
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Keep latest selection in a ref so ESC / click-outside handlers are stable
  // and don't re-register on every drag-frame (selection changes on every mousemove).
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Single helper that clears both selection and context menu
  const clearSelection = useCallback((): void => {
    setSelection(null);
    setContextMenu(null);
  }, []);

  useClearSelectionOnEscape(selectionRef, clearSelection);
  useClearSelectionOnClickOutside(selectionRef, headerSvgRef, clearSelection);

  return {
    selection,
    setSelection,
    selectionRef,
    contextMenu,
    setContextMenu,
    scaleRef,
    clearSelection,
  };
}

export function useHeaderDateSelection({
  headerSvgRef,
  scale,
}: UseHeaderDateSelectionOptions): UseHeaderDateSelectionResult {
  const {
    selection,
    setSelection,
    selectionRef,
    contextMenu,
    setContextMenu,
    scaleRef,
    clearSelection,
  } = useSelectionManager(scale, headerSvgRef);

  const zoomToDateRange = useChartStore((state) => state.zoomToDateRange);

  const { isDragging, onMouseDown } = useHeaderDrag(
    headerSvgRef,
    scaleRef,
    selectionRef,
    setSelection,
    setContextMenu
  );

  const { contextMenuItems, closeContextMenu, onContextMenu } =
    useHeaderContextMenu(
      headerSvgRef,
      scaleRef,
      selectionRef,
      zoomToDateRange,
      contextMenu,
      setContextMenu,
      clearSelection
    );

  const selectionPixelRect = useSelectionPixelRect(selection, scale);

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
