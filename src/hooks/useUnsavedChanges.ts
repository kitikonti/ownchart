/**
 * Hook to warn user before leaving page with unsaved changes.
 *
 * Uses a ref to track isDirty so the event listener is registered once and
 * never re-registered on dirty-state changes. This avoids redundant
 * add/remove cycles on every keystroke that marks the chart dirty.
 */

import { useEffect, useRef } from "react";
import { useFileStore } from "../store/slices/fileSlice";

export function useUnsavedChanges(): void {
  const isDirty = useFileStore((state) => state.isDirty);

  // Keep a ref in sync so the stable handler always reads the latest value
  // without needing to be re-created or re-registered.
  //
  // Timing note: the ref sync effect runs after render, so there is a brief
  // window where the ref lags behind state. This is safe because `beforeunload`
  // can only be triggered by user navigation, which cannot occur during a React
  // render cycle — the ref is always flushed before navigation is possible.
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirtyRef.current) {
        e.preventDefault();
        // Modern browsers show a generic dialog — custom messages are ignored.
        // Legacy support (pre-2023): setting returnValue is required to trigger the dialog.
        // An empty string is correct; browsers no longer display its content.
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return (): void => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []); // Registered once — isDirty is read via ref inside the handler
}
