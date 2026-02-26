/**
 * Tests for useIsCellEditing hook.
 * Verifies that the focused selector returns true only when the specified
 * cell is both active and in edit mode.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsCellEditing } from "../../../src/hooks/useIsCellEditing";

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
    })
  ),
}));

import { useTaskStore } from "../../../src/store/slices/taskSlice";

function mockStoreState(
  taskId: string | null,
  field: string | null,
  isEditingCell: boolean
): void {
  vi.mocked(useTaskStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        activeCell: { taskId, field },
        isEditingCell,
      }) as never
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useIsCellEditing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState(null, null, false);
  });

  it("returns false when no cell is active", () => {
    const { result } = renderHook(() => useIsCellEditing("task-1", "name"));
    expect(result.current).toBe(false);
  });

  it("returns false when a different cell is active and editing", () => {
    mockStoreState("task-2", "name", true);
    const { result } = renderHook(() => useIsCellEditing("task-1", "name"));
    expect(result.current).toBe(false);
  });

  it("returns false when the correct cell is active but not editing", () => {
    mockStoreState("task-1", "name", false);
    const { result } = renderHook(() => useIsCellEditing("task-1", "name"));
    expect(result.current).toBe(false);
  });

  it("returns false when the correct task is editing a different field", () => {
    mockStoreState("task-1", "color", true);
    const { result } = renderHook(() => useIsCellEditing("task-1", "name"));
    expect(result.current).toBe(false);
  });

  it("returns true when the exact cell is active and editing", () => {
    mockStoreState("task-1", "name", true);
    const { result } = renderHook(() => useIsCellEditing("task-1", "name"));
    expect(result.current).toBe(true);
  });

  it("works with different field types", () => {
    mockStoreState("task-1", "color", true);
    const { result } = renderHook(() => useIsCellEditing("task-1", "color"));
    expect(result.current).toBe(true);
  });
});
