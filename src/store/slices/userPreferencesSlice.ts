/**
 * User Preferences slice for Zustand store.
 * Manages user preferences with localStorage persistence.
 * Includes: UI Density, Date Format, First Day of Week, Week Numbering.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  UiDensity,
  UserPreferences,
  DensityConfig,
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
} from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import {
  DEFAULT_PREFERENCES,
  detectLocaleDateFormat,
  detectLocaleFirstDayOfWeek,
  detectLocaleWeekNumberingSystem,
} from "../../utils/localeDetection";
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

  // Regional settings actions
  setDateFormat: (format: DateFormat) => void;
  setFirstDayOfWeek: (day: FirstDayOfWeek) => void;
  setWeekNumberingSystem: (system: WeekNumberingSystem) => void;

  // Initialization
  initializePreferences: () => void;
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

// Valid values for runtime validation of localStorage data.
// Arrays are typed with the union type so TypeScript errors if a value is added
// to the union but not to the validation set.
const VALID_DENSITIES: ReadonlySet<string> = new Set([
  "compact",
  "normal",
  "comfortable",
] as const satisfies readonly UiDensity[]);
const VALID_DATE_FORMATS: ReadonlySet<string> = new Set([
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
] as const satisfies readonly DateFormat[]);
const VALID_FIRST_DAYS: ReadonlySet<string> = new Set([
  "sunday",
  "monday",
] as const satisfies readonly FirstDayOfWeek[]);
const VALID_WEEK_SYSTEMS: ReadonlySet<string> = new Set([
  "iso",
  "us",
] as const satisfies readonly WeekNumberingSystem[]);

/**
 * Validate a stored value against a set of valid options.
 * Returns the value if valid, undefined otherwise.
 */
function validateStored<T extends string>(
  value: unknown,
  validSet: ReadonlySet<string>
): T | undefined {
  return typeof value === "string" && validSet.has(value)
    ? (value as T)
    : undefined;
}

/**
 * Migrate stored preferences to current schema.
 * Validates types at runtime (localStorage data is untrusted)
 * and adds missing fields with locale-detected defaults.
 */
function migratePreferences(stored: Record<string, unknown>): UserPreferences {
  return {
    uiDensity:
      validateStored<UiDensity>(stored.uiDensity, VALID_DENSITIES) ??
      DEFAULT_PREFERENCES.uiDensity,
    dateFormat:
      validateStored<DateFormat>(stored.dateFormat, VALID_DATE_FORMATS) ??
      detectLocaleDateFormat(),
    firstDayOfWeek:
      validateStored<FirstDayOfWeek>(stored.firstDayOfWeek, VALID_FIRST_DAYS) ??
      detectLocaleFirstDayOfWeek(),
    weekNumberingSystem:
      validateStored<WeekNumberingSystem>(
        stored.weekNumberingSystem,
        VALID_WEEK_SYSTEMS
      ) ?? detectLocaleWeekNumberingSystem(),
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

      setUiDensity: (density: UiDensity): void => {
        set((state) => {
          state.preferences.uiDensity = density;
        });
      },

      setDateFormat: (format: DateFormat): void => {
        set((state) => {
          state.preferences.dateFormat = format;
        });
      },

      setFirstDayOfWeek: (day: FirstDayOfWeek): void => {
        set((state) => {
          state.preferences.firstDayOfWeek = day;
        });
      },

      setWeekNumberingSystem: (system: WeekNumberingSystem): void => {
        set((state) => {
          state.preferences.weekNumberingSystem = system;
        });
      },

      // Initialize all preferences on app start
      // Handles migration for legacy users and new settings
      initializePreferences: (): void => {
        const state = get();

        // Only run initialization once
        if (state.isInitialized) {
          return;
        }

        // Check if this is a legacy user who hasn't set density preference yet
        // Legacy users (before v1.1) should default to "comfortable" to maintain their experience
        const storedPrefsRaw = localStorage.getItem(PREFERENCES_KEY);
        let storedPrefs: Record<string, unknown> | null = null;
        if (storedPrefsRaw) {
          try {
            const parsed: unknown = JSON.parse(storedPrefsRaw);
            const prefs =
              typeof parsed === "object" && parsed !== null
                ? (parsed as Record<string, unknown>)["state"]
                : undefined;
            const prefsObj =
              typeof prefs === "object" && prefs !== null
                ? (prefs as Record<string, unknown>)["preferences"]
                : undefined;
            storedPrefs =
              typeof prefsObj === "object" && prefsObj !== null
                ? (prefsObj as Record<string, unknown>)
                : null;
          } catch {
            // Corrupt localStorage data — fall back to defaults
            storedPrefs = null;
          }
        }
        const hasStoredDensity =
          storedPrefs !== null &&
          validateStored<UiDensity>(storedPrefs.uiDensity, VALID_DENSITIES) !==
            undefined;

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

// Apply density CSS class whenever uiDensity changes (side effect kept out of Immer)
let _prevDensity: UiDensity | null = null;
useUserPreferencesStore.subscribe((state) => {
  const density = state.preferences.uiDensity;
  if (density !== _prevDensity) {
    _prevDensity = density;
    applyDensityClass(density);
  }
});

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
