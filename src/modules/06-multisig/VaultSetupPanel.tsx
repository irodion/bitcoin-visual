import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HexBox,
  ValueFlowArrow,
  SecurityCallout,
  PillToggle,
} from "../../shared/components/index.ts";
import { BTN_GHOST, CONTAINER_VARIANTS, STEP_VARIANTS } from "../../shared/components/styles.ts";
import { CosignerRow } from "./CosignerRow.tsx";
import { ScriptBreakdown } from "./ScriptBreakdown.tsx";
import type { MultisigState } from "./useMultisigState.ts";

const SCRIPT_VIEW_OPTIONS = [
  { key: "revealed", label: "Spending (revealed)" },
  { key: "locked", label: "On-chain (locked)" },
] as const;

type ScriptViewKey = (typeof SCRIPT_VIEW_OPTIONS)[number]["key"];

type VaultSetupProps = Pick<
  MultisigState,
  | "cosigners"
  | "generateCosignerKey"
  | "generateAllKeys"
  | "allKeysGenerated"
  | "redeemScript"
  | "redeemScriptHex"
  | "p2shScriptHashHex"
  | "p2wshScriptHashHex"
  | "p2shAddress"
  | "p2wshAddress"
>;

export function VaultSetupPanel({
  cosigners,
  generateCosignerKey,
  generateAllKeys,
  allKeysGenerated,
  redeemScript,
  redeemScriptHex,
  p2shScriptHashHex,
  p2wshScriptHashHex,
  p2shAddress,
  p2wshAddress,
}: VaultSetupProps) {
  const [scriptView, setScriptView] = useState<ScriptViewKey>("revealed");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Cosigner Public Keys
        </span>
        {!allKeysGenerated && (
          <button type="button" className={BTN_GHOST} onClick={generateAllKeys}>
            Generate All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {cosigners.map((c, i) => (
          <CosignerRow key={c.id} cosigner={c} index={i} onGenerate={generateCosignerKey} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {allKeysGenerated && redeemScript && redeemScriptHex && p2shAddress && p2wshAddress && (
          <motion.div
            key="derived"
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-2"
          >
            <motion.div variants={STEP_VARIANTS}>
              <ValueFlowArrow
                label="OP_CHECKMULTISIG"
                description="Sort pubkeys (BIP67), build 2-of-3 multisig script"
              />
            </motion.div>

            <motion.div variants={STEP_VARIANTS}>
              <div className="panel-warm rounded-input border border-border-amber p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                    Redeem Script ({redeemScript.length} bytes)
                  </span>
                  <PillToggle
                    options={SCRIPT_VIEW_OPTIONS}
                    value={scriptView}
                    onChange={setScriptView}
                    label="Script view"
                  />
                </div>
                {scriptView === "revealed" ? (
                  <>
                    <HexBox value={redeemScriptHex} variant="warm" truncate maxLength={80} />
                    <ScriptBreakdown redeemScript={redeemScript} />
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-text-secondary">
                      The blockchain stores only a hash — the spending conditions are hidden:
                    </div>
                    <HexBox
                      value={p2shScriptHashHex ?? ""}
                      variant="default"
                      label="HASH160 → 20 bytes (P2SH)"
                    />
                    <HexBox
                      value={p2wshScriptHashHex ?? ""}
                      variant="info"
                      label="SHA-256 → 32 bytes (P2WSH)"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={STEP_VARIANTS}>
              <ValueFlowArrow label="Hash" description="HASH160 for P2SH, SHA-256 for P2WSH" />
            </motion.div>

            <motion.div variants={STEP_VARIANTS}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="panel-cool rounded-input border border-border p-5">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                    P2SH Address
                  </div>
                  <HexBox value={p2shAddress} label="Legacy (starts with 3)" variant="default" />
                </div>
                <div className="panel-cool rounded-input border border-border p-5">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                    P2WSH Address
                  </div>
                  <HexBox value={p2wshAddress} label="SegWit (starts with bc1q)" variant="info" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={STEP_VARIANTS}>
              <SecurityCallout variant="warning">
                <strong>Back up your redeem script.</strong> Without it, funds locked in this
                multisig address cannot be spent — even if you have all the required private keys.
                The redeem script defines <em>which</em> keys can sign and <em>how many</em> are
                needed.
              </SecurityCallout>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
