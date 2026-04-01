import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexBox } from "../../../shared/components/index.ts";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  INPUT,
  LABEL,
  SECTION_LABEL,
} from "../../../shared/components/styles.ts";
import { PillToggle } from "../components/PillToggle.tsx";
import { AttackResultBadge } from "../components/AttackResultBadge.tsx";
import { useRainbowTableState } from "../useRainbowTableState.ts";
import { RAINBOW_TABLE } from "../data/rainbowTable.ts";

const SOURCE_OPTIONS = [
  { key: "dropdown" as const, label: "Precomputed Table" },
  { key: "custom" as const, label: "Custom Input" },
];

export function RainbowTableAttack({ onAttackRun }: { onAttackRun?: () => void }) {
  const state = useRainbowTableState();
  const [showFullTable, setShowFullTable] = useState(false);
  const matchIndex = useMemo(
    () => RAINBOW_TABLE.findIndex((e) => e.sha256 === state.displayHash),
    [state.displayHash],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PillToggle
          options={SOURCE_OPTIONS}
          value={state.targetSource}
          onChange={state.setTargetSource}
          label="Target source"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={state.saltEnabled}
            onChange={state.toggleSalt}
            className="accent-accent"
            aria-label="Enable salt"
          />
          Enable Salt
        </label>
        {state.saltEnabled && (
          <button type="button" className={BTN_GHOST} onClick={state.regenerateSalt}>
            Regenerate Salt
          </button>
        )}
      </div>

      {state.saltEnabled && <HexBox value={state.salt} label="Salt (random)" variant="info" />}

      {state.targetSource === "dropdown" ? (
        <div>
          <label className={LABEL} htmlFor="rainbow-target">
            Target Hash (from leaked database)
          </label>
          <select
            id="rainbow-target"
            className={INPUT}
            value={state.selectedIndex}
            onChange={(e) => state.setSelectedIndex(Number(e.target.value))}
          >
            {RAINBOW_TABLE.map((entry, i) => (
              <option key={entry.password} value={i}>
                {entry.sha256.slice(0, 32)}&hellip; (from &quot;{entry.password}&quot;)
              </option>
            ))}
          </select>
          {state.displayHash && (
            <div className="mt-3">
              <HexBox
                value={state.displayHash}
                label={state.saltEnabled ? "Salted Target Hash" : "Target Hash"}
                variant="default"
                truncate
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className={LABEL} htmlFor="rainbow-custom">
            Type a password
          </label>
          <input
            id="rainbow-custom"
            type="text"
            className={INPUT}
            value={state.customPassword}
            onChange={(e) => state.setCustomPassword(e.target.value)}
            placeholder="Enter any password\u2026"
          />
          {state.customPassword && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <HexBox
                value={state.unsaltedCustomHash}
                label="SHA-256(password)"
                variant="default"
                truncate
              />
              {state.saltEnabled && (
                <HexBox
                  value={state.saltedCustomHash}
                  label="SHA-256(password+salt)"
                  variant="info"
                  truncate
                />
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className={`${BTN_PRIMARY} mx-auto block`}
        disabled={state.cracking || !state.displayHash}
        onClick={() => {
          state.crack();
          onAttackRun?.();
        }}
      >
        {state.cracking ? "Scanning\u2026" : "Crack"}
      </button>

      <AnimatePresence initial={false}>
        {(state.cracking || state.scanComplete) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <span className={SECTION_LABEL}>
                Table entries checked: {state.entriesChecked}/{RAINBOW_TABLE.length}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-accent transition-all duration-75"
                style={{ width: `${(state.entriesChecked / RAINBOW_TABLE.length) * 100}%` }}
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-input border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface text-text-muted">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">#</th>
                    <th className="px-3 py-1.5 font-medium">Password</th>
                    <th className="px-3 py-1.5 font-medium">SHA-256</th>
                    <th className="px-3 py-1.5 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {RAINBOW_TABLE.slice(0, state.entriesChecked).map((entry, i) => {
                    const isMatch = i === matchIndex;
                    return (
                      <tr
                        key={entry.password}
                        className={isMatch ? "bg-success/10 font-semibold" : ""}
                      >
                        <td className="px-3 py-1.5 text-xs text-text-muted">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-text-primary">
                          {entry.password}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                          {entry.sha256.slice(0, 24)}&hellip;
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs">
                          {isMatch && <span className="font-bold text-success">MATCH</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {state.scanComplete && (
              <div className="text-center">
                {state.crackedPassword ? (
                  <AttackResultBadge
                    variant="compromised"
                    label={`Cracked: "${state.crackedPassword}" in ${state.crackTimeMs}ms`}
                  />
                ) : (
                  <div className="space-y-2">
                    <AttackResultBadge
                      variant="protected"
                      label={`No match \u2014 ${state.entriesChecked}/{RAINBOW_TABLE.length} checked`}
                    />
                    {state.saltEnabled && (
                      <p className="text-sm text-text-secondary">
                        Salt defeats precomputed lookup. Attacker must rebuild the table for every
                        unique salt.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => setShowFullTable((prev) => !prev)}
          aria-expanded={showFullTable}
        >
          {showFullTable ? "Hide" : "Show"} Full Rainbow Table ({RAINBOW_TABLE.length} entries)
        </button>
        <AnimatePresence initial={false}>
          {showFullTable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 max-h-64 overflow-y-auto rounded-input border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface text-text-muted">
                    <tr>
                      <th className="px-3 py-1.5 font-medium">#</th>
                      <th className="px-3 py-1.5 font-medium">Password</th>
                      <th className="px-3 py-1.5 font-medium">SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {RAINBOW_TABLE.map((entry, i) => (
                      <tr key={entry.password}>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-text-primary">
                          {entry.password}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                          {entry.sha256.slice(0, 32)}&hellip;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
