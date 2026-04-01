import type { Variants } from "framer-motion";

/** Shared styling constants for module pages */

export const BTN_PRIMARY =
  "cursor-pointer rounded-pill bg-accent px-5 py-2 text-sm font-bold text-text-on-accent transition-opacity hover:opacity-90 active:opacity-80";

export const BTN_GHOST =
  "cursor-pointer rounded-pill border border-border-secondary bg-ghost-bg px-5 py-2 text-sm font-bold text-text-primary transition-colors hover:border-border-strong hover:text-accent";

export const TEXTAREA =
  "w-full resize-y rounded-input border border-input-border bg-input-bg px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none md:text-base";

export const INPUT =
  "w-full rounded-input border border-input-border bg-input-bg px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none";

export const LABEL =
  "mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-secondary";

export const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted";

export const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const STEP_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export const CHECK_ICON_PATH =
  "M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z";
