/**
 * DependencyPropertiesPanel - Floating panel for editing dependency properties.
 * Appears when a dependency arrow is selected (clicked).
 * Allows changing type (FS/SS/FF/SF), editing lag, and deleting the dependency.
 */

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dependency, DependencyType } from "@/types/dependency.types";
import { DEPENDENCY_TYPES } from "@/types/dependency.types";
import { Button } from "@/components/common/Button";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/common/Input";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/common/SegmentedControl";
import { Z_INDEX } from "@/styles/design-tokens";

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
  fromTaskName: string;
  toTaskName: string;
  /** Screen-space position (clientX/clientY from the click event). */
  position: { x: number; y: number };
  onUpdateType: (type: DependencyType) => void;
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
    fromTaskName,
    toTaskName,
    position,
    onUpdateType,
    onUpdateLag,
    onDelete,
    onClose,
  }: DependencyPropertiesPanelProps): JSX.Element {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Instance-unique ID prefix so multiple panels never share DOM IDs.
    const instanceId = useId();
    const lagInputId = `dep-lag-${instanceId}`;

    // Local draft state for lag input (commit on blur/Enter)
    const [lagDraft, setLagDraft] = useState(String(dependency.lag ?? 0));

    // Re-sync draft when dependency.lag changes externally (e.g. undo/redo)
    useEffect(() => {
      setLagDraft(String(dependency.lag ?? 0));
    }, [dependency.lag]);

    // --- Focus management ---
    // Save previous focus on mount, restore on unmount.
    useEffect(() => {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the panel container so keyboard events land here
      panelRef.current?.focus();
      return () => {
        previousFocusRef.current?.focus();
      };
    }, []);

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

    // --- Close on Escape ---
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCloseRef.current();
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
      const parsed = parseInt(lagDraft, 10);
      if (Number.isNaN(parsed)) {
        setLagDraft(String(dependency.lag ?? 0));
        return;
      }
      const clamped = Math.max(-MAX_LAG, Math.min(MAX_LAG, parsed));
      setLagDraft(String(clamped));
      // Skip no-op updates to avoid polluting the undo stack
      if (clamped === (dependency.lag ?? 0)) return;
      onUpdateLag(clamped);
    }, [lagDraft, dependency.lag, onUpdateLag]);

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
        tabIndex={-1}
        className="bg-white rounded-lg shadow-lg border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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

        {/* Lag input */}
        <div className="px-4 pt-2 pb-3">
          <FieldLabel htmlFor={lagInputId}>Lag</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id={lagInputId}
              type="number"
              value={lagDraft}
              onChange={(e) => setLagDraft(e.target.value)}
              onBlur={commitLag}
              onKeyDown={handleLagKeyDown}
              mono
              fullWidth={false}
              className="w-20"
            />
            <span className="text-xs text-slate-500">days</span>
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
