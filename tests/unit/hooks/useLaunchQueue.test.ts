/**
 * Tests for useLaunchQueue hook.
 * Covers PWA file-association behaviour: consuming the LaunchQueue API
 * to open .ownchart files when the app is launched via OS file association.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLaunchQueue } from "@/hooks/useLaunchQueue";

// ─── Mocks ───

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/fileOperations/loadFromFile", () => ({
  loadFileIntoApp: vi.fn(),
  showLoadNotifications: vi.fn(),
}));

// Mocked module references — must be imported after vi.mock() calls so that
// the mock factory has already replaced the modules before we capture them here.
import toast from "react-hot-toast";
import {
  loadFileIntoApp,
  showLoadNotifications,
} from "@/utils/fileOperations/loadFromFile";

// ─── Helpers ───

function makeFileHandle(name: string, content: string, size = content.length): FileSystemFileHandle {
  // Provide a plain object with .text() since jsdom's File doesn't implement it
  const fileObj = {
    name,
    size,
    text: vi.fn().mockResolvedValue(content),
  };
  return {
    getFile: vi.fn().mockResolvedValue(fileObj),
    kind: "file",
    name,
    isSameEntry: vi.fn(),
    queryPermission: vi.fn(),
    requestPermission: vi.fn(),
  } as unknown as FileSystemFileHandle;
}

// ─── Setup ───

let consumerFn: ((params: LaunchParams) => void | Promise<void>) | null = null;

function setupLaunchQueue(): void {
  consumerFn = null;
  Object.defineProperty(window, "launchQueue", {
    value: {
      setConsumer: vi.fn((fn) => {
        consumerFn = fn;
      }),
    },
    writable: true,
    configurable: true,
  });
}

function removeLaunchQueue(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).launchQueue;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  removeLaunchQueue();
});

// ─── Dev-mode singleton guard test ───
// Uses vi.stubEnv + vi.resetModules + dynamic import to test the DEV-only guard
// in isolation from the statically-imported hook module.

describe("useLaunchQueue — dev-mode singleton guard", () => {
  afterEach(() => {
    // Restore env stubs and module registry after each test in this block
    // to prevent DEV=true from leaking into subsequent describe blocks.
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("should warn when the hook is mounted more than once in DEV mode", async () => {
    vi.stubEnv("DEV", true);

    // Reset module registry so the module-level flag starts at false
    vi.resetModules();

    const { renderHook: renderHookDynamic } = await import("@testing-library/react");
    const { useLaunchQueue: useLaunchQueueDynamic } = await import(
      "../../../src/hooks/useLaunchQueue"
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(window, "launchQueue", {
      value: { setConsumer: vi.fn() },
      writable: true,
      configurable: true,
    });

    // First mount — registers the flag
    const { unmount: unmount1 } = renderHookDynamic(() => useLaunchQueueDynamic());

    // Second mount — should emit the warning
    const { unmount: unmount2 } = renderHookDynamic(() => useLaunchQueueDynamic());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Hook mounted more than once")
    );

    unmount1();
    unmount2();
    warnSpy.mockRestore();
  });
});

// ─── Tests ───

describe("useLaunchQueue", () => {
  it("should be a no-op when launchQueue is not available", () => {
    removeLaunchQueue();

    // Should not throw
    expect(() => renderHook(() => useLaunchQueue())).not.toThrow();
  });

  it("should register a consumer when launchQueue is available", () => {
    setupLaunchQueue();

    renderHook(() => useLaunchQueue());

    expect(window.launchQueue!.setConsumer).toHaveBeenCalledTimes(1);
  });

  it("should be a no-op when launchParams has no files", async () => {
    setupLaunchQueue();

    renderHook(() => useLaunchQueue());

    await consumerFn!({ files: [] });

    expect(loadFileIntoApp).not.toHaveBeenCalled();
    expect(showLoadNotifications).not.toHaveBeenCalled();
  });

  it("should load the first file and show notifications on success", async () => {
    setupLaunchQueue();

    const mockResult = { success: true };
    vi.mocked(loadFileIntoApp).mockReturnValue(mockResult as ReturnType<typeof loadFileIntoApp>);

    const handle = makeFileHandle("project.ownchart", '{"version":1}');

    renderHook(() => useLaunchQueue());

    await consumerFn!({ files: [handle] });

    expect(loadFileIntoApp).toHaveBeenCalledWith({
      name: "project.ownchart",
      content: '{"version":1}',
      size: expect.any(Number),
    });
    expect(showLoadNotifications).toHaveBeenCalledWith(
      { ...mockResult, fileName: "project.ownchart" },
      toast
    );
  });

  it("should log error and show toast when file read fails", async () => {
    setupLaunchQueue();

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const readError = new Error("disk read failed");
    const handle = {
      getFile: vi.fn().mockRejectedValue(readError),
      kind: "file",
      name: "broken.ownchart",
      isSameEntry: vi.fn(),
      queryPermission: vi.fn(),
      requestPermission: vi.fn(),
    } as unknown as FileSystemFileHandle;

    renderHook(() => useLaunchQueue());

    await consumerFn!({ files: [handle] });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to open file from LaunchQueue:",
      readError
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to open "broken.ownchart"');

    consoleSpy.mockRestore();
  });
});
