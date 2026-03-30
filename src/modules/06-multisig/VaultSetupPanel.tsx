import { AnimatePresence, motion } from "framer-motion";
import { HexBox, ValueFlowArrow, SecurityCallout } from "../../shared/components/index.ts";
import { BTN_GHOST, CONTAINER_VARIANTS, STEP_VARIANTS } from "../../shared/components/styles.ts";
import { CosignerRow } from "./CosignerRow.tsx";
import { ScriptBreakdown } from "./ScriptBreakdown.tsx";
import type { MultisigState } from "./useMultisigState.ts";

type VaultSetupProps = Pick<
  MultisigState,
  | "cosigners"
  | "generateCosignerKey"
  | "generateAllKeys"
  | "allKeysGenerated"
  | "redeemScript"
  | "redeemScriptHex"
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
  p2shAddress,
  p2wshAddress,
}: VaultSetupProps) {
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
                <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                  Redeem Script ({redeemScript.length} bytes)
                </div>
                <HexBox value={redeemScriptHex} variant="warm" truncate maxLength={80} />
                <ScriptBreakdown redeemScript={redeemScript} />
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
