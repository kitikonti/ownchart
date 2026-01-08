import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateFilename,
  downloadBlob,
  downloadCanvasAsPng,
} from '../../../../src/utils/export/downloadPng';

describe('generateFilename', () => {
  beforeEach(() => {
    // Mock Date to get consistent filenames
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T14:30:45'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate filename with project name and timestamp', () => {
    const filename = generateFilename('MyProject');
    expect(filename).toBe('MyProject-20260105-143045.png');
  });

  it('should use "untitled" when no project name provided', () => {
    const filename = generateFilename();
    expect(filename).toBe('untitled-20260105-143045.png');
  });

  it('should use "untitled" for empty project name', () => {
    const filename = generateFilename('');
    expect(filename).toBe('untitled-20260105-143045.png');
  });

  it('should sanitize project name with spaces', () => {
    const filename = generateFilename('My Project');
    expect(filename).toBe('My-Project-20260105-143045.png');
  });

  it('should sanitize project name with invalid characters', () => {
    const filename = generateFilename('Project/Client:Test');
    expect(filename).toBe('ProjectClientTest-20260105-143045.png');
  });

  it('should include .png extension', () => {
    const filename = generateFilename('Test');
    expect(filename.endsWith('.png')).toBe(true);
  });

  it('should include date in YYYYMMDD format', () => {
    const filename = generateFilename('Test');
    expect(filename).toContain('20260105');
  });

  it('should include time in HHMMSS format', () => {
    const filename = generateFilename('Test');
    expect(filename).toContain('143045');
  });
});

describe('downloadBlob', () => {
  let originalCreateElement: typeof document.createElement;
  let mockLink: { click: ReturnType<typeof vi.fn>; href: string; download: string };
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLink = {
      click: vi.fn(),
      href: '',
      download: '',
    };

    originalCreateElement = document.createElement;
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        return mockLink as unknown as HTMLAnchorElement;
      }
      return originalCreateElement.call(document, tag);
    }) as typeof document.createElement;

    // Mock appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as Node
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as Node
    );

    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  it('should create download link with correct href and filename', () => {
    const blob = new Blob(['test'], { type: 'image/png' });
    downloadBlob(blob, 'test.png');

    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('test.png');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should create object URL from blob', () => {
    const blob = new Blob(['test'], { type: 'image/png' });
    downloadBlob(blob, 'test.png');

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
  });

  it('should revoke object URL after download', async () => {
    vi.useFakeTimers();

    const blob = new Blob(['test'], { type: 'image/png' });
    downloadBlob(blob, 'test.png');

    // Object URL should not be revoked immediately
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    // Advance timers to trigger cleanup
    await vi.advanceTimersByTimeAsync(150);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');

    vi.useRealTimers();
  });
});

describe('downloadCanvasAsPng', () => {
  let mockCanvas: HTMLCanvasElement;
  let originalCreateElement: typeof document.createElement;
  let mockLink: { click: ReturnType<typeof vi.fn>; href: string; download: string };
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(new Blob(['test'], { type: 'image/png' }));
      }),
    } as unknown as HTMLCanvasElement;

    mockLink = {
      click: vi.fn(),
      href: '',
      download: '',
    };

    originalCreateElement = document.createElement;
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        return mockLink as unknown as HTMLAnchorElement;
      }
      return originalCreateElement.call(document, tag);
    }) as typeof document.createElement;

    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as Node
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as Node
    );

    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  it('should convert canvas to PNG and download', async () => {
    await downloadCanvasAsPng(mockCanvas, 'custom-name.png');

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      1.0
    );
    expect(mockLink.download).toBe('custom-name.png');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should use generated filename if not provided', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T14:30:45'));

    await downloadCanvasAsPng(mockCanvas);

    expect(mockLink.download).toBe('untitled-20260105-143045.png');

    vi.useRealTimers();
  });

  it('should reject if blob creation fails', async () => {
    const failingCanvas = {
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(null);
      }),
    } as unknown as HTMLCanvasElement;

    await expect(downloadCanvasAsPng(failingCanvas)).rejects.toThrow(
      'Failed to create PNG blob'
    );
  });
});
