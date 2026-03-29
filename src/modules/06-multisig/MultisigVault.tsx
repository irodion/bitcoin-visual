import { AnimatePresence, motion } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useMultisigState } from "./useMultisigState.ts";
import { VaultSetupPanel } from "./VaultSetupPanel.tsx";
import { PSBTWorkflow } from "./PSBTWorkflow.tsx";

const TABS = [
  { key: "setup", label: "Vault Setup" },
  { key: "sign", label: "Sign & Broadcast" },
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
        onTabChange: (key) => state.setActiveTab(key as "setup" | "sign"),
      }}
    >
      <AnimatePresence mode="wait">
        {state.activeTab === "setup" ? (
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
              p2shAddress={state.p2shAddress}
              p2wshAddress={state.p2wshAddress}
            />
          </motion.div>
        ) : (
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
      </AnimatePresence>
    </ModuleLayout>
  );
}
