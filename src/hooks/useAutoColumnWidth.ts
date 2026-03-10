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

  // Track if fonts are loaded for accurate text measurement
  const [fontsReady, setFontsReady] = useState(false);

  // Wait for fonts to load before allowing auto-fit.
  // Gracefully handles environments where FontFaceSet is unavailable or rejects.
  useEffect(() => {
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          setFontsReady(true);
        })
        .catch(() => {
          // Fallback: proceed without waiting when the promise rejects
          // (e.g. certain browser configurations or test environments)
          setFontsReady(true);
        });
    } else {
      // In test environment or unsupported browsers, proceed immediately
      setFontsReady(true);
    }
  }, []);

  // Create a fingerprint of task data that affects column widths
  // Only include fields that are displayed in columns
  const taskFingerprint = useMemo(
    () =>
      tasks
        .map(
          (t) =>
            `${t.id}|${t.name}|${t.startDate}|${t.endDate}|${t.duration}|${t.progress}|${t.parent ?? ""}`
        )
        .join(","),
    [tasks]
  );

  /**
   * Run auto-fit when fonts are ready and this is not the initial render.
   * Extracted to avoid duplicating the guard in each effect below.
   */
  const runAutoFitIfReady = useCallback(() => {
    if (isInitialRender.current) return;
    if (!fontsReady) return;
    autoFitAllColumns();
  }, [fontsReady, autoFitAllColumns]);

  // Auto-fit on density change
  useEffect(() => {
    runAutoFitIfReady();
  }, [uiDensity, runAutoFitIfReady]);

  // Auto-fit on task data change.
  // Also responsible for flipping the initial-render flag so that the density
  // effect (above) correctly skips the very first render too.
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (!fontsReady) return;
    autoFitAllColumns();
  }, [taskFingerprint, autoFitAllColumns, fontsReady]);
}
