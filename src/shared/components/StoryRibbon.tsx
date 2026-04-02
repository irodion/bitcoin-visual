import { Link } from "react-router-dom";
import { getModuleByKey, getNextModule, getPreviousModule } from "../constants/storyHelpers";

interface StoryRibbonProps {
  currentModuleKey: string;
}

export function StoryRibbon({ currentModuleKey }: StoryRibbonProps) {
  const currentMod = getModuleByKey(currentModuleKey);
  if (!currentMod) return null;

  const isLab = currentMod.storyGroup !== "core";

  if (isLab) {
    return (
      <div className="flex items-center gap-2 border-b border-border px-5 py-2 md:px-7">
        <span className="text-[11px] font-semibold text-danger">Side Lab</span>
        <span className="text-[11px] text-text-muted">·</span>
        <span className="text-[11px] text-text-muted">
          Explore what breaks when rules are violated
        </span>
      </div>
    );
  }

  const nextModule = getNextModule(currentModuleKey);
  const prevModule = getPreviousModule(currentModuleKey);

  return (
    <nav
      className="flex items-center justify-between border-b border-border px-5 py-2 md:px-7"
      aria-label="Story progress"
    >
      <div className="flex items-center gap-2 text-[11px]">
        {prevModule ? (
          <Link
            to={prevModule.route}
            className="text-text-muted transition-colors hover:text-text-secondary"
          >
            ← {prevModule.sidebarLabelShort}
          </Link>
        ) : (
          <span className="text-text-muted">Start</span>
        )}
        <span className="text-text-muted">·</span>
        <span className="font-semibold text-text-secondary">{currentMod.storyRole}</span>
        {nextModule && (
          <>
            <span className="text-text-muted">·</span>
            <Link
              to={nextModule.route}
              className="text-text-muted transition-colors hover:text-text-secondary"
            >
              {nextModule.sidebarLabelShort} →
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
