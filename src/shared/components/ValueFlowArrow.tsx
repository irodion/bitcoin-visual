import { motion } from "framer-motion";

interface ValueFlowArrowProps {
  label: string;
  description?: string;
  direction?: "vertical" | "horizontal";
  animationKey?: string | number;
}

const PULSE_ANIMATE = { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] };
const PULSE_TRANSITION = { duration: 0.5, ease: "easeInOut" as const };

export function ValueFlowArrow({
  label,
  description,
  direction = "vertical",
  animationKey,
}: ValueFlowArrowProps) {
  const isVertical = direction === "vertical";

  return (
    <div
      className={`relative flex items-center justify-center ${
        isVertical ? "h-14 flex-col py-1" : "w-16 flex-row px-1"
      }`}
    >
      <div
        className={`${isVertical ? "h-full w-px" : "h-px w-full"} bg-gradient-to-b from-transparent via-border-strong to-transparent`}
        style={
          isVertical
            ? {
                backgroundImage:
                  "repeating-linear-gradient(to bottom, var(--color-border-strong) 0, var(--color-border-strong) 3px, transparent 3px, transparent 7px)",
              }
            : {
                backgroundImage:
                  "repeating-linear-gradient(to right, var(--color-border-strong) 0, var(--color-border-strong) 3px, transparent 3px, transparent 7px)",
              }
        }
      />

      <motion.div
        key={animationKey}
        initial={false}
        animate={PULSE_ANIMATE}
        transition={PULSE_TRANSITION}
        className="group/pill absolute z-10 rounded-full border border-border-strong bg-surface px-3 py-1 font-mono text-[11px] font-medium text-text-secondary shadow-sm"
      >
        {label}
        {description && (
          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-xs -translate-x-1/2 rounded-card border border-border-strong bg-surface-raised px-3 py-2 text-left font-sans text-xs leading-relaxed text-text-primary shadow-lg group-hover/pill:block">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border-strong bg-surface-raised" />
            {description}
          </span>
        )}
      </motion.div>

      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="currentColor"
        className={`absolute text-border-strong ${isVertical ? "bottom-0" : "right-0 -rotate-90"}`}
        aria-hidden="true"
      >
        <path d="M0 0 L5 6 L10 0 Z" />
      </svg>
    </div>
  );
}
