import { motion, AnimatePresence } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import type {
  ParsedDescriptor,
  DescriptorSegmentInfo,
  SegmentKind,
} from "../../shared/crypto/index.ts";
import { DescriptorSegment } from "./DescriptorSegment.tsx";
import { getPresets } from "./presets.ts";

const SEGMENT_EXPLANATIONS: Partial<Record<SegmentKind, { title: string; description: string }>> = {
  function: {
    title: "Script Type Function",
    description:
      "The outer function defines what kind of Bitcoin script wraps the key. pkh() → legacy P2PKH, wpkh() → native SegWit, sh() → P2SH wrapper, wsh() → witness script hash, tr() → Taproot, multi()/sortedmulti() → multisig policy.",
  },
  fingerprint: {
    title: "Master Key Fingerprint",
    description:
      "The first 4 bytes of hash160(master public key). This identifies which HD master key the xpub descends from — critical for hardware wallets that manage multiple seeds.",
  },
  originPath: {
    title: "Derivation Path",
    description:
      "BIP-32 derivation steps from the master key to this xpub. The ' (or h) marks hardened derivation. Standard paths: 44' = legacy, 49' = wrapped SegWit, 84' = native SegWit, 86' = Taproot.",
  },
  key: {
    title: "Extended Public Key (xpub)",
    description:
      "The actual key material — a base58-encoded BIP-32 extended public key. Contains the public key and chain code needed to derive child keys without the private key.",
  },
  suffix: {
    title: "Derivation Suffix",
    description:
      "Path from the xpub to individual addresses. /0/* = receive chain (derive at every index). /1/* = change chain. The * wildcard means 'derive child at index 0, 1, 2, …'",
  },
  checksum: {
    title: "BCH Error-Detecting Checksum",
    description:
      "8-character code using the bech32 alphabet. Detects up to 4 character errors in descriptors under 507 chars. Catches typos when copying descriptors between wallets.",
  },
  threshold: {
    title: "Signing Threshold (M)",
    description:
      "The minimum number of signatures required to spend. In multi(2, K1, K2, K3), any 2 of 3 keys can authorize a transaction.",
  },
};

interface AnatomyPanelProps {
  descriptorInput: string;
  setDescriptorInput: (s: string) => void;
  parsed: ParsedDescriptor | null;
  parseError: string | null;
  selectedSegmentIndex: number | null;
  setSelectedSegmentIndex: (i: number | null) => void;
  selectPreset: (index: number) => void;
}

export function AnatomyPanel({
  descriptorInput,
  setDescriptorInput,
  parsed,
  parseError,
  selectedSegmentIndex,
  setSelectedSegmentIndex,
  selectPreset,
}: AnatomyPanelProps) {
  const selectedSegment: DescriptorSegmentInfo | null =
    parsed && selectedSegmentIndex !== null
      ? (parsed.segments[selectedSegmentIndex] ?? null)
      : null;

  const explanation = selectedSegment ? SEGMENT_EXPLANATIONS[selectedSegment.kind] : null;

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div>
        <p className="mb-2 text-sm text-text-secondary">Select a preset or paste your own:</p>
        <div className="flex flex-wrap gap-2">
          {getPresets().map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => selectPreset(i)}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <label
          htmlFor="descriptor-input"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Descriptor string
        </label>
        <textarea
          id="descriptor-input"
          value={descriptorInput}
          onChange={(e) => setDescriptorInput(e.target.value)}
          placeholder="wpkh([fingerprint/84'/0'/0']xpub.../0/*)#checksum"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-raised p-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {parseError}
        </div>
      )}

      {/* Colored segments */}
      {parsed && (
        <motion.div variants={STEP_VARIANTS} initial="hidden" animate="visible">
          <p className="mb-2 text-sm font-medium text-text-secondary">
            Parsed structure — click any segment:
          </p>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <div className="flex flex-wrap break-all text-base leading-relaxed">
              {parsed.segments.map((seg, i) => (
                <DescriptorSegment
                  key={`${seg.start}-${seg.kind}`}
                  segment={seg}
                  isSelected={selectedSegmentIndex === i}
                  onClick={() => setSelectedSegmentIndex(selectedSegmentIndex === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Explanation card */}
      <AnimatePresence mode="wait">
        {explanation && selectedSegment && (
          <motion.div
            key={`explain-${selectedSegment.kind}`}
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="rounded-lg border border-accent/30 bg-accent/5 p-4"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
              {explanation.title}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">{explanation.description}</p>
            <p className="mt-2 font-mono text-sm text-text-primary">
              Value: <span className="text-accent">{selectedSegment.text}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset description */}
      {parsed && !parseError && (
        <div className="text-sm text-text-muted">
          {getPresets().find((p) => p.descriptor === descriptorInput)?.description}
        </div>
      )}
    </div>
  );
}
