/**
 * Hook to consume the PWA LaunchQueue API.
 * When the user opens a .ownchart file via OS file association,
 * the file is read and loaded into the app.
 */

import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  loadFileIntoApp,
  showLoadNotifications,
} from "../utils/fileOperations/loadFromFile";

export function useLaunchQueue(): void {
  useEffect(() => {
    if (!("launchQueue" in window)) return;

    window.launchQueue!.setConsumer(async (launchParams: LaunchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;

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
      } catch (e) {
        console.error("Failed to open file from LaunchQueue:", e);
      }
    });
  }, []);
}
