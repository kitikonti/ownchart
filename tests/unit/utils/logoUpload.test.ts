/**
 * Unit tests for logoUpload.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processLogoFile,
  logoToDataUrl,
  formatFileSize,
  MAX_LOGO_FILE_SIZE,
  ALLOWED_LOGO_MIME_TYPES,
  LOGO_ACCEPT,
  MAX_LOGO_DISPLAY_HEIGHT_PT,
} from "@/utils/logoUpload";
import type { ProjectLogo } from "@/types/logo.types";

// =============================================================================
// Helpers
// =============================================================================

function createMockFile(
  name: string,
  size: number,
  type: string,
  content = "fake-content"
): File {
  const blob = new Blob([content], { type });
  // Override size since Blob computes it from content
  Object.defineProperty(blob, "size", { value: size });
  Object.defineProperty(blob, "name", { value: name });
  Object.defineProperty(blob, "type", { value: type });
  return blob as unknown as File;
}

/** Base64-encode a string (mimics btoa) */
function toBase64(str: string): string {
  return btoa(str);
}

// =============================================================================
// Tests: formatFileSize
// =============================================================================

describe("formatFileSize", () => {
  it("formats bytes below 1024 as B", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1)).toBe("1 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("formats 1024 bytes as 1 KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats larger values in KB with rounding", () => {
    expect(formatFileSize(1536)).toBe("2 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(512 * 1024)).toBe("512 KB");
    expect(formatFileSize(1000 * 1024)).toBe("1000 KB");
  });

  it("rounds to nearest KB", () => {
    // 1.4 KB → rounds to 1
    expect(formatFileSize(1434)).toBe("1 KB");
    // 1.6 KB → rounds to 2
    expect(formatFileSize(1638)).toBe("2 KB");
  });
});

// =============================================================================
// Tests: logoToDataUrl
// =============================================================================

describe("logoToDataUrl", () => {
  it("creates correct data URL for PNG", () => {
    const logo: ProjectLogo = {
      data: "abc123",
      mimeType: "image/png",
      fileName: "logo.png",
      width: 200,
      height: 100,
    };
    expect(logoToDataUrl(logo)).toBe("data:image/png;base64,abc123");
  });

  it("creates correct data URL for JPEG", () => {
    const logo: ProjectLogo = {
      data: "jpegdata",
      mimeType: "image/jpeg",
      fileName: "photo.jpg",
      width: 800,
      height: 600,
    };
    expect(logoToDataUrl(logo)).toBe("data:image/jpeg;base64,jpegdata");
  });

  it("creates correct data URL for SVG", () => {
    const logo: ProjectLogo = {
      data: "svgdata",
      mimeType: "image/svg+xml",
      fileName: "icon.svg",
      width: 64,
      height: 64,
    };
    expect(logoToDataUrl(logo)).toBe("data:image/svg+xml;base64,svgdata");
  });
});

// =============================================================================
// Tests: constants
// =============================================================================

describe("constants", () => {
  it("MAX_LOGO_FILE_SIZE is 512 KB", () => {
    expect(MAX_LOGO_FILE_SIZE).toBe(512 * 1024);
  });

  it("ALLOWED_LOGO_MIME_TYPES contains the three supported types", () => {
    expect(ALLOWED_LOGO_MIME_TYPES.has("image/png")).toBe(true);
    expect(ALLOWED_LOGO_MIME_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_LOGO_MIME_TYPES.has("image/svg+xml")).toBe(true);
    expect(ALLOWED_LOGO_MIME_TYPES.has("image/gif")).toBe(false);
    expect(ALLOWED_LOGO_MIME_TYPES.size).toBe(3);
  });

  it("LOGO_ACCEPT lists correct extensions", () => {
    expect(LOGO_ACCEPT).toBe(".png,.jpg,.jpeg,.svg");
  });

  it("MAX_LOGO_DISPLAY_HEIGHT_PT is 14", () => {
    expect(MAX_LOGO_DISPLAY_HEIGHT_PT).toBe(14);
  });
});

// =============================================================================
// Tests: processLogoFile — validation
// =============================================================================

