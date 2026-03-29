import { useId } from "react";
import { motion, type Transition } from "framer-motion";

interface ValueFlowArrowProps {
  label: string;
  description?: string;
  direction?: "vertical" | "horizontal";
  animationKey?: string | number;
}

const DOT_TRANSITION: Transition = {
  duration: 1.2,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};

const DOT_TRANSITION_DELAYED: Transition = { ...DOT_TRANSITION, delay: 0.6 };

const PULSE_TRANSITION: Transition = { duration: 0.5, ease: "easeInOut" };

export function ValueFlowArrow({
  label,
  description,
  direction = "vertical",
  animationKey,
}: ValueFlowArrowProps) {
  const isVertical = direction === "vertical";
  const tooltipId = useId();

  const dotAnimateA = isVertical
    ? { y: [-20, 20], opacity: [1, 0.4] }
    : { x: [-20, 20], opacity: [1, 0.4] };
  const dotAnimateB = isVertical
    ? { y: [20, -20], opacity: [1, 0.4] }
    : { x: [20, -20], opacity: [1, 0.4] };

  return (
    <div
      className={`relative flex items-center justify-center ${
        isVertical ? "h-14 flex-col py-1" : "w-16 flex-row px-1"
      }`}
    >
      <div
        className={`rounded-full ${
          isVertical
            ? "h-full w-1.5 bg-gradient-to-b from-accent to-teal"
            : "h-1.5 w-full bg-gradient-to-r from-accent to-teal"
        }`}
      />

      <motion.span
        className="absolute h-2 w-2 rounded-full bg-accent"
        animate={dotAnimateA}
        transition={DOT_TRANSITION}
        aria-hidden="true"
      />
      <motion.span
        className="absolute h-2 w-2 rounded-full bg-teal"
        animate={dotAnimateB}
        transition={DOT_TRANSITION_DELAYED}
        aria-hidden="true"
      />

      <motion.div
        key={animationKey}
        initial={false}
        animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
        transition={PULSE_TRANSITION}
        tabIndex={description ? 0 : undefined}
        aria-describedby={description ? tooltipId : undefined}
        onKeyDown={
          description
            ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Escape") e.currentTarget.blur();
              }
            : undefined
        }
        className="group/pill absolute z-10 rounded-pill border border-border-strong bg-surface px-3 py-1 font-mono text-[11px] font-medium text-text-secondary shadow-sm"
      >
        {label}
        {description && (
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-xs -translate-x-1/2 rounded-xl border border-border-strong bg-surface-raised px-3 py-2 text-left font-sans text-xs leading-relaxed text-text-primary shadow-lg group-hover/pill:block group-focus/pill:block"
          >
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border-strong bg-surface-raised" />
            {description}
          </span>
        )}
      </motion.div>
    </div>
  );
}
