import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { PageBackground } from "../shared/components/index.ts";
import { ConceptChain } from "../shared/components/ConceptChain.tsx";
import type { ModuleInfo } from "../shared/constants/modules.ts";
import { useProgressStore } from "../shared/stores/index.ts";
import { BTN_PRIMARY, GEAR_ICON_PATH } from "../shared/components/styles.ts";
import {
  getCoreModules,
  getLabModules,
  getRecommendedModule,
  getModuleBadgeLabel,
} from "../shared/constants/storyHelpers.ts";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const BADGE_STYLES: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  Recommended: "bg-accent/10 text-accent",
  "Side Lab": "bg-danger/10 text-danger",
  "Not started": "bg-surface-raised text-text-muted",
  Current: "bg-accent/10 text-accent",
};

function ModuleCard({
  mod,
  completedModules,
  isRecommended,
}: {
  mod: ModuleInfo;
  completedModules: string[];
  isRecommended: boolean;
}) {
  const badgeLabel = getModuleBadgeLabel(mod, completedModules);
  const badgeStyle = BADGE_STYLES[badgeLabel] ?? BADGE_STYLES["Not started"];
  const cardClasses = `block rounded-card border p-6 transition-all ${
    mod.active
      ? `group shadow-container hover:border-border-strong hover:shadow-[0_18px_48px_rgba(0,0,0,0.36)] ${
          isRecommended ? "border-accent/40" : "border-border"
        }`
      : "border-border/50 opacity-50"
  }`;

  const cardContent = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: `${mod.color}18`, color: mod.color }}
          >
            {mod.number}
          </span>
          {mod.storyGroup === "core" && (
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Chapter {mod.storyOrder}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-badge bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-muted">
            ~{mod.estimatedMinutes} min
          </span>
          {mod.active ? (
            <span className={`rounded-badge px-2.5 py-1 text-[11px] font-bold ${badgeStyle}`}>
              {badgeLabel.toUpperCase()}
            </span>
          ) : (
            <span className="rounded-badge bg-surface-raised px-2.5 py-1 text-[11px] font-bold text-text-muted">
              COMING SOON
            </span>
          )}
        </div>
      </div>
      <h2 className="mb-1 text-lg font-bold text-text-primary transition-colors group-hover:text-accent">
        {mod.title}
      </h2>
      <p className="text-sm leading-relaxed text-text-secondary">{mod.description}</p>
      {mod.active && (
        <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {mod.landingCta}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3l5 5-5 5" />
          </svg>
        </div>
      )}
    </>
  );

  return (
    <motion.div variants={cardVariants}>
      {mod.active ? (
        <Link to={mod.route} className={`${cardClasses} panel-cool`}>
          {cardContent}
        </Link>
      ) : (
        <div className={`${cardClasses} panel-cool`} aria-disabled="true">
          {cardContent}
        </div>
      )}
    </motion.div>
  );
}

export default function Landing() {
  const completedModules = useProgressStore((s) => s.completedModules);
  const recommended = getRecommendedModule(completedModules);
  const coreModules = getCoreModules();
  const labModules = getLabModules();
  const completedSet = new Set(completedModules);
  const coreCompleted = coreModules.filter((m) => completedSet.has(m.key)).length;
  const allCoreComplete = coreCompleted === coreModules.length;
  const hasProgress = coreCompleted > 0;
  const labModule = labModules[0];
  const allComplete = allCoreComplete && (!labModule || completedSet.has(labModule.key));

  const ctaLabel = allComplete
    ? "Review the Story"
    : allCoreComplete
      ? "Explore the Security Lab"
      : hasProgress
        ? "Resume Your Story"
        : "Start the Bitcoin Story";
  const ctaRoute = allComplete
    ? "/hash"
    : allCoreComplete
      ? (labModule?.route ?? "/attacks")
      : (recommended?.route ?? "/hash");

  return (
    <PageBackground glowSize={700} amberOpacity={0.22} tealOpacity={0.16}>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-20">
        <Link
          to="/settings"
          className="absolute right-5 top-12 flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-border-strong hover:text-accent md:right-8 md:top-20"
          aria-label="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={GEAR_ICON_PATH} />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-4 inline-block rounded-pill border border-border-amber bg-warning-bg px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-warning-text">
            Interactive Bitcoin Cryptography
          </div>
          <h1 className="mb-4 text-4xl font-bold text-text-primary md:text-6xl">
            <span className="sr-only">Bitcoin Visual</span>
            <span aria-hidden="true">
              Bitcoin <span className="text-accent">Visual</span>
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Learn Bitcoin cryptography by doing. Every hash, key, and signature computed live in
            your browser — no backend, no secrets leave your machine.
          </p>
          <div className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
            {hasProgress
              ? `${coreCompleted} of ${coreModules.length} modules completed`
              : `1 intro + ${coreModules.length - 1} chapters + ${labModules.length} security lab`}
          </div>
          <Link to={ctaRoute} className={`${BTN_PRIMARY} mt-5 inline-flex items-center gap-2`}>
            {ctaLabel}
            <svg
              width="14"
              height="14"
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
        </motion.div>

        <ConceptChain className="mb-12 md:mb-14" />

        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-text-primary">The Bitcoin Story</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Follow the path from fingerprint to shared custody.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {coreModules.map((mod) => (
            <ModuleCard
              key={mod.key}
              mod={mod}
              completedModules={completedModules}
              isRecommended={mod.key === recommended?.key}
            />
          ))}
        </motion.div>

        {/* Security Lab */}
        <div className="mb-6 mt-10 text-center">
          <h2 className="text-lg font-bold text-text-primary">Security Lab</h2>
          <p className="mt-1 text-sm text-text-secondary">
            See how the story breaks when core rules are violated.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {labModules.map((mod) => (
            <ModuleCard
              key={mod.key}
              mod={mod}
              completedModules={completedModules}
              isRecommended={mod.key === recommended?.key}
            />
          ))}
        </motion.div>

        <div className="mt-12 text-center text-xs text-text-muted">
          All cryptography runs client-side via{" "}
          <span className="font-mono text-accent">@noble/*</span> libraries. Zero network requests.
        </div>
      </div>
    </PageBackground>
  );
}