describe("processLogoFile", () => {
  describe("file validation", () => {
    it("rejects unsupported MIME type", async () => {
      const file = createMockFile("image.gif", 1024, "image/gif");
      await expect(processLogoFile(file)).rejects.toThrow(
        'Unsupported file type "image/gif". Use PNG, JPG, or SVG.'
      );
    });

    it("rejects file with empty MIME type", async () => {
      const file = createMockFile("mystery", 1024, "");
      await expect(processLogoFile(file)).rejects.toThrow(
        'Unsupported file type "unknown". Use PNG, JPG, or SVG.'
      );
    });

    it("rejects file with application/pdf MIME type", async () => {
      const file = createMockFile("doc.pdf", 1024, "application/pdf");
      await expect(processLogoFile(file)).rejects.toThrow(
        'Unsupported file type "application/pdf"'
      );
    });

    it("rejects file exceeding MAX_LOGO_FILE_SIZE", async () => {
      const file = createMockFile(
        "huge.png",
        MAX_LOGO_FILE_SIZE + 1,
        "image/png"
      );
      await expect(processLogoFile(file)).rejects.toThrow(
        "File too large"
      );
      await expect(processLogoFile(file)).rejects.toThrow(
        "Maximum is 512 KB"
      );
    });

    it("rejects empty file (zero bytes)", async () => {
      const file = createMockFile("empty.png", 0, "image/png");
      await expect(processLogoFile(file)).rejects.toThrow("File is empty.");
    });

    it("validates MIME type before checking size", async () => {
      // File has wrong type AND is too large — should report type error
      const file = createMockFile(
        "big.gif",
        MAX_LOGO_FILE_SIZE + 1,
        "image/gif"
      );
      await expect(processLogoFile(file)).rejects.toThrow(
        "Unsupported file type"
      );
    });
  });

  // ===========================================================================
  // processLogoFile — PNG processing
  // ===========================================================================

  describe("PNG processing", () => {
    beforeEach(() => {
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        // Trigger onload when readAsDataURL is called
        mockFileReader.readAsDataURL = vi.fn(() => {
          mockFileReader.result = "data:image/png;base64,iVBORw0KGgo=";
          if (mockFileReader.onload) {
            mockFileReader.onload({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });

      // Mock Image for raster dimension extraction
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
        naturalWidth: 200,
        naturalHeight: 100,
      };

      vi.spyOn(globalThis, "Image").mockImplementation(() => {
        const img = mockImage;
        // Trigger onload asynchronously when src is set
        Object.defineProperty(img, "src", {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          set(_v: string) {
            setTimeout(() => {
              if (img.onload) img.onload();
            }, 0);
          },
          get() {
            return "";
          },
        });
        return img as unknown as HTMLImageElement;
      });
    });

    it("processes a valid PNG file", async () => {
      const file = createMockFile("logo.png", 4096, "image/png");
      const result = await processLogoFile(file);

      expect(result).toEqual({
        data: "iVBORw0KGgo=",
        mimeType: "image/png",
        fileName: "logo.png",
        width: 200,
        height: 100,
      });
    });
  });

  // ===========================================================================
  // processLogoFile — JPEG processing
  // ===========================================================================

  describe("JPEG processing", () => {
    beforeEach(() => {
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        mockFileReader.readAsDataURL = vi.fn(() => {
          mockFileReader.result = "data:image/jpeg;base64,/9j/4AAQ=";
          if (mockFileReader.onload) {
            mockFileReader.onload({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
        naturalWidth: 640,
        naturalHeight: 480,
      };

      vi.spyOn(globalThis, "Image").mockImplementation(() => {
        const img = mockImage;
        Object.defineProperty(img, "src", {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          set(_v: string) {
            setTimeout(() => {
              if (img.onload) img.onload();
            }, 0);
          },
          get() {
            return "";
          },
        });
        return img as unknown as HTMLImageElement;
      });
    });

    it("processes a valid JPEG file", async () => {
      const file = createMockFile("photo.jpg", 8192, "image/jpeg");
      const result = await processLogoFile(file);

      expect(result).toEqual({
        data: "/9j/4AAQ=",
        mimeType: "image/jpeg",
        fileName: "photo.jpg",
        width: 640,
        height: 480,
      });
    });
  });

  // ===========================================================================
  // processLogoFile — SVG processing
  // ===========================================================================

  describe("SVG processing", () => {
    function setupSvgMocks(svgContent: string): void {
      const base64Svg = toBase64(svgContent);

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        mockFileReader.readAsDataURL = vi.fn(() => {
          mockFileReader.result = `data:image/svg+xml;base64,${base64Svg}`;
          if (mockFileReader.onload) {
            mockFileReader.onload({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });
    }

    it("extracts dimensions from width/height attributes", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("icon.svg", 256, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(300);
      expect(result.height).toBe(150);
      expect(result.mimeType).toBe("image/svg+xml");
      expect(result.fileName).toBe("icon.svg");
    });

    it("falls back to viewBox when width/height not present", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 256"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("logo.svg", 512, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(512);
      expect(result.height).toBe(256);
    });

    it("handles viewBox with comma separators", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,400,200"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("logo.svg", 256, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(400);
      expect(result.height).toBe(200);
    });

    it("handles viewBox with mixed separators", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0,  800 600"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("logo.svg", 256, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("prefers width/height attributes over viewBox", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 500 250"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("logo.svg", 256, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
    });

    it("returns 100x100 default when no dimensions available", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("bare.svg", 128, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("returns 100x100 default when width/height are zero", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("zero.svg", 128, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("returns 100x100 default when viewBox has invalid dimensions", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("zero-vb.svg", 128, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("returns 100x100 default when viewBox has too few parts", async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100"></svg>';
      setupSvgMocks(svg);

      const file = createMockFile("bad-vb.svg", 128, "image/svg+xml");
      const result = await processLogoFile(file);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("throws for invalid SVG content (no <svg> element)", async () => {
      const notSvg = "<html><body>Not an SVG</body></html>";
      setupSvgMocks(notSvg);

      const file = createMockFile("fake.svg", 256, "image/svg+xml");
      await expect(processLogoFile(file)).rejects.toThrow("Invalid SVG file.");
    });
  });

  // ===========================================================================
  // processLogoFile — FileReader errors
  // ===========================================================================

  describe("FileReader error handling", () => {
    it("rejects when FileReader fires onerror", async () => {
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        mockFileReader.readAsDataURL = vi.fn(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });

      const file = createMockFile("broken.png", 1024, "image/png");
      await expect(processLogoFile(file)).rejects.toThrow(
        "Failed to read file."
      );
    });

    it("rejects when data URL has no comma separator", async () => {
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        mockFileReader.readAsDataURL = vi.fn(() => {
          mockFileReader.result = "malformed-data-url-without-comma";
          if (mockFileReader.onload) {
            mockFileReader.onload({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });

      const file = createMockFile("weird.png", 1024, "image/png");
      await expect(processLogoFile(file)).rejects.toThrow(
        "Failed to read file as Base64."
      );
    });
  });

  // ===========================================================================
  // processLogoFile — Image load error (raster)
  // ===========================================================================

  describe("raster dimension extraction error", () => {
    it("rejects when Image fires onerror", async () => {
      // Set up FileReader to succeed
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        result: null as string | null,
      };

      vi.spyOn(globalThis, "FileReader").mockImplementation(() => {
        const reader = mockFileReader as unknown as FileReader;
        mockFileReader.readAsDataURL = vi.fn(() => {
          mockFileReader.result = "data:image/png;base64,baddata";
          if (mockFileReader.onload) {
            mockFileReader.onload({} as ProgressEvent<FileReader>);
          }
        });
        return reader;
      });

      // Set up Image to fail
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      };

      vi.spyOn(globalThis, "Image").mockImplementation(() => {
        const img = mockImage;
        Object.defineProperty(img, "src", {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          set(_v: string) {
            setTimeout(() => {
              if (img.onerror) img.onerror();
            }, 0);
          },
          get() {
            return "";
          },
        });
        return img as unknown as HTMLImageElement;
      });

      const file = createMockFile("corrupt.png", 1024, "image/png");
      await expect(processLogoFile(file)).rejects.toThrow(
        "Failed to load image for dimension extraction."
      );
    });
  });
});
