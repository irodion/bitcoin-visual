import { motion } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { CopyButton } from "../../shared/components/index.ts";
import { PillToggle } from "../../shared/components/PillToggle.tsx";
import type { DescriptorConfig } from "../../shared/crypto/index.ts";

const SCRIPT_TYPE_OPTIONS: Array<{ value: DescriptorConfig["scriptType"]; label: string }> = [
  { value: "pkh", label: "P2PKH (Legacy)" },
  { value: "wpkh", label: "P2WPKH (Native SegWit)" },
  { value: "sh-wpkh", label: "P2SH-P2WPKH (Wrapped SegWit)" },
  { value: "wsh-sortedmulti", label: "P2WSH Sorted Multisig" },
  { value: "wsh-multi", label: "P2WSH Multisig" },
  { value: "tr", label: "Taproot (Key Path)" },
];

const CHAIN_OPTIONS = [
  { key: "0" as const, label: "Receive (0)" },
  { key: "1" as const, label: "Change (1)" },
] as const;

interface BuilderPanelProps {
  builderScriptType: DescriptorConfig["scriptType"];
  setBuilderScriptType: (t: DescriptorConfig["scriptType"]) => void;
  isMulti: boolean;
  builderKeys: DescriptorConfig["keys"];
  addBuilderKey: () => void;
  removeBuilderKey: (index: number) => void;
  updateBuilderKey: (index: number, key: string) => void;
  builderThreshold: number;
  setBuilderThreshold: (m: number) => void;
  builderChain: 0 | 1;
  setBuilderChain: (c: 0 | 1) => void;
  generateKeyMaterial: () => void;
  isGeneratingKey: boolean;
  builtDescriptor: string | null;
  builtDescriptorError: string | null;
}

export function BuilderPanel({
  builderScriptType,
  setBuilderScriptType,
  isMulti,
  builderKeys,
  addBuilderKey,
  removeBuilderKey,
  updateBuilderKey,
  builderThreshold,
  setBuilderThreshold,
  builderChain,
  setBuilderChain,
  generateKeyMaterial,
  isGeneratingKey,
  builtDescriptor,
  builtDescriptorError,
}: BuilderPanelProps) {
  return (
    <div className="space-y-5">
      {builtDescriptor && (
        <motion.div variants={STEP_VARIANTS} initial="hidden" animate="visible">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
            Built Descriptor
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-surface-raised p-3">
            <span className="min-w-0 flex-1 break-all font-mono text-sm text-accent">
              {builtDescriptor}
            </span>
            <CopyButton text={builtDescriptor} />
          </div>
        </motion.div>
      )}

      {builtDescriptorError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {builtDescriptorError}
        </div>
      )}

      <div>
        <label htmlFor="script-type" className="mb-1 block text-sm font-medium text-text-secondary">
          Script type
        </label>
        <select
          id="script-type"
          value={builderScriptType}
          onChange={(e) => setBuilderScriptType(e.target.value as DescriptorConfig["scriptType"])}
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
        >
          {SCRIPT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isMulti && (
        <div>
          <label htmlFor="threshold" className="mb-1 block text-sm font-medium text-text-secondary">
            Signing threshold (M of {builderKeys.length})
          </label>
          <input
            id="threshold"
            type="number"
            min={1}
            max={builderKeys.length}
            value={builderThreshold}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 1;
              setBuilderThreshold(Math.max(1, Math.min(val, builderKeys.length)));
            }}
            className="w-24 rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">
            {isMulti ? "Key material (one xpub per cosigner)" : "Key material"}
          </p>
          <button
            onClick={generateKeyMaterial}
            disabled={isGeneratingKey}
            className="rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
          >
            {isGeneratingKey ? "Deriving…" : "Generate from seed"}
          </button>
        </div>

        <div className="space-y-2">
          {builderKeys.map((k, i) => (
            <div key={i} className="flex items-center gap-2">
              {isMulti && <span className="text-xs text-text-muted">Key {i + 1}</span>}
              <input
                type="text"
                value={k.key}
                onChange={(e) => updateBuilderKey(i, e.target.value)}
                placeholder="Paste xpub here…"
                aria-label={`Extended public key ${i + 1}`}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
              {isMulti && builderKeys.length > 1 && (
                <button
                  onClick={() => removeBuilderKey(i)}
                  aria-label={`Remove key ${i + 1}`}
                  className="rounded px-2 py-1 text-xs text-danger hover:bg-danger/10"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {isMulti && (
          <button onClick={addBuilderKey} className="mt-2 text-xs text-accent hover:underline">
            + Add cosigner key
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">Address chain</p>
        <PillToggle
          options={CHAIN_OPTIONS}
          value={String(builderChain) as "0" | "1"}
          onChange={(key) => setBuilderChain(Number(key) as 0 | 1)}
          label="Address chain"
        />
      </div>

      {builtDescriptor && (
        <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
          <span className="font-medium text-text-secondary">Checksum: </span>
          <span className="font-mono text-success">{builtDescriptor.split("#")[1]}</span>
          <span> — 8-character BCH error-detecting code over the bech32 alphabet</span>
        </div>
      )}
    </div>
  );
}
