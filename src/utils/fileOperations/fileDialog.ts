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

const OWNCHART_FILE_TYPE: FilePickerAcceptType = {
  description: "OwnChart File",
  accept: { "application/json": [".ownchart"] },
};

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

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Re-save to existing file handle (Chrome/Edge only) */
async function resaveToHandle(content: string): Promise<SaveFileResult | null> {
  if (!currentFileHandle) return null;
  try {
    const writable = await currentFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return { success: true, fileName: currentFileHandle.name };
  } catch {
    // Permission lost or file deleted — fall through to save dialog
    currentFileHandle = null;
    return null;
  }
}

/** Save via File System Access API picker (Chrome/Edge) */
async function saveWithFilePicker(
  content: string,
  fileName: string
): Promise<SaveFileResult | null> {
  if (!window.showSaveFilePicker) return null;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [OWNCHART_FILE_TYPE],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    currentFileHandle = handle;
    return { success: true, fileName: handle.name };
  } catch (e) {
    if (isAbortError(e)) return { success: false, error: "Save cancelled" };
    return null;
  }
}

/** Save via download fallback (Firefox/Safari) */
function saveViaDownload(content: string, fileName: string): SaveFileResult {
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
    return { success: false, error: toErrorMessage(e) };
  }
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
  fileName: string = "untitled.ownchart",
  forceNew: boolean = false
): Promise<SaveFileResult> {
  if (!forceNew) {
    const resaved = await resaveToHandle(content);
    if (resaved) return resaved;
  }

  const picked = await saveWithFilePicker(content, fileName);
  if (picked) return picked;

  return saveViaDownload(content, fileName);
}

/** Open via File System Access API picker (Chrome/Edge) */
async function openWithFilePicker(): Promise<OpenFileResult | null> {
  if (!window.showOpenFilePicker) return null;
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [OWNCHART_FILE_TYPE],
      multiple: false,
    });
    const file = await handle.getFile();
    const content = await file.text();
    currentFileHandle = handle;
    return {
      success: true,
      file: { name: file.name, content, size: file.size },
    };
  } catch (e) {
    if (isAbortError(e)) return { success: false, error: "Open cancelled" };
    return null;
  }
}

/** Open via file input fallback (Firefox/Safari) */
function openViaFileInput(): Promise<OpenFileResult> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ownchart,application/json";

    input.onchange = async (): Promise<void> => {
      if (!input.files || input.files.length === 0) {
        resolve({ success: false, error: "No file selected" });
        return;
      }

      const file = input.files[0];
      const content = await file.text();

      // Clear file handle — Firefox/Safari can't re-save to same file
      currentFileHandle = null;

      resolve({
        success: true,
        file: { name: file.name, content, size: file.size },
      });
    };

    input.oncancel = (): void => {
      resolve({ success: false, error: "Open cancelled" });
    };

    input.click();
  });
}

/**
 * Open file using File System Access API or fallback to file input
 *
 * @returns Result with file content and metadata
 */
export async function openFile(): Promise<OpenFileResult> {
  const picked = await openWithFilePicker();
  if (picked) return picked;
  return openViaFileInput();
}

/**
 * Clear the current file handle (used when creating a new file)
 */
export function clearFileHandle(): void {
  currentFileHandle = null;
}
