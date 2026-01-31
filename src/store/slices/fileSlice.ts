/**
 * File slice for Zustand store.
 * Manages file state including name, dirty flag, and last saved timestamp.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * File state interface.
 */
interface FileState {
  fileName: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  chartId: string | null;
}

/**
 * File actions interface.
 */
interface FileActions {
  setFileName: (name: string | null) => void;
  setChartId: (id: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setLastSaved: (date: Date) => void;
  reset: () => void;
}

/**
 * Combined store interface.
 */
type FileStore = FileState & FileActions;

/**
 * File store hook with immer middleware for immutable updates.
 */
export const useFileStore = create<FileStore>()(
  immer((set) => ({
    // State
    fileName: null,
    isDirty: false,
    lastSaved: null,
    chartId: null,

    // Actions
    setFileName: (name): void =>
      set((state) => {
        state.fileName = name;
      }),

    setChartId: (id): void =>
      set((state) => {
        state.chartId = id;
      }),

    markDirty: (): void =>
      set((state) => {
        state.isDirty = true;
      }),

    markClean: (): void =>
      set((state) => {
        state.isDirty = false;
      }),

    setLastSaved: (date): void =>
      set((state) => {
        state.lastSaved = date;
        state.isDirty = false;
      }),

    reset: (): void =>
      set((state) => {
        state.fileName = null;
        state.isDirty = false;
        state.lastSaved = null;
        state.chartId = null;
      }),
  }))
);
