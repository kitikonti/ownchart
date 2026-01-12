import { useEffect } from "react";
import { useFileStore } from "../store/slices/fileSlice";

/**
 * Custom hook to dynamically update the browser tab title
 * Shows "filename.ownchart - OwnChart" when a file is loaded
 * Shows "OwnChart" when no file is loaded
 */
export function useDocumentTitle(): void {
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);

  useEffect(() => {
    const baseTitle = "OwnChart";

    if (fileName) {
      // Show filename with asterisk if unsaved changes
      const dirtyIndicator = isDirty ? "*" : "";
      document.title = `${fileName}${dirtyIndicator} - ${baseTitle}`;
    } else {
      // Show asterisk for new unsaved charts
      const dirtyIndicator = isDirty ? "*" : "";
      document.title = `${baseTitle}${dirtyIndicator}`;
    }
  }, [fileName, isDirty]);
}
