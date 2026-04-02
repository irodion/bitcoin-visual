import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ModuleInfo } from "../constants/modules";
import { getLabModules } from "../constants/storyHelpers";
import { useModuleCompletion } from "../hooks/useModuleCompletion";
import { BTN_PRIMARY, BTN_GHOST, STEP_VARIANTS } from "./styles";

interface JourneyFooterProps {
  mod: ModuleInfo;
  nextModule: ModuleInfo | null;
  prevModule: ModuleInfo | null;
}

export function JourneyFooter({ mod, nextModule, prevModule }: JourneyFooterProps) {
  const { completed } = useModuleCompletion(mod.key);

  const isLab = mod.storyGroup === "lab";
  const isLastCore = mod.storyGroup === "core" && !nextModule;
  const labRoute = getLabModules()[0]?.route ?? "/attacks";

  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="mt-8 border-t border-border px-1 pt-6 pb-2"
    >
      {completed ? (
        <>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-success">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8.5 6.5 12 13 4" />
            </svg>
            Chapter complete
          </div>
          <p className="mb-3 text-sm text-text-secondary">{mod.storyRecap}</p>
        </>
      ) : (
        <p className="mb-3 text-sm text-text-secondary">{mod.storyNow}</p>
      )}

      <p className="mb-5 text-sm text-text-muted">{mod.storyNext}</p>

      <div className="flex flex-wrap items-center gap-3">
        {isLab ? (
          <Link to="/" className={`${BTN_PRIMARY} inline-flex items-center gap-2`}>
            Return to the Bitcoin Story
          </Link>
        ) : isLastCore ? (
          <Link to={labRoute} className={`${BTN_PRIMARY} inline-flex items-center gap-2`}>
            Continue to Security Lab →
          </Link>
        ) : nextModule ? (
          <Link to={nextModule.route} className={`${BTN_PRIMARY} inline-flex items-center gap-2`}>
            {completed ? `Continue to ${nextModule.title}` : `Peek at ${nextModule.title}`} →
          </Link>
        ) : null}

        {!isLab && (
          <Link to="/" className={`${BTN_GHOST} inline-flex items-center gap-2`}>
            Back to Story Map
          </Link>
        )}

        {prevModule && (
          <Link
            to={prevModule.route}
            className="text-sm text-text-muted transition-colors hover:text-text-secondary"
          >
            ← {prevModule.title}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
