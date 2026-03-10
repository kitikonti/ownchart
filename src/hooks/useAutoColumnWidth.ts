/**
 * Hook for automatic column width adjustment.
 * Triggers autoFitAllColumns when:
 * - UI density changes
 * - Task cell values change
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useUserPreferencesStore } from "../store/slices/userPreferencesSlice";

/**
 * Hook that automatically adjusts column widths when relevant changes occur.
 * Uses a fingerprint of task data to detect content changes efficiently.
 * Waits for fonts to load before measuring to ensure accurate widths.
 */
export function useAutoColumnWidth(): void {
  const uiDensity = useUserPreferencesStore(
    (state) => state.preferences.uiDensity
  );
  const tasks = useTaskStore((state) => state.tasks);
  const autoFitAllColumns = useTaskStore((state) => state.autoFitAllColumns);

  // Track if this is the initial render to avoid double-fitting on mount
  const isInitialRender = useRef(true);

  // Track if fonts are loaded for accurate text measurement.
  // Dual tracking (state + ref) is intentional:
  //   - `fontsReady` state: drives the task-data effect so it re-runs once fonts
  //     become available (ensuring a pending auto-fit fires after font load).
  //   - `fontsReadyRef`: read by `runAutoFitIfReady` via stable closure so that
  //     the uiDensity effect does NOT re-fire merely because fontsReady flipped.
  // See the comment above the task-data effect for the full asymmetry rationale.
  const [fontsReady, setFontsReady] = useState(false);
  const fontsReadyRef = useRef(false);

  // Wait for fonts to load before allowing auto-fit.
  // Gracefully handles environments where FontFaceSet is unavailable or rejects.
  useEffect(() => {
    const markReady = (): void => {
      fontsReadyRef.current = true;
      setFontsReady(true);
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(markReady).catch(() => {
        // Fallback: proceed without waiting when the promise rejects
        // (e.g. certain browser configurations or test environments)
        markReady();
      });
    } else {
      // In test environment or unsupported browsers, proceed immediately
      markReady();
    }
  }, []);

  // Create a fingerprint of task data that affects column widths.
  // Only include fields that are currently displayed in table columns —
  // this is intentional: adding future columns here keeps auto-fit accurate.
  // If a new column is added (e.g. assignedTo), add its field to this fingerprint.
  const taskFingerprint = useMemo(
    () =>
      tasks
        .map(
          (t) =>
            `${t.id}|${t.name}|${t.startDate}|${t.endDate}|${t.duration}|${t.progress}|${t.type}|${t.parent ?? ""}`
        )
        .join(","),
    [tasks]
  );

  /**
   * Run auto-fit when fonts are ready and this is not the initial render.
   * Reads fontsReady via a ref so this callback stays stable — changing
   * fontsReady must not cause the uiDensity effect to re-fire unnecessarily.
   */
  const runAutoFitIfReady = useCallback(() => {
    if (isInitialRender.current) return;
    if (!fontsReadyRef.current) return;
    autoFitAllColumns();
  }, [autoFitAllColumns]);

  // Auto-fit on density change
  useEffect(() => {
    runAutoFitIfReady();
  }, [uiDensity, runAutoFitIfReady]);

  // Auto-fit on task data change.
  // Also responsible for flipping the initial-render flag so that the density
  // effect (above) correctly skips the very first render too.
  //
  // Note: this effect uses `fontsReady` state (not `fontsReadyRef`) deliberately.
  // When fonts finish loading, `fontsReady` becomes true and this effect re-runs
  // even if `taskFingerprint` did not change — ensuring a pending auto-fit is
  // triggered once fonts are available. The density effect above avoids this
  // re-run by reading `fontsReadyRef.current` through the stable `runAutoFitIfReady`
  // callback, which prevents `uiDensity` changes from re-firing when only
  // `fontsReady` flips. The asymmetry between the two effects is intentional.
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (!fontsReady) return;
    autoFitAllColumns();
  }, [taskFingerprint, autoFitAllColumns, fontsReady]);
}
