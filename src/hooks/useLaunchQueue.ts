/**
 * Hook to consume the PWA LaunchQueue API.
 * When the user opens a .ownchart file via OS file association,
 * the file is read and loaded into the app.
 *
 * NOTE: Must be mounted as a singleton (once at the root level).
 * The LaunchQueue API does not expose an unsetConsumer, so mounting this
 * hook in multiple places would silently overwrite the previous consumer.
 */

import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  loadFileIntoApp,
  showLoadNotifications,
} from "../utils/fileOperations/loadFromFile";

// Dev-mode singleton guard: detect accidental double-mounting.
// The LaunchQueue API silently overwrites the previous consumer when
// setConsumer is called more than once, so this warning surfaces the bug early.
//
// Intentionally not reset: this is a once-per-process flag. HMR re-evaluates
// the module, which resets it naturally. In tests, use vi.resetModules() before
// importing this hook if a fresh guard state is required.
let _launchQueueConsumerRegistered = false;

export function useLaunchQueue(): void {
  useEffect(() => {
    const lq = window.launchQueue;
    if (!lq) return;

    if (import.meta.env.DEV) {
      if (_launchQueueConsumerRegistered) {
        console.warn(
          "[useLaunchQueue] Hook mounted more than once. " +
            "Only the most recent consumer will receive launch events. " +
            "Ensure this hook is used as a singleton at the root level."
        );
      }
      _launchQueueConsumerRegistered = true;
    }

    lq.setConsumer(async (launchParams: LaunchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;

      // Only the first file is opened — OwnChart is a single-project app.
      const handle = launchParams.files[0];
      try {
        const file = await handle.getFile();
        const content = await file.text();
        const result = await loadFileIntoApp({
          name: file.name,
          content,
          size: file.size,
        });
        showLoadNotifications({ ...result, fileName: file.name }, toast);
      } catch (e: unknown) {
        // Intentional: log to console for error observability in addition to the user-facing toast.
        console.error("Failed to open file from LaunchQueue:", e);
        toast.error(`Failed to open "${handle.name}"`);
      }
    });
  }, []);
}
