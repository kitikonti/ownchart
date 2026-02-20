/**
 * Unit tests for chartSlice miscellaneous setters
 * Covers: setProjectTitle, setProjectAuthor, setTaskTableCollapsed, setColorModeState
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/types/colorMode.types";
import type { ColorModeState } from "../../../src/types/colorMode.types";

describe("Chart Store - Misc Setters", () => {
  beforeEach(() => {
    useChartStore.setState({
      projectTitle: "",
      projectAuthor: "",
      isTaskTableCollapsed: false,
      colorModeState: structuredClone(DEFAULT_COLOR_MODE_STATE),
    });
  });

  describe("setProjectTitle", () => {
    it("should have empty string as default", () => {
      expect(useChartStore.getState().projectTitle).toBe("");
    });

    it("should set project title", () => {
      act(() => {
        useChartStore.getState().setProjectTitle("My Project");
      });
      expect(useChartStore.getState().projectTitle).toBe("My Project");
    });

    it("should overwrite existing title", () => {
      act(() => {
        useChartStore.getState().setProjectTitle("First");
      });
      act(() => {
        useChartStore.getState().setProjectTitle("Second");
      });
      expect(useChartStore.getState().projectTitle).toBe("Second");
    });
  });

  describe("setProjectAuthor", () => {
    it("should have empty string as default", () => {
      expect(useChartStore.getState().projectAuthor).toBe("");
    });

    it("should set project author", () => {
      act(() => {
        useChartStore.getState().setProjectAuthor("Martin");
      });
      expect(useChartStore.getState().projectAuthor).toBe("Martin");
    });

    it("should overwrite existing author", () => {
      act(() => {
        useChartStore.getState().setProjectAuthor("Alice");
      });
      act(() => {
        useChartStore.getState().setProjectAuthor("Bob");
      });
      expect(useChartStore.getState().projectAuthor).toBe("Bob");
    });
  });

  describe("setTaskTableCollapsed", () => {
    it("should default to false", () => {
      expect(useChartStore.getState().isTaskTableCollapsed).toBe(false);
    });

    it("should set collapsed to true", () => {
      act(() => {
        useChartStore.getState().setTaskTableCollapsed(true);
      });
      expect(useChartStore.getState().isTaskTableCollapsed).toBe(true);
    });

    it("should set collapsed back to false", () => {
      act(() => {
        useChartStore.getState().setTaskTableCollapsed(true);
      });
      act(() => {
        useChartStore.getState().setTaskTableCollapsed(false);
      });
      expect(useChartStore.getState().isTaskTableCollapsed).toBe(false);
    });
  });

  describe("setColorModeState", () => {
    it("should replace entire color mode state", () => {
      const newState: ColorModeState = {
        ...structuredClone(DEFAULT_COLOR_MODE_STATE),
        mode: "theme",
        themeOptions: {
          ...DEFAULT_COLOR_MODE_STATE.themeOptions,
          selectedPaletteId: "d3-category10",
        },
      };

      act(() => {
        useChartStore.getState().setColorModeState(newState);
      });

      const result = useChartStore.getState().colorModeState;
      expect(result.mode).toBe("theme");
      expect(result.themeOptions.selectedPaletteId).toBe("d3-category10");
    });

    it("should overwrite previous state completely", () => {
      act(() => {
        useChartStore.getState().setColorModeState({
          ...structuredClone(DEFAULT_COLOR_MODE_STATE),
          mode: "summary",
        });
      });

      act(() => {
        useChartStore.getState().setColorModeState(
          structuredClone(DEFAULT_COLOR_MODE_STATE)
        );
      });

      expect(useChartStore.getState().colorModeState.mode).toBe("manual");
    });
  });
});
