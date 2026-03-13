/**
 * Hook to dynamically update the browser tab title.
 * Reflects the current file name and dirty state in the document title.
 */

import { useEffect } from "react";
import { useFileStore } from "@/store/slices/fileSlice";
import { APP_CONFIG } from "@/config/appConfig";

/** Prefix prepended to the document title when there are unsaved changes. */
const DIRTY_INDICATOR = "*";

/**
 * Custom hook to dynamically update the browser tab title.
 *
 * Title format:
 * - No file loaded, clean:   "OwnChart"
 * - No file loaded, dirty:   "OwnChart*"
 * - File loaded, clean:      "filename.ownchart - OwnChart"
 * - File loaded, dirty:      "filename.ownchart* - OwnChart"
 *
 * Resets to the bare app name on unmount. Safe to use as a singleton
 * at the root level — multiple simultaneous instances would race.
 */
export function useDocumentTitle(): void {
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);

  useEffect(() => {
    const dirtyIndicator = isDirty ? DIRTY_INDICATOR : "";

    if (fileName) {
      document.title = `${fileName}${dirtyIndicator} - ${APP_CONFIG.name}`;
    } else {
      document.title = `${APP_CONFIG.name}${dirtyIndicator}`;
    }

    // Reset to bare app name on unmount.
    // Safe because this hook is used as a singleton at the root level.
    return (): void => {
      document.title = APP_CONFIG.name;
    };
  }, [fileName, isDirty]);
}
