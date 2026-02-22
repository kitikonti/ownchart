/**
 * Unit tests for useCellNavigation hook.
 * Covers: isCellActive, isCellEditing utility functions and store selector wiring.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCellNavigation } from "../../../src/hooks/useCellNavigation";
import type { EditableField } from "../../../src/store/slices/taskSlice";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

let mockActiveCell = {
  taskId: null as string | null,
  field: null as EditableField | null,
};
let mockIsEditingCell = false;
const mockSetActiveCell = vi.fn();
const mockNavigateCell = vi.fn();
const mockStartCellEdit = vi.fn();
const mockStopCellEdit = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeCell: mockActiveCell,
      isEditingCell: mockIsEditingCell,
      setActiveCell: mockSetActiveCell,
      navigateCell: mockNavigateCell,
      startCellEdit: mockStartCellEdit,
      stopCellEdit: mockStopCellEdit,
    })
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCellNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveCell = { taskId: null, field: null };
    mockIsEditingCell = false;
  });

  it("returns store state and actions", () => {
    const { result } = renderHook(() => useCellNavigation());

    expect(result.current.activeCell).toEqual({ taskId: null, field: null });
    expect(result.current.isEditingCell).toBe(false);
    expect(result.current.setActiveCell).toBe(mockSetActiveCell);
    expect(result.current.navigateCell).toBe(mockNavigateCell);
    expect(result.current.startCellEdit).toBe(mockStartCellEdit);
    expect(result.current.stopCellEdit).toBe(mockStopCellEdit);
  });

  describe("isCellActive", () => {
    it("returns false when no cell is active", () => {
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellActive("task-1", "name")).toBe(false);
    });

    it("returns true when the specified cell is active", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellActive("task-1", "name")).toBe(true);
    });

    it("returns false when a different task is active", () => {
      mockActiveCell = { taskId: "task-2", field: "name" };
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellActive("task-1", "name")).toBe(false);
    });

    it("returns false when a different field is active", () => {
      mockActiveCell = { taskId: "task-1", field: "duration" };
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellActive("task-1", "name")).toBe(false);
    });
  });

  describe("isCellEditing", () => {
    it("returns false when no cell is active", () => {
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellEditing("task-1", "name")).toBe(false);
    });

    it("returns false when cell is active but not editing", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      mockIsEditingCell = false;
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellEditing("task-1", "name")).toBe(false);
    });

    it("returns true when cell is active and editing", () => {
      mockActiveCell = { taskId: "task-1", field: "name" };
      mockIsEditingCell = true;
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellEditing("task-1", "name")).toBe(true);
    });

    it("returns false when a different cell is editing", () => {
      mockActiveCell = { taskId: "task-2", field: "name" };
      mockIsEditingCell = true;
      const { result } = renderHook(() => useCellNavigation());
      expect(result.current.isCellEditing("task-1", "name")).toBe(false);
    });
  });
});
