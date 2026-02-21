import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface FileState {
  fileName: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  chartId: string | null;
}

interface FileActions {
  setFileName: (name: string | null) => void;
  setChartId: (id: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setLastSaved: (date: Date) => void;
  reset: () => void;
}

type FileStore = FileState & FileActions;

const initialState: FileState = {
  fileName: null,
  isDirty: false,
  lastSaved: null,
  chartId: null,
};

export const useFileStore = create<FileStore>()(
  immer((set) => ({
    ...initialState,

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
        Object.assign(state, initialState);
      }),
  }))
);
