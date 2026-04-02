import { bytesToHex } from "@noble/hashes/utils.js";
import { motion } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { CopyButton, ValueFlowArrow } from "../../shared/components/index.ts";
import type { ParsedDescriptor, ExpandedAddress } from "../../shared/crypto/index.ts";

interface DerivePanelProps {
  parsed: ParsedDescriptor | null;
  expandedAddresses: ExpandedAddress[];
  expandError: string | null;
  addressCount: number;
  setAddressCount: (n: number) => void;
  comparisonAddresses: Array<{ scriptType: string; label: string; address: string }> | null;
}

export function DerivePanel({
  parsed,
  expandedAddresses,
  expandError,
  addressCount,
  setAddressCount,
  comparisonAddresses,
}: DerivePanelProps) {
  if (!parsed) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-text-muted">
        <p>Parse a descriptor in the Anatomy tab first →</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Count control */}
      <div className="flex items-center gap-4">
        <label htmlFor="address-count" className="text-sm text-text-secondary">
          Derive addresses:
        </label>
        <input
          id="address-count"
          type="range"
          min={1}
          max={20}
          value={addressCount}
          onChange={(e) => setAddressCount(parseInt(e.target.value, 10))}
          className="h-2 w-40 cursor-pointer accent-accent"
        />
        <span className="min-w-[2ch] text-center font-mono text-sm text-accent">
          {addressCount}
        </span>
      </div>

      {expandError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {expandError}
        </div>
      )}

      {/* Expanded addresses table */}
      {expandedAddresses.length > 0 && (
        <motion.div variants={STEP_VARIANTS} initial="hidden" animate="visible">
          <p className="mb-2 text-sm font-medium text-text-secondary">
            Derived addresses from wildcard expansion:
          </p>
          <div className="space-y-2">
            {expandedAddresses.map((entry) => (
              <div
                key={entry.index}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2"
              >
                <span className="min-w-[3ch] text-right font-mono text-xs text-text-muted">
                  {entry.index}
                </span>
                <div className="min-w-0 flex-1">
                  {entry.isTaproot ? (
                    <span className="text-sm italic text-text-muted">
                      P2TR address generation coming soon
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm text-text-primary">
                        {entry.address}
                      </span>
                      <CopyButton text={entry.address} />
                    </div>
                  )}
                </div>
                <span className="hidden font-mono text-xs text-text-muted sm:block">
                  {bytesToHex(entry.publicKey).slice(0, 16)}…
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cross-type comparison */}
      {comparisonAddresses && comparisonAddresses.length > 0 && (
        <motion.div
          variants={STEP_VARIANTS}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-accent/20 bg-accent/5 p-4"
        >
          <h4 className="mb-3 text-sm font-semibold text-accent">Same Key, Different Scripts</h4>
          <p className="mb-4 text-xs text-text-muted">
            The same xpub wrapped in different script functions produces different address types:
          </p>
          <div className="space-y-1">
            {comparisonAddresses.map((entry, i) => (
              <div key={entry.scriptType}>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                  <span className="min-w-[18ch] text-xs font-medium text-text-secondary">
                    {entry.label}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-mono text-sm text-text-primary">
                      {entry.address}
                    </span>
                    <CopyButton text={entry.address} />
                  </div>
                </div>
                {i < comparisonAddresses.length - 1 && (
                  <div className="flex justify-center">
                    <ValueFlowArrow label="" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
