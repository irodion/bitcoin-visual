import { useCallback } from "react";
import { useProgressStore } from "../stores/index.ts";

export function useModuleCompletion(moduleKey: string) {
  const markCompleted = useProgressStore((s) => s.markCompleted);
  const completed = useProgressStore((s) => s.completedModules.includes(moduleKey));

  const complete = useCallback(() => {
    markCompleted(moduleKey);
  }, [moduleKey, markCompleted]);

  return { completed, complete };
}
