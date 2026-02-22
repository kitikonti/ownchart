/**
 * Unit tests for file dialog utilities
 * Tests File System Access API and fallback paths
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveFile,
  openFile,
  clearFileHandle,
} from '../../../../src/utils/fileOperations/fileDialog';

// Flush all pending microtasks so async chains settle
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Create an AbortError that works in jsdom (DOMException may not extend Error)
function createAbortError(): Error {
  const error = new Error('User cancelled');
  error.name = 'AbortError';
  return error;
}

// Mock file object with .text() (jsdom File may not support Blob.text())
function createMockFile(
  content: string,
  name: string
): { name: string; size: number; text: () => Promise<string> } {
  return {
    name,
    size: content.length,
    text: vi.fn().mockResolvedValue(content),
  };
}

// Mock writable stream
function createMockWritable(): FileSystemWritableFileStream {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as FileSystemWritableFileStream;
}

// Mock file handle
function createMockFileHandle(
  name: string = 'test.ownchart'
): FileSystemFileHandle {
  const writable = createMockWritable();
  return {
    name,
    kind: 'file' as const,
    createWritable: vi.fn().mockResolvedValue(writable),
    getFile: vi
      .fn()
      .mockResolvedValue(createMockFile('{"fileVersion":"1.0.0"}', name)),
    isSameEntry: vi.fn(),
    queryPermission: vi.fn(),
    requestPermission: vi.fn(),
  } as unknown as FileSystemFileHandle;
}

// Mock file input element that captures onchange/oncancel handlers
interface MockFileInput {
  type: string;
  accept: string;
  click: ReturnType<typeof vi.fn>;
  onchange: ((event: Event) => void) | null;
  oncancel: (() => void) | null;
  files: FileList | null;
}

// Create a FileList-like object (can't redefine Array.length)
function createMockFileInput(
  files: Array<{ name: string; size: number; text: () => Promise<string> }> = []
): MockFileInput {
  const fileList: Record<string | number, unknown> = { length: files.length };
  files.forEach((f, i) => {
    fileList[i] = f;
  });
  return {
    type: '',
    accept: '',
    click: vi.fn(),
    onchange: null,
    oncancel: null,
    files: fileList as unknown as FileList,
  };
}

describe('File Operations - File Dialog', () => {
  let originalShowSaveFilePicker: typeof window.showSaveFilePicker;
  let originalShowOpenFilePicker: typeof window.showOpenFilePicker;

  beforeEach(() => {
    originalShowSaveFilePicker = window.showSaveFilePicker;
    originalShowOpenFilePicker = window.showOpenFilePicker;
    clearFileHandle();
  });

  afterEach(() => {
    window.showSaveFilePicker = originalShowSaveFilePicker;
    window.showOpenFilePicker = originalShowOpenFilePicker;
    vi.restoreAllMocks();
  });

  // Helpers to mock the download fallback path (jsdom lacks URL.createObjectURL)
  function setupDownloadMocks(): { mockAnchor: { click: ReturnType<typeof vi.fn>; href: string; download: string } } {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    URL.revokeObjectURL = vi.fn();
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    return { mockAnchor };
  }

  describe('saveFile', () => {
    describe('File System Access API (Chrome/Edge)', () => {
      it('should save via file picker when API is available', async () => {
        const handle = createMockFileHandle('project.ownchart');
        window.showSaveFilePicker = vi.fn().mockResolvedValue(handle);

        const result = await saveFile('{"test":true}', 'project.ownchart');

        expect(result).toEqual({
          success: true,
          fileName: 'project.ownchart',
        });
        expect(window.showSaveFilePicker).toHaveBeenCalledWith({
          suggestedName: 'project.ownchart',
          types: [
            {
              description: 'OwnChart File',
              accept: { 'application/json': ['.ownchart'] },
            },
          ],
        });
      });

      it('should write content to the file handle', async () => {
        const handle = createMockFileHandle();
        window.showSaveFilePicker = vi.fn().mockResolvedValue(handle);
        const content = '{"fileVersion":"1.0.0"}';

        await saveFile(content);

        const writable = await handle.createWritable();
        expect(writable.write).toHaveBeenCalledWith(content);
        expect(writable.close).toHaveBeenCalled();
      });

      it('should return cancelled when user aborts picker', async () => {
        window.showSaveFilePicker = vi
          .fn()
          .mockRejectedValue(createAbortError());

        const result = await saveFile('{}');

        expect(result).toEqual({
          success: false,
          error: 'Save cancelled',
        });
      });

      it('should re-save to existing handle without showing picker', async () => {
        const handle = createMockFileHandle('existing.ownchart');
        window.showSaveFilePicker = vi.fn().mockResolvedValue(handle);

        // First save establishes the handle
        await saveFile('{"v":1}', 'existing.ownchart');

        // Second save should re-use the handle
        const result = await saveFile('{"v":2}');

        // Picker should only be called once (first save)
        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          success: true,
          fileName: 'existing.ownchart',
        });
      });

      it('should show picker when forceNew is true even with existing handle', async () => {
        const handle1 = createMockFileHandle('first.ownchart');
        const handle2 = createMockFileHandle('second.ownchart');
        window.showSaveFilePicker = vi
          .fn()
          .mockResolvedValueOnce(handle1)
          .mockResolvedValueOnce(handle2);

        // First save establishes handle
        await saveFile('{}', 'first.ownchart');

        // Save As (forceNew) should show picker again
        const result = await saveFile('{}', 'second.ownchart', true);

        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          success: true,
          fileName: 'second.ownchart',
        });
      });

      it('should fall through to picker if re-save handle fails', async () => {
        const brokenHandle = createMockFileHandle('broken.ownchart');
        (
          brokenHandle.createWritable as ReturnType<typeof vi.fn>
        ).mockRejectedValue(new Error('Permission denied'));
        const freshHandle = createMockFileHandle('fresh.ownchart');

        window.showSaveFilePicker = vi
          .fn()
          .mockResolvedValueOnce(brokenHandle)
          .mockResolvedValueOnce(freshHandle);

        // First save establishes handle
        await saveFile('{}', 'broken.ownchart');

        // Second save: handle fails, should fall through to picker
        const result = await saveFile('{}', 'fresh.ownchart');

        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          success: true,
          fileName: 'fresh.ownchart',
        });
      });
    });

    describe('Download fallback (Firefox/Safari)', () => {
      beforeEach(() => {
        window.showSaveFilePicker = undefined;
      });

      it('should create download link and trigger click', async () => {
        const { mockAnchor } = setupDownloadMocks();

        const result = await saveFile('{"test":true}', 'download.ownchart');

        expect(result).toEqual({
          success: true,
          fileName: 'download.ownchart',
        });
        expect(mockAnchor.download).toBe('download.ownchart');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
      });

      it('should use default filename when none provided', async () => {
        setupDownloadMocks();

        const result = await saveFile('{}');

        expect(result.success).toBe(true);
        expect(result.fileName).toBe('untitled.ownchart');
      });

      it('should return error when download fails', async () => {
        URL.createObjectURL = vi.fn().mockImplementation(() => {
          throw new Error('Blob creation failed');
        });

        const result = await saveFile('{}');

        expect(result).toEqual({
          success: false,
          error: 'Blob creation failed',
        });
      });
    });

    describe('fallback from picker errors', () => {
      it('should fall to download when picker throws non-abort error', async () => {
        window.showSaveFilePicker = vi
          .fn()
          .mockRejectedValue(new Error('SecurityError'));

        setupDownloadMocks();

        const result = await saveFile('{}', 'test.ownchart');

        expect(result.success).toBe(true);
        expect(result.fileName).toBe('test.ownchart');
      });
    });
  });

  describe('openFile', () => {
    describe('File System Access API (Chrome/Edge)', () => {
      it('should open file via picker', async () => {
        const handle = createMockFileHandle('opened.ownchart');
        window.showOpenFilePicker = vi.fn().mockResolvedValue([handle]);

        const result = await openFile();

        expect(result.success).toBe(true);
        expect(result.file).toBeDefined();
        expect(result.file!.name).toBe('opened.ownchart');
        expect(result.file!.content).toBe('{"fileVersion":"1.0.0"}');
      });

      it('should store handle for subsequent re-saves', async () => {
        const openHandle = createMockFileHandle('opened.ownchart');
        window.showOpenFilePicker = vi.fn().mockResolvedValue([openHandle]);
        window.showSaveFilePicker = vi.fn();

        await openFile();

        // Now save should re-use the handle from open, not show picker
        const saveResult = await saveFile('{}');

        expect(window.showSaveFilePicker).not.toHaveBeenCalled();
        expect(saveResult).toEqual({
          success: true,
          fileName: 'opened.ownchart',
        });
      });

      it('should return cancelled when user aborts', async () => {
        window.showOpenFilePicker = vi
          .fn()
          .mockRejectedValue(createAbortError());

        const result = await openFile();

        expect(result).toEqual({
          success: false,
          error: 'Open cancelled',
        });
      });

      it('should call picker with correct options', async () => {
        const handle = createMockFileHandle();
        window.showOpenFilePicker = vi.fn().mockResolvedValue([handle]);

        await openFile();

        expect(window.showOpenFilePicker).toHaveBeenCalledWith({
          types: [
            {
              description: 'OwnChart File',
              accept: { 'application/json': ['.ownchart'] },
            },
          ],
          multiple: false,
        });
      });
    });

    describe('File input fallback (Firefox/Safari)', () => {
      beforeEach(() => {
        window.showOpenFilePicker = undefined;
      });

      it('should create file input and trigger click', async () => {
        const mockFile = createMockFile(
          '{"fileVersion":"1.0.0"}',
          'input.ownchart'
        );
        const mockInput = createMockFileInput([mockFile]);

        vi.spyOn(document, 'createElement').mockReturnValue(
          mockInput as unknown as HTMLElement
        );

        const resultPromise = openFile();
        await flushMicrotasks();

        expect(mockInput.onchange).toBeTypeOf('function');
        await mockInput.onchange!(new Event('change'));

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(result.file!.name).toBe('input.ownchart');
        expect(mockInput.type).toBe('file');
        expect(mockInput.accept).toBe('.ownchart,application/json');
        expect(mockInput.click).toHaveBeenCalled();
      });

      it('should return error when no file selected', async () => {
        const mockInput = createMockFileInput([]);

        vi.spyOn(document, 'createElement').mockReturnValue(
          mockInput as unknown as HTMLElement
        );

        const resultPromise = openFile();
        await flushMicrotasks();

        await mockInput.onchange!(new Event('change'));

        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          error: 'No file selected',
        });
      });

      it('should return cancelled when user cancels input', async () => {
        const mockInput = createMockFileInput();
        mockInput.files = null;

        vi.spyOn(document, 'createElement').mockReturnValue(
          mockInput as unknown as HTMLElement
        );

        const resultPromise = openFile();
        await flushMicrotasks();

        mockInput.oncancel!();

        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          error: 'Open cancelled',
        });
      });

      it('should clear file handle after input-based open', async () => {
        window.showSaveFilePicker = undefined;

        const mockFile = createMockFile('{}', 'input.ownchart');
        const mockInput = createMockFileInput([mockFile]);

        vi.spyOn(document, 'createElement').mockReturnValue(
          mockInput as unknown as HTMLElement
        );

        const resultPromise = openFile();
        await flushMicrotasks();
        await mockInput.onchange!(new Event('change'));
        await resultPromise;

        // Handle should be null — save should go to download fallback
        vi.restoreAllMocks();
        setupDownloadMocks();

        const saveResult = await saveFile('{}');
        expect(saveResult.success).toBe(true);
        // Went through download path, not re-save
        expect(saveResult.fileName).toBe('untitled.ownchart');
      });
    });

    describe('fallback from picker errors', () => {
      it('should fall to file input when picker throws non-abort error', async () => {
        window.showOpenFilePicker = vi
          .fn()
          .mockRejectedValue(new Error('SecurityError'));

        const mockFile = createMockFile('{}', 'fallback.ownchart');
        const mockInput = createMockFileInput([mockFile]);

        vi.spyOn(document, 'createElement').mockReturnValue(
          mockInput as unknown as HTMLElement
        );

        const resultPromise = openFile();
        await flushMicrotasks();

        await mockInput.onchange!(new Event('change'));

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(result.file!.name).toBe('fallback.ownchart');
      });
    });
  });

  describe('clearFileHandle', () => {
    it('should clear stored handle so next save shows picker', async () => {
      const handle = createMockFileHandle('stored.ownchart');
      window.showSaveFilePicker = vi.fn().mockResolvedValue(handle);

      // Establish handle
      await saveFile('{}', 'stored.ownchart');
      expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);

      // Clear it
      clearFileHandle();

      // Next save should show picker again
      await saveFile('{}', 'new.ownchart');
      expect(window.showSaveFilePicker).toHaveBeenCalledTimes(2);
    });
  });
});
