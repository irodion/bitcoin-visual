import { MODULES, LEARNING_PATH, type ModuleInfo } from "./modules";

export function getModuleByKey(key: string): ModuleInfo | undefined {
  return MODULES.find((m) => m.key === key);
}

export function getNextModule(key: string): ModuleInfo | null {
  const mod = getModuleByKey(key);
  if (!mod?.nextModuleKey) return null;
  return getModuleByKey(mod.nextModuleKey) ?? null;
}

export function getPreviousModule(key: string): ModuleInfo | null {
  const mod = getModuleByKey(key);
  if (!mod?.previousModuleKey) return null;
  return getModuleByKey(mod.previousModuleKey) ?? null;
}

export function getCoreModules(): ModuleInfo[] {
  return MODULES.filter((m) => m.storyGroup === "core");
}

export function getLabModules(): ModuleInfo[] {
  return MODULES.filter((m) => m.storyGroup === "lab");
}

export function getRecommendedModule(completedModules: string[]): ModuleInfo | null {
  for (const key of LEARNING_PATH) {
    if (!completedModules.includes(key)) {
      return getModuleByKey(key) ?? null;
    }
  }
  return null;
}

export function getModuleBadgeLabel(
  mod: ModuleInfo,
  completedModules: string[],
  currentModuleKey?: string,
): string {
  if (mod.key === currentModuleKey) return "Current";
  if (completedModules.includes(mod.key)) return "Completed";
  if (mod.storyGroup === "lab") return "Side Lab";
  const recommended = getRecommendedModule(completedModules);
  if (recommended && recommended.key === mod.key) return "Recommended";
  return "Not started";
}
