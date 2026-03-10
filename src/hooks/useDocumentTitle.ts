import { useEffect } from "react";
import { useFileStore } from "../store/slices/fileSlice";

const APP_NAME = "OwnChart";

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

    return (): void => {
      document.title = APP_NAME;
    };
  }, [fileName, isDirty]);
}
