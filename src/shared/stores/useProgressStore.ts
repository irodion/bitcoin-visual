import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  completedModules: string[];
  markCompleted: (moduleKey: string) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedModules: [],
      markCompleted: (moduleKey) =>
        set((state) => ({
          completedModules: state.completedModules.includes(moduleKey)
            ? state.completedModules
            : [...state.completedModules, moduleKey],
        })),
      reset: () => set({ completedModules: [] }),
    }),
    {
      name: "bitcoinvault-progress",
      partialize: (state) => ({ completedModules: state.completedModules }),
    },
  ),
);
