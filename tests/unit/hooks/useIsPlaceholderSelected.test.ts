/**
 * Tests for useIsPlaceholderSelected hook.
 * Verifies that the focused selector returns true only when the placeholder
 * row is included in the current selection set.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsPlaceholderSelected } from "@/hooks/useIsPlaceholderSelected";

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

vi.mock("@/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ selectedTaskIds: [] })
  ),
}));

vi.mock("@/config/placeholderRow", () => ({
  PLACEHOLDER_TASK_ID: "__new_task_placeholder__",
}));

import { useTaskStore } from "@/store/slices/taskSlice";

function mockSelection(selectedTaskIds: string[]): void {
  vi.mocked(useTaskStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ selectedTaskIds }) as never
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useIsPlaceholderSelected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelection([]);
  });

  it("returns false when selection is empty", () => {
    const { result } = renderHook(() => useIsPlaceholderSelected());
    expect(result.current).toBe(false);
  });

  it("returns false when other tasks are selected but not the placeholder", () => {
    mockSelection(["task-1", "task-2"]);
    const { result } = renderHook(() => useIsPlaceholderSelected());
    expect(result.current).toBe(false);
  });

  it("returns true when the placeholder is the only selected item", () => {
    mockSelection(["__new_task_placeholder__"]);
    const { result } = renderHook(() => useIsPlaceholderSelected());
    expect(result.current).toBe(true);
  });

  it("returns true when the placeholder is selected alongside other tasks", () => {
    mockSelection(["task-1", "__new_task_placeholder__", "task-2"]);
    const { result } = renderHook(() => useIsPlaceholderSelected());
    expect(result.current).toBe(true);
  });
});
