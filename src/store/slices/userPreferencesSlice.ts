/**
 * User Preferences slice for Zustand store.
 * Manages user preferences with localStorage persistence.
 * Sprint 1.5.9.1: UI Density settings
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  type UiDensity,
  type UserPreferences,
  type DensityConfig,
  type DateFormat,
  type FirstDayOfWeek,
  type WeekNumberingSystem,
  DEFAULT_PREFERENCES,
  DENSITY_CONFIG,
  detectLocaleDateFormat,
  detectLocaleFirstDayOfWeek,
  detectLocaleWeekNumberingSystem,
} from "../../types/preferences.types";
import {
  registerFirstDayOfWeekGetter,
  registerWeekNumberingSystemGetter,
} from "../../utils/timelineUtils";

// LocalStorage key
const PREFERENCES_KEY = "ownchart-preferences";

// Migration key to track if user existed before v1.1
const LEGACY_USER_KEY = "ownchart-welcome-dismissed";

/**
 * User preferences state interface
 */
interface UserPreferencesState {
  preferences: UserPreferences;
  isInitialized: boolean;
}

/**
 * User preferences actions interface
 */
interface UserPreferencesActions {
  // Appearance actions
  setUiDensity: (density: UiDensity) => void;
  getDensityConfig: () => DensityConfig;

  // Regional settings actions
  setDateFormat: (format: DateFormat) => void;
  setFirstDayOfWeek: (day: FirstDayOfWeek) => void;
  setWeekNumberingSystem: (system: WeekNumberingSystem) => void;

  // Initialization
  initializePreferences: () => void;
  /** @deprecated Use initializePreferences instead */
  initializeDensity: () => void;
}

/**
 * Combined store interface
 */
type UserPreferencesStore = UserPreferencesState & UserPreferencesActions;

/**
 * Apply density class to document element.
 * Called when density changes to update CSS custom properties.
 */
export function applyDensityClass(density: UiDensity): void {
  const html = document.documentElement;

  // Remove all density classes
  html.classList.remove(
    "density-compact",
    "density-normal",
    "density-comfortable"
  );

  // Apply new class (normal doesn't need a class - it's the CSS default)
  if (density !== "normal") {
    html.classList.add(`density-${density}`);
  }
}

/**
 * Check if user is a legacy user (existed before v1.1)
 * Legacy users should get "comfortable" as their default to maintain their experience
 */
function isLegacyUser(): boolean {
  // If they've dismissed the welcome tour before, they're a legacy user
  return localStorage.getItem(LEGACY_USER_KEY) === "true";
}

/**
 * Migrate stored preferences to current schema
 * Adds missing fields with locale-detected defaults
 */
function migratePreferences(stored: Partial<UserPreferences>): UserPreferences {
  return {
    // Appearance
    uiDensity: stored.uiDensity ?? DEFAULT_PREFERENCES.uiDensity,

    // Regional - use locale detection for new fields
    dateFormat: stored.dateFormat ?? detectLocaleDateFormat(),
    firstDayOfWeek: stored.firstDayOfWeek ?? detectLocaleFirstDayOfWeek(),
    weekNumberingSystem:
      stored.weekNumberingSystem ?? detectLocaleWeekNumberingSystem(),
  };
}

/**
 * User preferences store with localStorage persistence
 */
export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      preferences: DEFAULT_PREFERENCES,
      isInitialized: false,

      // Set UI density
      setUiDensity: (density: UiDensity) => {
        set((state) => {
          state.preferences.uiDensity = density;
        });
        // Apply CSS class to document
        applyDensityClass(density);
      },

      // Get current density configuration values
      getDensityConfig: (): DensityConfig => {
        const { preferences } = get();
        return DENSITY_CONFIG[preferences.uiDensity];
      },

      // Set date format
      setDateFormat: (format: DateFormat) => {
        set((state) => {
          state.preferences.dateFormat = format;
        });
      },

      // Set first day of week
      setFirstDayOfWeek: (day: FirstDayOfWeek) => {
        set((state) => {
          state.preferences.firstDayOfWeek = day;
        });
      },

      // Set week numbering system
      setWeekNumberingSystem: (system: WeekNumberingSystem) => {
        set((state) => {
          state.preferences.weekNumberingSystem = system;
        });
      },

      // Initialize all preferences on app start
      // Handles migration for legacy users and new settings
      initializePreferences: () => {
        const state = get();

        // Only run initialization once
        if (state.isInitialized) {
          return;
        }

        // Check if this is a legacy user who hasn't set density preference yet
        // Legacy users (before v1.1) should default to "comfortable" to maintain their experience
        const storedPrefsRaw = localStorage.getItem(PREFERENCES_KEY);
        const storedPrefs = storedPrefsRaw
          ? JSON.parse(storedPrefsRaw)?.state?.preferences
          : null;
        const hasStoredDensity = storedPrefs?.uiDensity;

        // Migrate preferences to fill in any missing fields
        const migratedPrefs = migratePreferences(storedPrefs || {});

        // Handle legacy user density
        if (!hasStoredDensity && isLegacyUser()) {
          migratedPrefs.uiDensity = "comfortable";
        }

        set((s) => {
          s.preferences = migratedPrefs;
          s.isInitialized = true;
        });

        // Apply density CSS
        applyDensityClass(migratedPrefs.uiDensity);
      },

      // Deprecated - use initializePreferences
      initializeDensity: () => {
        get().initializePreferences();
      },
    })),
    {
      name: PREFERENCES_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the preferences, not transient state
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Register the first day of week getter for timelineUtils
// This avoids circular dependencies while allowing timelineUtils to access the preference
registerFirstDayOfWeekGetter(
  () => useUserPreferencesStore.getState().preferences.firstDayOfWeek
);

// Register the week numbering system getter for timelineUtils
registerWeekNumberingSystemGetter(
  () => useUserPreferencesStore.getState().preferences.weekNumberingSystem
);

/**
 * Hook to get current density config values
 * Use this in components that need density-aware styling
 */
export function useDensityConfig(): DensityConfig {
  const density = useUserPreferencesStore(
    (state) => state.preferences.uiDensity
  );
  return DENSITY_CONFIG[density];
}

/**
 * Hook to get current density mode
 */
export function useUiDensity(): UiDensity {
  return useUserPreferencesStore((state) => state.preferences.uiDensity);
}

/**
 * Selector for current density (for non-hook usage)
 */
export function getCurrentDensityConfig(): DensityConfig {
  const density = useUserPreferencesStore.getState().preferences.uiDensity;
  return DENSITY_CONFIG[density];
}

/**
 * Hook to get current date format preference
 */
export function useDateFormat(): DateFormat {
  return useUserPreferencesStore((state) => state.preferences.dateFormat);
}

/**
 * Hook to get current first day of week preference
 */
export function useFirstDayOfWeek(): FirstDayOfWeek {
  return useUserPreferencesStore((state) => state.preferences.firstDayOfWeek);
}

/**
 * Hook to get current week numbering system preference
 */
export function useWeekNumberingSystem(): WeekNumberingSystem {
  return useUserPreferencesStore(
    (state) => state.preferences.weekNumberingSystem
  );
}

/**
 * Selector for current date format (for non-hook usage)
 */
export function getCurrentDateFormat(): DateFormat {
  return useUserPreferencesStore.getState().preferences.dateFormat;
}
