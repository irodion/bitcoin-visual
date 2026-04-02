import { Link } from "react-router-dom";
import type { ModuleInfo } from "../constants/modules";
import {
  getCoreModules,
  getModuleByKey,
  getNextModule,
  getPreviousModule,
} from "../constants/storyHelpers";
import { useProgressStore } from "../stores/index";

interface StoryRibbonProps {
  currentModuleKey: string;
}

function RibbonNode({
  mod,
  isCurrent,
  isCompleted,
}: {
  mod: ModuleInfo;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  return (
    <Link
      to={mod.route}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
        isCurrent
          ? "ring-2 ring-accent/50 ring-offset-1 ring-offset-module-shell"
          : isCompleted
            ? "opacity-100"
            : "opacity-40"
      }`}
      style={{
        background: `${mod.color}${isCurrent ? "30" : isCompleted ? "20" : "10"}`,
        color: mod.color,
      }}
      aria-label={
        isCurrent ? `${mod.title} (current)` : isCompleted ? `${mod.title}, completed` : mod.title
      }
      aria-current={isCurrent ? "step" : undefined}
    >
      {isCompleted && !isCurrent ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 5.5 4 7.5 8 3" />
        </svg>
      ) : (
        mod.storyOrder
      )}
    </Link>
  );
}

export function StoryRibbon({ currentModuleKey }: StoryRibbonProps) {
  const completedModules = useProgressStore((s) => s.completedModules);
  const coreModules = getCoreModules();

  const currentMod = getModuleByKey(currentModuleKey);
  const isLab = !currentMod || currentMod.storyGroup !== "core";

  if (isLab) {
    return (
      <div
        className="flex items-center gap-2 border-b border-border px-5 py-2 md:px-7"
        aria-label="Story position"
      >
        <span className="rounded-badge border border-dashed border-danger/30 bg-danger/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-danger">
          Side Lab
        </span>
        <span className="text-[11px] text-text-muted">Explore real-world failure modes</span>
      </div>
    );
  }

  const nextModule = getNextModule(currentModuleKey);
  const prevModule = getPreviousModule(currentModuleKey);

  return (
    <nav className="border-b border-border px-5 py-2 md:px-7" aria-label="Story progress">
      {/* Desktop: horizontal progress nodes + transition copy */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex items-center gap-1">
          {coreModules.map((mod, i, arr) => (
            <div key={mod.key} className="flex items-center gap-1">
              <RibbonNode
                mod={mod}
                isCurrent={mod.key === currentModuleKey}
                isCompleted={completedModules.includes(mod.key)}
              />
              {i < arr.length - 1 && (
                <div
                  className={`h-[1.5px] w-4 ${
                    completedModules.includes(mod.key) ? "bg-success/40" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
        <div className="ml-3 border-l border-border pl-3">
          <p className="max-w-sm text-[11px] leading-snug text-text-muted">{currentMod.storyNow}</p>
        </div>
      </div>

      {/* Mobile: compact chapter indicator with prev/next */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          {prevModule && (
            <Link
              to={prevModule.route}
              className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
              aria-label={`Previous: ${prevModule.title}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3 5 8l5 5" />
              </svg>
            </Link>
          )}
          <span className="text-[11px] font-semibold text-text-secondary">
            {currentMod.storyRole}
          </span>
          {nextModule && (
            <Link
              to={nextModule.route}
              className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
              aria-label={`Next: ${nextModule.title}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </Link>
          )}
        </div>
        <span className="text-[10px] text-text-muted">{currentMod.title}</span>
      </div>
    </nav>
  );
}
