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
  DEFAULT_PREFERENCES,
  DENSITY_CONFIG,
} from "../../types/preferences.types";

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
  setUiDensity: (density: UiDensity) => void;
  getDensityConfig: () => DensityConfig;
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
  html.classList.remove("density-compact", "density-normal", "density-comfortable");

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

      // Initialize density on app start
      // Handles migration for legacy users
      initializeDensity: () => {
        const state = get();

        // Only run initialization once
        if (state.isInitialized) {
          return;
        }

        // Check if this is a legacy user who hasn't set density preference yet
        // Legacy users (before v1.1) should default to "comfortable" to maintain their experience
        const storedPrefs = localStorage.getItem(PREFERENCES_KEY);
        const hasStoredDensity = storedPrefs && JSON.parse(storedPrefs)?.state?.preferences?.uiDensity;

        if (!hasStoredDensity && isLegacyUser()) {
          // Migrate legacy user to comfortable
          set((s) => {
            s.preferences.uiDensity = "comfortable";
            s.isInitialized = true;
          });
          applyDensityClass("comfortable");
        } else {
          // Apply current density setting
          set((s) => {
            s.isInitialized = true;
          });
          applyDensityClass(state.preferences.uiDensity);
        }
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

/**
 * Hook to get current density config values
 * Use this in components that need density-aware styling
 */
export function useDensityConfig(): DensityConfig {
  const density = useUserPreferencesStore((state) => state.preferences.uiDensity);
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
