import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ModuleLayout,
  TheoryConceptCard,
  TheoryCallout,
  CodeReviewChallenge,
} from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useMultisigState, type MultisigTabKey } from "./useMultisigState.ts";
import { VaultSetupPanel } from "./VaultSetupPanel.tsx";
import { PSBTWorkflow } from "./PSBTWorkflow.tsx";
import { SecurityModelsPanel } from "./SecurityModelsPanel.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { MULTISIG_CODE_REVIEW } from "./data/codeReviewData.ts";

const TABS = [
  { key: "setup", label: "Vault Setup" },
  { key: "sign", label: "Sign & Broadcast" },
  { key: "models", label: "Security Models" },
  { key: "code-review", label: "Code Review" },
];

function MultisigTheory() {
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
          description="All P2SH addresses start with '3' and look identical on-chain. A 15-of-15 corporate vault is indistinguishable from a Lightning HTLC or a simple hash-lock — until someone spends. Then the full script is revealed forever. Taproot improves on this: in the common case (key-path spend), no script is revealed at all. If a script-path is used, only the single branch taken is disclosed — the rest of the Merkle tree stays hidden."
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

function CodeReviewTheory() {
  return (
    <>
      <h3>Script Enforcement</h3>
      <p>
        A multisig spending condition is enforced <strong>on-chain by the script</strong>, not by
        application logic. The witness script encodes the policy; the signatures must satisfy it.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Script = Policy"
          description="OP_2 <K1> <K2> <K3> OP_3 OP_CHECKMULTISIG encodes '2 of these 3 keys.' The network validates this — not your app."
        />
        <TheoryConceptCard
          dot="danger"
          title="Distinct Keys"
          description="Two valid signatures must come from two different authorized public keys. sig(K1) + sig(K1) does not satisfy a 2-of-3 policy, even though both signatures are individually valid."
        />
        <TheoryConceptCard
          dot="info"
          title="On-Chain vs Off-Chain"
          description="An application can track approvals, but only the script and its signatures determine whether Bitcoin nodes accept the transaction."
        />
      </div>

      <TheoryCallout
        label="KEY INSIGHT"
        title="Count signatures, not approvals"
        description="The spending policy is 'M valid signatures from M distinct keys committed in the script.' Application-level approval workflows are coordination tools — they cannot replace script enforcement."
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
      subtitle={
        state.activeTab === "code-review"
          ? "Review a teammate's multisig spend validation and spot the flaw."
          : "Build a 2-of-3 multisig vault, coordinate partial signatures via PSBT, and broadcast."
      }
      theoryContent={state.activeTab === "code-review" ? <CodeReviewTheory /> : <MultisigTheory />}
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
        {state.activeTab === "code-review" && (
          <motion.div
            key="code-review"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <CodeReviewChallenge challenge={MULTISIG_CODE_REVIEW} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
