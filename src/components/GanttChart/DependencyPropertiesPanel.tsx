/**
 * DependencyPropertiesPanel - Floating panel for editing dependency properties.
 * Appears when a dependency arrow is selected (clicked).
 * Allows changing type (FS/SS/FF/SF), editing lag, and deleting the dependency.
 */

import { memo, useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { Dependency, DependencyType } from "@/types/dependency.types";
import { DEPENDENCY_TYPES } from "@/types/dependency.types";
import { Button } from "@/components/common/Button";
import { FieldLabel } from "@/components/common/FieldLabel";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/common/SegmentedControl";
import { Z_INDEX } from "@/styles/design-tokens";
import { isTextInputElement } from "@/hooks/useKeyboardShortcuts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum distance from viewport edge when clamping position. */
const VIEWPORT_EDGE_MARGIN_PX = 8;

/** Panel width in pixels. */
const PANEL_WIDTH = 260;

/** Maximum absolute lag value (days). */
const MAX_LAG = 365;

/** Dependency type full names for tooltips. */
const TYPE_LABELS: Record<DependencyType, string> = {
  FS: "Finish → Start",
  SS: "Start → Start",
  FF: "Finish → Finish",
  SF: "Start → Finish",
};

const TYPE_OPTIONS: SegmentedControlOption<DependencyType>[] =
  DEPENDENCY_TYPES.map((t) => ({ value: t, label: t }));

/** Selector for horizontal scroll container (chart timeline). */
const H_SCROLL_SELECTOR = ".gantt-chart-scroll-container";

/** Selector for vertical scroll container (outer layout). */
const V_SCROLL_SELECTOR = "[data-scroll-driver]";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DependencyPropertiesPanelProps {
  dependency: Dependency;
  /** Lag value converted to display units (working days or calendar days). */
  displayLag: number;
  /** Label for the lag unit ("days" or "working days"). */
  lagUnit: string;
  fromTaskName: string;
  toTaskName: string;
  /** Screen-space position (clientX/clientY from the click event). */
  position: { x: number; y: number };
  onUpdateType: (type: DependencyType) => void;
  /** Called with the lag in display units (working days or calendar days). */
  onUpdateLag: (lag: number) => void;
  onDelete: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DependencyPropertiesPanel = memo(
  function DependencyPropertiesPanel({
    dependency,
    displayLag,
    lagUnit,
    fromTaskName,
    toTaskName,
    position,
    onUpdateType,
    onUpdateLag,
    onDelete,
    onClose,
  }: DependencyPropertiesPanelProps): JSX.Element {
    const panelRef = useRef<HTMLDivElement>(null);
    const lagInputRef = useRef<HTMLInputElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;

    // Instance-unique ID prefix so multiple panels never share DOM IDs.
    const instanceId = useId();
    const lagInputId = `dep-lag-${instanceId}`;

    // --- Focus management ---
    // Focus the lag input on mount so keystrokes don't escape to global
    // handlers (e.g. cell navigation in the table behind the dialog).
    // Per W3C ARIA APG: do NOT make the dialog container focusable — focus
    // the first interactive element inside instead.
    useEffect(() => {
      lagInputRef.current?.focus();
    }, []);

    // Sync from store when dependency changes externally (e.g. undo/redo, type change).
    // Uses an uncontrolled input (defaultValue + ref) so React never resets
    // the DOM value during re-renders — preserving native cursor position,
    // text selection, and spinner arrow behavior.
    useEffect(() => {
      const el = lagInputRef.current;
      if (!el || el === document.activeElement) return;
      el.value = String(displayLag);
    }, [displayLag]);

    // --- Viewport clamping ---
    // Position the panel within viewport bounds (ContextMenu pattern).
    useEffect(() => {
      const el = panelRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > vw) {
        x = vw - rect.width - VIEWPORT_EDGE_MARGIN_PX;
      }
      if (y + rect.height > vh) {
        y = vh - rect.height - VIEWPORT_EDGE_MARGIN_PX;
      }

      el.style.left = `${Math.max(VIEWPORT_EDGE_MARGIN_PX, x)}px`;
      el.style.top = `${Math.max(VIEWPORT_EDGE_MARGIN_PX, y)}px`;
      el.style.visibility = "visible";
    }, [position]);

    // --- Close on outside click ---
    useEffect(() => {
      const handleMouseDown = (e: MouseEvent): void => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onCloseRef.current();
        }
      };
      // Defer to avoid the opening click closing the panel immediately.
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleMouseDown, true);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleMouseDown, true);
      };
    }, []);

    // --- Keyboard shortcuts: Escape closes, Delete/Backspace removes ---
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCloseRef.current();
          return;
        }
        // Delete/Backspace removes the dependency — but not while typing in a text field
        if (e.key === "Delete" || e.key === "Backspace") {
          if (isTextInputElement(e.target as HTMLElement)) return;
          e.preventDefault();
          e.stopPropagation();
          onDeleteRef.current();
        }
      };
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }, []);

    // --- Close on scroll (horizontal or vertical) ---
    useEffect(() => {
      const hScroll = document.querySelector(H_SCROLL_SELECTOR);
      const vScroll = document.querySelector(V_SCROLL_SELECTOR);

      const handleScroll = (): void => {
        onCloseRef.current();
      };

      hScroll?.addEventListener("scroll", handleScroll, { passive: true });
      vScroll?.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        hScroll?.removeEventListener("scroll", handleScroll);
        vScroll?.removeEventListener("scroll", handleScroll);
      };
    }, []);

    // --- Callbacks ---

    const handleTypeChange = useCallback(
      (type: DependencyType): void => {
        if (type !== dependency.type) {
          onUpdateType(type);
        }
      },
      [dependency.type, onUpdateType]
    );

    const commitLag = useCallback((): void => {
      const el = lagInputRef.current;
      if (!el) return;
      const parsed = parseInt(el.value, 10);
      if (Number.isNaN(parsed)) {
        // Revert to display value on invalid input
        el.value = String(displayLag);
        return;
      }
      const clamped = Math.max(-MAX_LAG, Math.min(MAX_LAG, parsed));
      el.value = String(clamped);
      // Skip no-op updates to avoid polluting the undo stack
      if (clamped === displayLag) return;
      // onUpdateLag receives the value in display units (working days or calendar)
      // — the bridge component converts to calendar days before storing
      onUpdateLag(clamped);
    }, [displayLag, onUpdateLag]);

    const handleLagKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitLag();
        }
      },
      [commitLag]
    );

    return createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Edit dependency"
        aria-modal="true"
        className="bg-white rounded-lg shadow-lg border border-slate-200"
        style={{
          position: "fixed",
          zIndex: Z_INDEX.popover,
          width: PANEL_WIDTH,
          visibility: "hidden",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Dependency
          </p>
          <p
            className="text-sm text-slate-800 truncate mt-0.5"
            title={`${fromTaskName} → ${toTaskName}`}
          >
            {fromTaskName} → {toTaskName}
          </p>
        </div>

        {/* Type selector */}
        <div className="px-4 pt-3 pb-2">
          <FieldLabel>Type</FieldLabel>
          <SegmentedControl<DependencyType>
            options={TYPE_OPTIONS}
            value={dependency.type}
            onChange={handleTypeChange}
            layout="inline"
            fullWidth
            ariaLabel="Dependency type"
          />
          <p className="text-xs text-slate-400 mt-1">
            {TYPE_LABELS[dependency.type]}
          </p>
        </div>

        {/* Lag input — uses a raw <input> instead of the Input wrapper.
            React's controlled input pattern (value + onChange) resets native
            DOM state (cursor, selection, spinners) on every re-render.
            An uncontrolled raw input avoids this entirely. */}
        <div className="px-4 pt-2 pb-3">
          <FieldLabel htmlFor={lagInputId}>Lag</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              ref={lagInputRef}
              id={lagInputId}
              type="number"
              defaultValue={displayLag}
              onBlur={commitLag}
              onKeyDown={handleLagKeyDown}
              className="px-3 py-2 text-sm bg-white border rounded border-slate-300 font-mono w-20 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 hover:border-slate-400"
            />
            <span className="text-xs text-slate-500">{lagUnit}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Negative = overlap (lead time)
          </p>
        </div>

        {/* Delete button */}
        <div className="px-4 pb-3 pt-1 border-t border-slate-100">
          <Button variant="danger" size="sm" fullWidth onClick={onDelete}>
            Delete Dependency
          </Button>
        </div>
      </div>,
      document.body
    );
  }
);
