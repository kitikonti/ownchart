/**
 * Unit tests for DependencyPropertiesPanel component.
 * Tests type selector, lag input, delete, close behavior, and rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DependencyPropertiesPanel } from "@/components/GanttChart/DependencyPropertiesPanel";
import type { Dependency, DependencyType } from "@/types/dependency.types";
import { tid } from "../../../helpers/branded";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseDependency: Dependency = {
  id: "dep-1",
  fromTaskId: tid("task-1"),
  toTaskId: tid("task-2"),
  type: "FS",
  lag: 0,
  createdAt: "2025-01-01",
};

function renderPanel(
  overrides: Partial<Parameters<typeof DependencyPropertiesPanel>[0]> = {}
): {
  onUpdateType: ReturnType<typeof vi.fn>;
  onUpdateLag: ReturnType<typeof vi.fn>;
  onDelete: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
} {
  const onUpdateType = vi.fn();
  const onUpdateLag = vi.fn();
  const onDelete = vi.fn();
  const onClose = vi.fn();

  render(
    <DependencyPropertiesPanel
      dependency={baseDependency}
      fromTaskName="Task Alpha"
      toTaskName="Task Beta"
      position={{ x: 200, y: 150 }}
      onUpdateType={onUpdateType}
      onUpdateLag={onUpdateLag}
      onDelete={onDelete}
      onClose={onClose}
      {...overrides}
    />
  );

  return { onUpdateType, onUpdateLag, onDelete, onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DependencyPropertiesPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Rendering ───────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("displays task names in header", () => {
      renderPanel();
      expect(screen.getByText("Task Alpha → Task Beta")).toBeInTheDocument();
    });

    it("renders dialog with correct role and label", () => {
      renderPanel();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-label", "Edit dependency");
    });

    it("renders type selector with current type selected", () => {
      renderPanel();
      const fsButton = screen.getByRole("radio", { name: "FS" });
      expect(fsButton).toHaveAttribute("aria-checked", "true");
    });

    it("renders lag input with current value", () => {
      renderPanel();
      const input = screen.getByLabelText("Lag");
      expect(input).toHaveValue(0);
    });

    it("renders lag input with 0 when lag is undefined", () => {
      renderPanel({
        dependency: { ...baseDependency, lag: undefined },
      });
      const input = screen.getByLabelText("Lag");
      expect(input).toHaveValue(0);
    });

    it("renders delete button", () => {
      renderPanel();
      expect(
        screen.getByRole("button", { name: /delete dependency/i })
      ).toBeInTheDocument();
    });

    it("shows full type label below selector", () => {
      renderPanel();
      expect(screen.getByText("Finish → Start")).toBeInTheDocument();
    });
  });

  // ── Type selector ─────────────────────────────────────────────────────

  describe("type selector", () => {
    it("calls onUpdateType when a different type is selected", async () => {
      const { onUpdateType } = renderPanel();
      const ssButton = screen.getByRole("radio", { name: "SS" });
      await act(async () => {
        fireEvent.click(ssButton);
      });
      expect(onUpdateType).toHaveBeenCalledWith("SS");
    });

    it("does not call onUpdateType when same type is clicked", async () => {
      const { onUpdateType } = renderPanel();
      const fsButton = screen.getByRole("radio", { name: "FS" });
      await act(async () => {
        fireEvent.click(fsButton);
      });
      expect(onUpdateType).not.toHaveBeenCalled();
    });

    it.each(["SS", "FF", "SF"] as DependencyType[])(
      "calls onUpdateType with %s",
      async (type) => {
        const { onUpdateType } = renderPanel();
        const button = screen.getByRole("radio", { name: type });
        await act(async () => {
          fireEvent.click(button);
        });
        expect(onUpdateType).toHaveBeenCalledWith(type);
      }
    );
  });

  // ── Lag input ─────────────────────────────────────────────────────────

  describe("lag input", () => {
    it("commits lag on blur", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel({
        dependency: { ...baseDependency, lag: 0 },
      });
      const input = screen.getByLabelText("Lag");
      await user.clear(input);
      await user.type(input, "5");
      await user.tab(); // blur
      expect(onUpdateLag).toHaveBeenCalledWith(5);
    });

    it("commits lag on Enter", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel({
        dependency: { ...baseDependency, lag: 0 },
      });
      const input = screen.getByLabelText("Lag");
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Enter}");
      expect(onUpdateLag).toHaveBeenCalledWith(3);
    });

    it("accepts negative lag values", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel({
        dependency: { ...baseDependency, lag: 0 },
      });
      const input = screen.getByLabelText("Lag");
      await user.clear(input);
      await user.type(input, "-2");
      await user.tab();
      expect(onUpdateLag).toHaveBeenCalledWith(-2);
    });

    it("clamps lag to max value", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel();
      const input = screen.getByLabelText("Lag");
      await user.clear(input);
      await user.type(input, "999");
      await user.tab();
      expect(onUpdateLag).toHaveBeenCalledWith(365);
    });

    it("resets to current value on invalid input", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel({
        dependency: { ...baseDependency, lag: 5 },
      });
      const input = screen.getByLabelText("Lag");
      await user.clear(input);
      await user.type(input, "abc");
      await user.tab();
      expect(onUpdateLag).not.toHaveBeenCalled();
      expect(input).toHaveValue(5);
    });

    it("does not call onUpdateLag when value is unchanged", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onUpdateLag } = renderPanel({
        dependency: { ...baseDependency, lag: 3 },
      });
      const input = screen.getByLabelText("Lag");
      // Clear and re-type the same value
      await user.clear(input);
      await user.type(input, "3");
      await user.tab();
      expect(onUpdateLag).not.toHaveBeenCalled();
    });

    it("re-syncs draft when dependency.lag changes externally", () => {
      const { rerender } = render(
        <DependencyPropertiesPanel
          dependency={{ ...baseDependency, lag: 2 }}
          fromTaskName="Task Alpha"
          toTaskName="Task Beta"
          position={{ x: 200, y: 150 }}
          onUpdateType={vi.fn()}
          onUpdateLag={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Lag")).toHaveValue(2);

      // Simulate external change (e.g. undo/redo)
      rerender(
        <DependencyPropertiesPanel
          dependency={{ ...baseDependency, lag: 7 }}
          fromTaskName="Task Alpha"
          toTaskName="Task Beta"
          position={{ x: 200, y: 150 }}
          onUpdateType={vi.fn()}
          onUpdateLag={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Lag")).toHaveValue(7);
      cleanup();
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("calls onDelete when delete button is clicked", async () => {
      const { onDelete } = renderPanel();
      const deleteBtn = screen.getByRole("button", {
        name: /delete dependency/i,
      });
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      expect(onDelete).toHaveBeenCalled();
    });
  });

  // ── Close behavior ────────────────────────────────────────────────────

  describe("close behavior", () => {
    it("calls onClose on Escape key", () => {
      const { onClose } = renderPanel();
      // Advance timer to register outside-click listener
      act(() => vi.advanceTimersByTime(1));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose on outside mousedown", () => {
      const { onClose } = renderPanel();
      // Advance timer to register the deferred mousedown listener
      act(() => vi.advanceTimersByTime(1));
      fireEvent.mouseDown(document.body);
      expect(onClose).toHaveBeenCalled();
    });

    it("does not close on click inside panel", () => {
      const { onClose } = renderPanel();
      act(() => vi.advanceTimersByTime(1));
      const dialog = screen.getByRole("dialog");
      fireEvent.mouseDown(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
