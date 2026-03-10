/**
 * Tests for useDocumentTitle hook.
 * Verifies document.title is set correctly based on file name and dirty state.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useDocumentTitle } from "../../../src/hooks/useDocumentTitle";
import { useFileStore } from "../../../src/store/slices/fileSlice";

// ─── Setup ───

const ORIGINAL_TITLE = document.title;

beforeEach(() => {
  document.title = ORIGINAL_TITLE;
  // Reset file store to clean state
  useFileStore.setState({ fileName: null, isDirty: false });
});

afterEach(() => {
  document.title = ORIGINAL_TITLE;
});

// ─── Tests ───

describe("useDocumentTitle", () => {
  it("should show 'OwnChart' when no file is loaded and not dirty", () => {
    useFileStore.setState({ fileName: null, isDirty: false });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("OwnChart");
  });

  it("should show 'OwnChart*' when no file is loaded but has unsaved changes", () => {
    useFileStore.setState({ fileName: null, isDirty: true });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("OwnChart*");
  });

  it("should show 'filename.ownchart - OwnChart' when file is loaded and clean", () => {
    useFileStore.setState({ fileName: "my-project.ownchart", isDirty: false });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("my-project.ownchart - OwnChart");
  });

  it("should show 'filename.ownchart* - OwnChart' when file is loaded and dirty", () => {
    useFileStore.setState({ fileName: "my-project.ownchart", isDirty: true });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("my-project.ownchart* - OwnChart");
  });

  it("should update title reactively when isDirty changes", () => {
    useFileStore.setState({ fileName: "project.ownchart", isDirty: false });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("project.ownchart - OwnChart");

    act(() => {
      useFileStore.setState({ isDirty: true });
    });

    expect(document.title).toBe("project.ownchart* - OwnChart");
  });

  it("should update title reactively when fileName changes", () => {
    useFileStore.setState({ fileName: null, isDirty: false });

    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("OwnChart");

    act(() => {
      useFileStore.setState({ fileName: "new-file.ownchart" });
    });

    expect(document.title).toBe("new-file.ownchart - OwnChart");
  });

  it("should reset title to OwnChart on unmount", () => {
    useFileStore.setState({ fileName: "project.ownchart", isDirty: true });

    const { unmount } = renderHook(() => useDocumentTitle());

    expect(document.title).toBe("project.ownchart* - OwnChart");

    unmount();

    expect(document.title).toBe("OwnChart");
  });
});
