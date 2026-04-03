import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  completedModules: string[];
  completedChallenges: string[];
  markCompleted: (moduleKey: string) => void;
  markChallengeCompleted: (moduleKey: string) => void;
  reset: () => void;
}

const addUnique = (arr: string[], item: string) => (arr.includes(item) ? arr : [...arr, item]);

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedModules: [],
      completedChallenges: [],
      markCompleted: (moduleKey) =>
        set((state) => ({ completedModules: addUnique(state.completedModules, moduleKey) })),
      markChallengeCompleted: (moduleKey) =>
        set((state) => ({
          completedChallenges: addUnique(state.completedChallenges, moduleKey),
        })),
      reset: () => set({ completedModules: [], completedChallenges: [] }),
    }),
    {
      name: "bitcoinvisual-progress",
      partialize: (state) => ({
        completedModules: state.completedModules,
        completedChallenges: state.completedChallenges,
      }),
    },
  ),
);
