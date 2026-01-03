/**
 * Hook to warn user before leaving page with unsaved changes
 */

import { useEffect } from "react";
import { useFileStore } from "../store/slices/fileSlice";

export function useUnsavedChanges() {
  const isDirty = useFileStore((state) => state.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}
