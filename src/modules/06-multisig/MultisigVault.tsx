import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useMultisigState, type MultisigTabKey } from "./useMultisigState.ts";
import { VaultSetupPanel } from "./VaultSetupPanel.tsx";
import { PSBTWorkflow } from "./PSBTWorkflow.tsx";
import { SecurityModelsPanel } from "./SecurityModelsPanel.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

const TABS = [
  { key: "setup", label: "Vault Setup" },
  { key: "sign", label: "Sign & Broadcast" },
  { key: "models", label: "Security Models" },
];

function TheoryContent() {
  return (
    <>
      <h3>Multisig</h3>
      <p>
        A multisig address requires <strong>M-of-N</strong> private keys to spend funds. This module
        builds a 2-of-3 vault: three cosigners, any two can authorize a transaction.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="M-of-N Scripts"
          description="OP_CHECKMULTISIG verifies M valid signatures against N public keys embedded in the redeem script. The script defines the spending policy."
        />
        <TheoryConceptCard
          dot="teal"
          title="P2WSH (Pay-to-Witness-Script-Hash)"
          description="SegWit wrapper for complex scripts. The address commits to SHA-256 of the witness script. The full script is revealed only when spending."
        />
        <TheoryConceptCard
          dot="info"
          title="PSBT (BIP174)"
          description="Partially Signed Bitcoin Transactions allow multiple parties to independently add signatures. The PSBT travels between cosigners until the threshold is met."
        />
        <TheoryConceptCard
          dot="danger"
          title="CHECKMULTISIG Bug"
          description="Bitcoin's OP_CHECKMULTISIG has a famous off-by-one error: it pops one extra item from the stack. A dummy OP_0 must be included in every multisig witness."
        />
        <TheoryConceptCard
          dot="success"
          title="Custody Models"
          description="The same M-of-N primitive supports radically different trust models depending on who holds the keys. The Security Models tab explores six real-world configurations."
        />
        <TheoryConceptCard
          dot="warning"
          title="Commit-Reveal"
          description="A redeem script is a sealed envelope. You commit the hash to the blockchain; the full spending conditions stay hidden until you spend. This is the same commit-reveal pattern used in sealed-bid auctions and zero-knowledge proofs — applied directly to Bitcoin's transaction system."
        />
        <TheoryConceptCard
          dot="info"
          title="Fee Shifting"
          description="Before P2SH, senders paid fees for the receiver's complex script — a bare 2-of-3 multisig output costs ~253 bytes. P2SH shrinks every output to 23 bytes regardless of complexity. The person who chooses the spending policy pays for it at spend time, not the sender."
        />
        <TheoryConceptCard
          dot="teal"
          title="Privacy Until Spend"
          description="All P2SH addresses start with '3' and look identical on-chain. A 15-of-15 corporate vault is indistinguishable from a Lightning HTLC or a simple hash-lock — until someone spends. Then the full script is revealed forever. Taproot later fixes this: only the used branch is disclosed."
        />
      </div>

      <TheoryCallout
        label="KEY CONCEPT"
        title="Cosigners sign independently"
        description="Each cosigner can sign the PSBT on a separate device. The PSBT carries the unsigned transaction and partial signatures between parties until the M-of-N threshold is reached."
      />
    </>
  );
}

export default function MultisigVault() {
  const state = useMultisigState();
  const { completed, complete } = useModuleCompletion("multisig");

  useEffect(() => {
    if (!completed && state.allKeysGenerated) complete();
  }, [state.allKeysGenerated, completed, complete]);

  return (
    <ModuleLayout
      moduleKey="multisig"
      title="Multisig Vault"
      moduleNumber={6}
      subtitle="Build a 2-of-3 multisig vault, coordinate partial signatures via PSBT, and broadcast."
      theoryContent={<TheoryContent />}
      statusText={state.psbtStep > 0 ? `STEP ${state.psbtStep} / 4` : undefined}
      tabConfig={{
        tabs: TABS,
        activeTab: state.activeTab,
        onTabChange: (key) => state.setActiveTab(key as MultisigTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {state.activeTab === "setup" && (
          <motion.div
            key="setup"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <VaultSetupPanel
              cosigners={state.cosigners}
              generateCosignerKey={state.generateCosignerKey}
              generateAllKeys={state.generateAllKeys}
              allKeysGenerated={state.allKeysGenerated}
              redeemScript={state.redeemScript}
              redeemScriptHex={state.redeemScriptHex}
              p2shScriptHashHex={state.p2shScriptHashHex}
              p2wshScriptHashHex={state.p2wshScriptHashHex}
              p2shAddress={state.p2shAddress}
              p2wshAddress={state.p2wshAddress}
            />
          </motion.div>
        )}
        {state.activeTab === "sign" && (
          <motion.div
            key="sign"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PSBTWorkflow
              allKeysGenerated={state.allKeysGenerated}
              mockUtxo={state.mockUtxo}
              sendAmountSats={state.sendAmountSats}
              feeSats={state.feeSats}
              psbtStep={state.psbtStep}
              createPSBT={state.createPSBT}
              signWithCosigner={state.signWithCosigner}
              finalizePSBT={state.finalizePSBT}
              simulateBroadcast={state.simulateBroadcast}
              psbtDisplayHex={state.psbtDisplayHex}
              signatureTracker={state.signatureTracker}
              finalizedTxHex={state.finalizedTxHex}
              txid={state.txid}
              broadcastSimulated={state.broadcastSimulated}
              sighashDetails={state.sighashDetails}
            />
          </motion.div>
        )}
        {state.activeTab === "models" && (
          <motion.div
            key="models"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <SecurityModelsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
