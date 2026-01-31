/**
 * Hook to warn user before leaving page with unsaved changes
 */

import { useEffect } from "react";
import { useFileStore } from "../store/slices/fileSlice";

export function useUnsavedChanges(): void {
  const isDirty = useFileStore((state) => state.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return (): void => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}
