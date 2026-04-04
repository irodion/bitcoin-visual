import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_VARIANTS, BTN_GHOST } from "../../../shared/components/styles.ts";

interface Props {
  onInteract: () => void;
}

interface Locker {
  id: number;
  amount: number;
  spent: boolean;
  owner: string;
}

const INITIAL_LOCKERS: Locker[] = [
  { id: 1, amount: 0.5, owner: "You", spent: false },
  { id: 2, amount: 0.3, owner: "You", spent: false },
  { id: 3, amount: 0.2, owner: "You", spent: false },
];

const MAX_LOCKERS = 10;
const INITIAL_NEXT_ID = 4;

function LockerCard({
  locker,
  canUnlock,
  onUnlock,
}: {
  locker: Locker;
  canUnlock: boolean;
  onUnlock: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && canUnlock) {
      e.preventDefault();
      onUnlock();
    }
  };

  return (
    <motion.div
      layout
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className={`rounded-card border px-4 py-3 transition-colors ${
        locker.spent
          ? "border-border/30 bg-surface-raised/50 opacity-50"
          : canUnlock
            ? "cursor-pointer border-accent/40 bg-accent/5 hover:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            : "border-teal/40 bg-teal/5"
      }`}
      role={canUnlock ? "button" : undefined}
      tabIndex={canUnlock ? 0 : undefined}
      aria-label={canUnlock ? `Unlock ${locker.amount.toFixed(2)} BTC locker` : undefined}
      onClick={canUnlock ? onUnlock : undefined}
      onKeyDown={canUnlock ? handleKeyDown : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden>
          {locker.spent ? "🔓" : "🔒"}
        </span>
        <div>
          <p
            className={`text-sm font-bold text-text-primary ${locker.spent ? "line-through" : ""}`}
          >
            {locker.amount.toFixed(2)} BTC
          </p>
          <p className="text-[11px] text-text-secondary">
            {locker.spent ? "Spent" : `Locked for ${locker.owner}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function LockersTab({ onInteract }: Props) {
  const [lockers, setLockers] = useState<Locker[]>(INITIAL_LOCKERS);
  const nextIdRef = useRef(INITIAL_NEXT_ID);

  const spendableLockers = lockers.filter((l) => !l.spent && l.owner === "You");
  const atCapacity = lockers.length >= MAX_LOCKERS;

  const unlockLocker = useCallback(
    (id: number) => {
      setLockers((prev) => {
        const target = prev.find((l) => l.id === id);
        if (!target || target.spent) return prev;

        const recipientAmount = Math.round(target.amount * 0.7 * 100) / 100;
        const changeAmount = Math.round((target.amount - recipientAmount) * 100) / 100;

        const recipientId = nextIdRef.current++;
        const updated = prev.map((l) => (l.id === id ? { ...l, spent: true } : l));

        const newLockers: Locker[] = [
          { id: recipientId, amount: recipientAmount, owner: "Recipient", spent: false },
        ];

        if (changeAmount > 0.01) {
          newLockers.push({
            id: nextIdRef.current++,
            amount: changeAmount,
            owner: "You",
            spent: false,
          });
        }

        return [...updated, ...newLockers];
      });
      onInteract();
    },
    [onInteract],
  );

  const reset = () => {
    nextIdRef.current = INITIAL_NEXT_ID;
    setLockers(INITIAL_LOCKERS);
  };

  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8"
    >
      <div className="text-center">
        <p className="text-sm text-text-secondary">
          Click a locker you own to unlock it. Its value splits into a new locker for the recipient
          and a change locker back to you.
        </p>
        {atCapacity && spendableLockers.length > 0 && (
          <p className="mt-2 text-xs text-text-muted">
            Locker limit reached — reset to start over.
          </p>
        )}
      </div>

      {/* Locker grid */}
      <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence>
          {lockers.map((locker) => (
            <LockerCard
              key={locker.id}
              locker={locker}
              canUnlock={!locker.spent && locker.owner === "You" && !atCapacity}
              onUnlock={() => unlockLocker(locker.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Reset button */}
      {lockers.some((l) => l.spent) && (
        <button type="button" className={BTN_GHOST} onClick={reset}>
          Reset Lockers
        </button>
      )}

      <p className="max-w-lg text-center text-sm font-medium text-text-secondary">
        You don't log into Bitcoin and edit a balance. You prove you can unlock existing value and
        re-lock it for the next owner.
      </p>
    </motion.div>
  );
}
