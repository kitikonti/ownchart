/**
 * File dialog utilities using File System Access API with fallback
 *
 * Chrome/Edge: File System Access API
 * - showSaveFilePicker() - Native save dialog
 * - Re-save to same file on subsequent saves (no dialog)
 * - showOpenFilePicker() - Native open dialog
 *
 * Firefox/Safari Fallback:
 * - Download file (every save creates new file)
 * - Hidden file input for open
 */

// Type declarations for File System Access API
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
}

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (
      options?: OpenFilePickerOptions
    ) => Promise<FileSystemFileHandle[]>;
  }
}

// Store file handle for re-saving (Chrome/Edge only)
let currentFileHandle: FileSystemFileHandle | null = null;

export interface SaveFileResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export interface OpenFileResult {
  success: boolean;
  file?: {
    name: string;
    content: string;
    size: number;
  };
  error?: string;
}

/**
 * Save file using File System Access API or fallback to download
 *
 * @param content - File content as string
 * @param fileName - Suggested file name
 * @param forceNew - true = "Save As" (always show dialog), false = re-save if handle exists
 * @returns Result with success status and file name
 */
export async function saveFile(
  content: string,
  fileName: string = "untitled.gantt",
  forceNew: boolean = false
): Promise<SaveFileResult> {
  // Chrome/Edge: Try to re-save to existing file handle
  if (!forceNew && currentFileHandle) {
    try {
      const writable = await currentFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { success: true, fileName: currentFileHandle.name };
    } catch (e) {
      // Permission lost or file deleted - fall through to save dialog
      currentFileHandle = null;
    }
  }

  // Chrome/Edge: Show save dialog (File System Access API)
  if ("showSaveFilePicker" in window && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Gantt Chart File",
            accept: { "application/json": [".gantt"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      // Store handle for future re-saves
      currentFileHandle = handle;

      return { success: true, fileName: handle.name };
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return { success: false, error: "Save cancelled" };
      }
      // Fall through to fallback
    }
  }

  // Firefox/Safari Fallback: Download file
  try {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Open file using File System Access API or fallback to file input
 *
 * @returns Result with file content and metadata
 */
export async function openFile(): Promise<OpenFileResult> {
  // Chrome/Edge: File System Access API
  if ("showOpenFilePicker" in window && window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Gantt Chart Files",
            accept: { "application/json": [".gantt"] },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const content = await file.text();

      // Store handle for future re-saves
      currentFileHandle = handle;

      return {
        success: true,
        file: { name: file.name, content, size: file.size },
      };
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return { success: false, error: "Open cancelled" };
      }
      // Fall through to fallback
    }
  }

  // Firefox/Safari Fallback: File input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gantt,application/json";

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        resolve({ success: false, error: "No file selected" });
        return;
      }

      const file = input.files[0];
      const content = await file.text();

      // Clear file handle - Firefox/Safari can't re-save to same file
      currentFileHandle = null;

      resolve({
        success: true,
        file: { name: file.name, content, size: file.size },
      });
    };

    input.oncancel = () => {
      resolve({ success: false, error: "Open cancelled" });
    };

    input.click();
  });
}

/**
 * Clear the current file handle (used when creating a new file)
 */
export function clearFileHandle(): void {
  currentFileHandle = null;
}

/**
 * Check if we have a file handle for re-saving
 */
export function hasFileHandle(): boolean {
  return currentFileHandle !== null;
}
