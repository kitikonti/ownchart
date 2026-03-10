/**
 * Hook to dynamically update the browser tab title.
 * Reflects the current file name and dirty state in the document title.
 */

import { useEffect } from "react";
import { useFileStore } from "../store/slices/fileSlice";
import { APP_CONFIG } from "../config/appConfig";

const APP_NAME = APP_CONFIG.name;

/**
 * Custom hook to dynamically update the browser tab title
 * Shows "filename.ownchart - OwnChart" when a file is loaded
 * Shows "OwnChart" when no file is loaded
 */
export function useDocumentTitle(): void {
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);

  useEffect(() => {
    const dirtyIndicator = isDirty ? "*" : "";

    if (fileName) {
      // Show filename with asterisk if unsaved changes
      document.title = `${fileName}${dirtyIndicator} - ${APP_NAME}`;
    } else {
      // Show asterisk for new unsaved charts
      document.title = `${APP_NAME}${dirtyIndicator}`;
    }

    // Reset to bare app name on unmount.
    // Safe because this hook is used as a singleton at the root level.
    return (): void => {
      document.title = APP_NAME;
    };
  }, [fileName, isDirty]);
}
