/**
 * Unit tests for User Preferences slice
 * Sprint 1.5.9: User Preferences & Settings
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import {
  useUserPreferencesStore,
  applyDensityClass,
  getCurrentDensityConfig,
  getCurrentDateFormat,
} from "../../../src/store/slices/userPreferencesSlice";
import {
  DENSITY_CONFIG,
  DEFAULT_PREFERENCES,
} from "../../../src/types/preferences.types";

describe("userPreferencesSlice", () => {
  // Store the original document element classes
  let originalClasses: string[];

  beforeEach(() => {
    // Save original classes
    originalClasses = Array.from(document.documentElement.classList);

    // Reset store to default state
    useUserPreferencesStore.setState({
      preferences: { ...DEFAULT_PREFERENCES },
      isInitialized: false,
    });

    // Clear localStorage mock
    localStorage.clear();
  });

  afterEach(() => {
    // Restore original classes
    document.documentElement.className = originalClasses.join(" ");
  });

  describe("initial state", () => {
    it("should have default preferences", () => {
      const state = useUserPreferencesStore.getState();

      expect(state.preferences.uiDensity).toBe(DEFAULT_PREFERENCES.uiDensity);
      expect(state.preferences.dateFormat).toBe(DEFAULT_PREFERENCES.dateFormat);
      expect(state.preferences.firstDayOfWeek).toBe(
        DEFAULT_PREFERENCES.firstDayOfWeek
      );
    });
  });

  describe("setUiDensity", () => {
    it("should set density to compact", () => {
      act(() => {
        useUserPreferencesStore.getState().setUiDensity("compact");
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "compact"
      );
    });

    it("should set density to comfortable", () => {
      act(() => {
        useUserPreferencesStore.getState().setUiDensity("comfortable");
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "comfortable"
      );
    });

    it("should apply CSS class when setting density", () => {
      act(() => {
        useUserPreferencesStore.getState().setUiDensity("compact");
      });

      expect(document.documentElement.classList.contains("density-compact")).toBe(
        true
      );
    });

    it("should remove old density class when changing", () => {
      act(() => {
        useUserPreferencesStore.getState().setUiDensity("compact");
      });
      expect(document.documentElement.classList.contains("density-compact")).toBe(
        true
      );

      act(() => {
        useUserPreferencesStore.getState().setUiDensity("comfortable");
      });

      expect(document.documentElement.classList.contains("density-compact")).toBe(
        false
      );
      expect(
        document.documentElement.classList.contains("density-comfortable")
      ).toBe(true);
    });
  });

  describe("setDateFormat", () => {
    it("should set date format to DD/MM/YYYY", () => {
      act(() => {
        useUserPreferencesStore.getState().setDateFormat("DD/MM/YYYY");
      });

      expect(useUserPreferencesStore.getState().preferences.dateFormat).toBe(
        "DD/MM/YYYY"
      );
    });

    it("should set date format to MM/DD/YYYY", () => {
      act(() => {
        useUserPreferencesStore.getState().setDateFormat("MM/DD/YYYY");
      });

      expect(useUserPreferencesStore.getState().preferences.dateFormat).toBe(
        "MM/DD/YYYY"
      );
    });

    it("should set date format to YYYY-MM-DD", () => {
      act(() => {
        useUserPreferencesStore.getState().setDateFormat("YYYY-MM-DD");
      });

      expect(useUserPreferencesStore.getState().preferences.dateFormat).toBe(
        "YYYY-MM-DD"
      );
    });
  });

  describe("setFirstDayOfWeek", () => {
    it("should set first day to sunday", () => {
      act(() => {
        useUserPreferencesStore.getState().setFirstDayOfWeek("sunday");
      });

      expect(useUserPreferencesStore.getState().preferences.firstDayOfWeek).toBe(
        "sunday"
      );
    });

    it("should set first day to monday", () => {
      act(() => {
        useUserPreferencesStore.getState().setFirstDayOfWeek("monday");
      });

      expect(useUserPreferencesStore.getState().preferences.firstDayOfWeek).toBe(
        "monday"
      );
    });
  });

  describe("setWeekNumberingSystem", () => {
    it("should set week numbering to iso", () => {
      act(() => {
        useUserPreferencesStore.getState().setWeekNumberingSystem("iso");
      });

      expect(
        useUserPreferencesStore.getState().preferences.weekNumberingSystem
      ).toBe("iso");
    });

    it("should set week numbering to us", () => {
      act(() => {
        useUserPreferencesStore.getState().setWeekNumberingSystem("us");
      });

      expect(
        useUserPreferencesStore.getState().preferences.weekNumberingSystem
      ).toBe("us");
    });
  });

  describe("initializePreferences", () => {
    it("should only initialize once", () => {
      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().isInitialized).toBe(true);

      // Change a preference
      act(() => {
        useUserPreferencesStore.getState().setUiDensity("compact");
      });

      // Initialize again
      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      // Should still be compact (not reset)
      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "compact"
      );
    });

    it("should apply density CSS on initialization", () => {
      // Set to compact before initializing
      useUserPreferencesStore.setState({
        preferences: { ...DEFAULT_PREFERENCES, uiDensity: "compact" },
        isInitialized: false,
      });

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(document.documentElement.classList.contains("density-compact")).toBe(
        true
      );
    });

    it("should set comfortable density for legacy users without stored density", () => {
      // Simulate a legacy user who dismissed the welcome tour but has no density pref
      localStorage.setItem("ownchart-welcome-dismissed", "true");

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "comfortable"
      );
    });

    it("should not override stored density for legacy users", () => {
      // Simulate a legacy user who already chose compact
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { uiDensity: "compact" } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "compact"
      );
    });

    it("should handle corrupt localStorage data gracefully", () => {
      localStorage.setItem("ownchart-preferences", "not-valid-json{{{");

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      // Should initialize with defaults without crashing
      expect(useUserPreferencesStore.getState().isInitialized).toBe(true);
      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should use default density for new users (not legacy)", () => {
      // No welcome-dismissed key = new user
      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should migrate partial preferences (only dateFormat stored)", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { dateFormat: "DD/MM/YYYY" } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      const prefs = useUserPreferencesStore.getState().preferences;
      expect(prefs.dateFormat).toBe("DD/MM/YYYY");
      // Missing fields should get defaults
      expect(prefs.uiDensity).toBe(DEFAULT_PREFERENCES.uiDensity);
    });

    it("should reject invalid uiDensity type and fall back to default", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { uiDensity: 42 } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should reject invalid uiDensity string and fall back to default", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { uiDensity: "extra-large" } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should reject invalid dateFormat and fall back to locale detection", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { dateFormat: true } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      // Should be a valid DateFormat (from locale detection), not boolean
      const format = useUserPreferencesStore.getState().preferences.dateFormat;
      expect(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).toContain(format);
    });

    it("should reject invalid weekNumberingSystem and fall back", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { weekNumberingSystem: "metric" } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      const system =
        useUserPreferencesStore.getState().preferences.weekNumberingSystem;
      expect(["iso", "us"]).toContain(system);
    });

    it("should handle localStorage with non-object preferences gracefully", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: "not-an-object" },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().isInitialized).toBe(true);
      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should handle localStorage with missing state key gracefully", () => {
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({ version: 1 })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().isInitialized).toBe(true);
      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        DEFAULT_PREFERENCES.uiDensity
      );
    });

    it("should treat invalid stored density as unset for legacy user detection", () => {
      // Legacy user with an invalid density value — should get "comfortable"
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem(
        "ownchart-preferences",
        JSON.stringify({
          state: { preferences: { uiDensity: 999 } },
        })
      );

      act(() => {
        useUserPreferencesStore.getState().initializePreferences();
      });

      expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
        "comfortable"
      );
    });
  });
});

describe("applyDensityClass", () => {
  beforeEach(() => {
    // Clear all density classes
    document.documentElement.classList.remove(
      "density-compact",
      "density-normal",
      "density-comfortable"
    );
  });

  it("should add compact class", () => {
    applyDensityClass("compact");
    expect(document.documentElement.classList.contains("density-compact")).toBe(
      true
    );
  });

  it("should add comfortable class", () => {
    applyDensityClass("comfortable");
    expect(
      document.documentElement.classList.contains("density-comfortable")
    ).toBe(true);
  });

  it("should not add class for normal density", () => {
    applyDensityClass("normal");
    expect(document.documentElement.classList.contains("density-normal")).toBe(
      false
    );
    expect(document.documentElement.classList.contains("density-compact")).toBe(
      false
    );
    expect(
      document.documentElement.classList.contains("density-comfortable")
    ).toBe(false);
  });

  it("should remove previous density classes", () => {
    applyDensityClass("compact");
    expect(document.documentElement.classList.contains("density-compact")).toBe(
      true
    );

    applyDensityClass("comfortable");
    expect(document.documentElement.classList.contains("density-compact")).toBe(
      false
    );
    expect(
      document.documentElement.classList.contains("density-comfortable")
    ).toBe(true);
  });
});

describe("getCurrentDensityConfig", () => {
  beforeEach(() => {
    useUserPreferencesStore.setState({
      preferences: { ...DEFAULT_PREFERENCES },
      isInitialized: false,
    });
  });

  it("should return current density config without hook", () => {
    const config = getCurrentDensityConfig();
    expect(config).toEqual(DENSITY_CONFIG.normal);
  });

  it("should reflect changes after setUiDensity", () => {
    act(() => {
      useUserPreferencesStore.getState().setUiDensity("compact");
    });

    const config = getCurrentDensityConfig();
    expect(config).toEqual(DENSITY_CONFIG.compact);
  });
});

describe("getCurrentDateFormat", () => {
  beforeEach(() => {
    useUserPreferencesStore.setState({
      preferences: { ...DEFAULT_PREFERENCES },
      isInitialized: false,
    });
  });

  it("should return current date format without hook", () => {
    const format = getCurrentDateFormat();
    expect(format).toBe(DEFAULT_PREFERENCES.dateFormat);
  });

  it("should reflect changes after setDateFormat", () => {
    act(() => {
      useUserPreferencesStore.getState().setDateFormat("DD/MM/YYYY");
    });

    const format = getCurrentDateFormat();
    expect(format).toBe("DD/MM/YYYY");
  });
});

describe("DENSITY_CONFIG values", () => {
  it("should have correct compact values", () => {
    expect(DENSITY_CONFIG.compact.rowHeight).toBe(28);
    expect(DENSITY_CONFIG.compact.taskBarHeight).toBe(20);
    expect(DENSITY_CONFIG.compact.taskBarOffset).toBe(4);
    expect(DENSITY_CONFIG.compact.iconSize).toBe(14);
  });

  it("should have correct normal values", () => {
    expect(DENSITY_CONFIG.normal.rowHeight).toBe(36);
    expect(DENSITY_CONFIG.normal.taskBarHeight).toBe(26);
    expect(DENSITY_CONFIG.normal.taskBarOffset).toBe(5);
    expect(DENSITY_CONFIG.normal.iconSize).toBe(16);
  });

  it("should have correct comfortable values", () => {
    expect(DENSITY_CONFIG.comfortable.rowHeight).toBe(44);
    expect(DENSITY_CONFIG.comfortable.taskBarHeight).toBe(32);
    expect(DENSITY_CONFIG.comfortable.taskBarOffset).toBe(6);
    expect(DENSITY_CONFIG.comfortable.iconSize).toBe(18);
  });
});
