import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { MODULES, LEARNING_PATH, type ModuleInfo } from "../constants/modules.ts";
import { useProgressStore } from "../stores/index.ts";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const PATH_MODULES = LEARNING_PATH.map((key) => MODULES.find((m) => m.key === key)!);

function CheckBadge({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 5.5 4 7.5 8 3" />
    </svg>
  );
}

function ChainNode({
  mod,
  isCompleted,
  size,
}: {
  mod: ModuleInfo;
  isCompleted: boolean;
  size: "sm" | "md";
}) {
  const isMd = size === "md";
  return (
    <Link
      to={mod.route}
      className="group/chain flex flex-col items-center gap-1.5"
      aria-label={isCompleted ? `${mod.title}, completed` : mod.title}
    >
      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full font-bold ${
            isMd
              ? "h-11 w-11 text-sm transition-transform group-hover/chain:scale-110"
              : "h-10 w-10 text-xs"
          }`}
          style={{ background: `${mod.color}20`, color: mod.color }}
        >
          {mod.number}
        </div>
        {isCompleted && (
          <div
            className={`absolute flex items-center justify-center rounded-full bg-success ${
              isMd ? "-right-1 -top-1 h-4 w-4" : "-right-0.5 -top-0.5 h-3.5 w-3.5"
            }`}
            aria-hidden="true"
          >
            <CheckBadge size={isMd ? 8 : 7} />
          </div>
        )}
      </div>
      <span
        className={`font-medium text-text-secondary ${
          isMd
            ? "text-[11px] transition-colors group-hover/chain:text-text-primary"
            : "text-center text-[10px] leading-tight"
        }`}
      >
        {mod.title.split(" ")[0]}
      </span>
    </Link>
  );
}

interface ConceptChainProps {
  className?: string;
}

export function ConceptChain({ className = "" }: ConceptChainProps) {
  const completedModules = useProgressStore((s) => s.completedModules);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center ${className}`}
    >
      {/* Desktop: single horizontal row */}
      <div className="hidden w-full max-w-3xl items-center justify-center md:flex">
        {PATH_MODULES.map((mod, i) => (
          <div key={mod.key} className="flex flex-1 items-center">
            <motion.div variants={nodeVariants}>
              <ChainNode mod={mod} isCompleted={completedModules.includes(mod.key)} size="md" />
            </motion.div>

            {i < PATH_MODULES.length - 1 && (
              <motion.div
                variants={lineVariants}
                className="mx-1 h-[2px] flex-1 origin-left"
                style={{
                  background: `linear-gradient(to right, ${mod.color}50, ${PATH_MODULES[i + 1].color}50)`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: 2-row grid */}
      <div className="grid w-full max-w-sm grid-cols-3 gap-4 md:hidden">
        {PATH_MODULES.map((mod) => (
          <motion.div key={mod.key} variants={nodeVariants}>
            <ChainNode mod={mod} isCompleted={completedModules.includes(mod.key)} size="sm" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
