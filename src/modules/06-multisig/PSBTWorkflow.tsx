import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { bytesToHex } from "@noble/hashes/utils.js";
import { HexBox, ValueFlowArrow } from "../../shared/components/index.ts";
import { STEP_VARIANTS, CONTAINER_VARIANTS } from "../../shared/components/styles.ts";
import { PSBTStepCard } from "./PSBTStepCard.tsx";
import { SignatureTracker } from "./SignatureTracker.tsx";
import { SighashDetail } from "./SighashDetail.tsx";
import type { MultisigState } from "./useMultisigState.ts";

type PSBTWorkflowProps = Pick<
  MultisigState,
  | "allKeysGenerated"
  | "mockUtxo"
  | "sendAmountSats"
  | "feeSats"
  | "psbtStep"
  | "createPSBT"
  | "signWithCosigner"
  | "finalizePSBT"
  | "simulateBroadcast"
  | "psbtDisplayHex"
  | "signatureTracker"
  | "finalizedTxHex"
  | "txid"
  | "broadcastSimulated"
  | "sighashDetails"
>;

/**
 * Map psbtStep (0-4) to card status.
 * Card N is active when psbtStep === N-1, complete when psbtStep >= N.
 */
function stepStatus(psbtStep: number, cardNumber: number): "pending" | "active" | "complete" {
  if (psbtStep >= cardNumber) return "complete";
  if (psbtStep === cardNumber - 1) return "active";
  return "pending";
}

export function PSBTWorkflow({
  allKeysGenerated,
  mockUtxo,
  sendAmountSats,
  feeSats,
  psbtStep,
  createPSBT,
  signWithCosigner,
  finalizePSBT,
  simulateBroadcast,
  psbtDisplayHex,
  signatureTracker,
  finalizedTxHex,
  txid,
  broadcastSimulated,
  sighashDetails,
}: PSBTWorkflowProps) {
  const navigate = useNavigate();
  const handleBroadcast = () => {
    simulateBroadcast();
    void navigate("/blockchain");
  };

  if (!allKeysGenerated) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="panel-cool flex items-center justify-center rounded-[24px] border border-border p-10 text-center">
          <p className="text-sm text-text-muted">
            Complete <strong className="text-text-primary">Vault Setup</strong> first — generate all
            3 cosigner keys to begin the PSBT workflow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-2"
    >
      {/* Step 1: Create PSBT */}
      <motion.div variants={STEP_VARIANTS}>
        <PSBTStepCard
          stepNumber={1}
          title="Create Unsigned PSBT"
          description={
            mockUtxo
              ? `Spending UTXO: ${bytesToHex(mockUtxo.txid).slice(0, 16)}…:${mockUtxo.vout} (${Number(mockUtxo.value).toLocaleString()} sats) → Send ${Number(sendAmountSats).toLocaleString()} sats, fee ${Number(feeSats).toLocaleString()} sats`
              : "Waiting for vault setup…"
          }
          status={stepStatus(psbtStep, 1)}
          actionLabel="Create PSBT"
          onAction={createPSBT}
        >
          {psbtDisplayHex && psbtStep >= 1 && (
            <div className="rounded-[20px] border border-border bg-surface p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                PSBT State
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-warning-heading">
                {psbtDisplayHex}
              </pre>
            </div>
          )}
        </PSBTStepCard>
      </motion.div>

      {psbtStep >= 1 && (
        <motion.div variants={STEP_VARIANTS}>
          <ValueFlowArrow
            label="BIP143 Sighash"
            description="Compute the sighash for this input using BIP143 (SegWit)"
          />
        </motion.div>
      )}

      {/* Step 2: Cosigner 1 Signs */}
      <motion.div variants={STEP_VARIANTS}>
        <PSBTStepCard
          stepNumber={2}
          title="Cosigner 1 Signs (Phone)"
          description="Derive the sighash, sign with Cosigner 1's private key, and add the partial signature to the PSBT."
          status={stepStatus(psbtStep, 2)}
          actionLabel="Sign as Cosigner 1"
          onAction={() => signWithCosigner(0)}
        >
          {psbtStep >= 2 && (
            <>
              <SignatureTracker entries={signatureTracker} threshold={2} />
              {sighashDetails && <SighashDetail details={sighashDetails} />}
            </>
          )}
        </PSBTStepCard>
      </motion.div>

      {psbtStep >= 2 && (
        <motion.div variants={STEP_VARIANTS}>
          <ValueFlowArrow
            label="ECDSA Sign"
            description="Add second partial signature to meet the 2-of-3 threshold"
          />
        </motion.div>
      )}

      {/* Step 3: Cosigner 2 Signs */}
      <motion.div variants={STEP_VARIANTS}>
        <PSBTStepCard
          stepNumber={3}
          title="Cosigner 2 Signs (Hardware HSM)"
          description="Only 2 of 3 signatures are needed. Once Cosigner 2 signs, the threshold is met."
          status={stepStatus(psbtStep, 3)}
          actionLabel="Sign as Cosigner 2"
          onAction={() => signWithCosigner(1)}
        >
          {psbtStep >= 3 && <SignatureTracker entries={signatureTracker} threshold={2} />}
        </PSBTStepCard>
      </motion.div>

      {psbtStep >= 3 && (
        <motion.div variants={STEP_VARIANTS}>
          <ValueFlowArrow
            label="Finalize"
            description="Combine partial signatures into the witness stack"
          />
        </motion.div>
      )}

      {/* Step 4: Finalize & Broadcast */}
      <motion.div variants={STEP_VARIANTS}>
        <PSBTStepCard
          stepNumber={4}
          title="Finalize & Broadcast"
          description="Build the witness stack (OP_0 dummy + 2 signatures + witnessScript) and extract the signed transaction."
          status={stepStatus(psbtStep, 4)}
          actionLabel="Finalize PSBT"
          onAction={finalizePSBT}
        >
          {psbtStep >= 4 && finalizedTxHex && txid && (
            <div className="space-y-3">
              <HexBox
                value={finalizedTxHex}
                label="Signed Transaction (witness)"
                variant="success"
                truncate
                maxLength={120}
              />
              <HexBox value={txid} label="TXID (reversed byte order)" variant="info" />

              {!broadcastSimulated ? (
                <button
                  type="button"
                  onClick={handleBroadcast}
                  className="cursor-pointer rounded-pill border border-success/40 bg-success/10 px-5 py-2 text-sm font-bold text-success transition-opacity hover:opacity-90 active:opacity-80"
                >
                  Broadcast &amp; Mine
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-badge border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                  Transaction broadcast to the network (simulated)
                </div>
              )}
            </div>
          )}
        </PSBTStepCard>
      </motion.div>
    </motion.div>
  );
}
