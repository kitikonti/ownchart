/**
 * Hook for automatic column width adjustment.
 * Triggers autoFitAllColumns when:
 * - UI density changes
 * - Task cell values change
 */

import { useEffect, useMemo, useRef } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useUserPreferencesStore } from "../store/slices/userPreferencesSlice";

/**
 * Hook that automatically adjusts column widths when relevant changes occur.
 * Uses a fingerprint of task data to detect content changes efficiently.
 */
export function useAutoColumnWidth() {
  const uiDensity = useUserPreferencesStore(
    (state) => state.preferences.uiDensity
  );
  const tasks = useTaskStore((state) => state.tasks);
  const autoFitAllColumns = useTaskStore((state) => state.autoFitAllColumns);

  // Track if this is the initial render to avoid double-fitting on mount
  const isInitialRender = useRef(true);

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

  // Auto-fit on density change
  useEffect(() => {
    // Skip initial render - let the default/saved widths apply first
    if (isInitialRender.current) {
      return;
    }
    autoFitAllColumns();
  }, [uiDensity, autoFitAllColumns]);

  // Auto-fit on task data change
  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    autoFitAllColumns();
  }, [taskFingerprint, autoFitAllColumns]);
}
