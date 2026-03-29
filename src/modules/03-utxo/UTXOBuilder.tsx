import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { useUTXOState } from "./useUTXOState.ts";
import { UTXOPool } from "./UTXOPool.tsx";
import { TransactionBuilder } from "./TransactionBuilder.tsx";
import { TxHexInspector } from "./TxHexInspector.tsx";
import { TxIDPanel } from "./TxIDPanel.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const TABS = [
  { key: "legacy", label: "Legacy P2PKH" },
  { key: "segwit", label: "SegWit P2WPKH" },
];

function TheoryContent() {
  return (
    <>
      <h3>The UTXO Model</h3>
      <p>
        Bitcoin does not use accounts with balances. Instead, your &ldquo;balance&rdquo; is the sum
        of all <strong>Unspent Transaction Outputs (UTXOs)</strong> you control. Each UTXO is a
        discrete coin that can only be spent in full.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="UTXO vs Account Model"
          description="Ethereum tracks account balances. Bitcoin tracks individual coins (UTXOs). To pay someone, you consume entire UTXOs as inputs and create new outputs."
        />
        <TheoryConceptCard
          dot="teal"
          title="Change Outputs"
          description="If your UTXO is worth 0.5 BTC but you only want to send 0.4 BTC, you must send the remaining 0.1 BTC back to yourself as 'change'."
        />
        <TheoryConceptCard
          dot="danger"
          title="Fees"
          description="The difference between total inputs and total outputs is the miner fee. There is no explicit fee field — it's implicit: fee = inputs - outputs."
        />
        <TheoryConceptCard
          dot="info"
          title="Transaction Serialization"
          description="A transaction is serialized as: version + input count + inputs + output count + outputs + locktime. Each field has a specific byte format."
        />
      </div>

      <TheoryCallout
        label="COMMON GOTCHA"
        title="Why is the TXID reversed?"
        description="Bitcoin internally stores hashes in little-endian byte order, but displays them in big-endian (reversed). The TXID you see in a block explorer is the SHA-256d hash with its bytes reversed."
      />

      <h3>SegWit</h3>
      <p>
        SegWit (BIP141) moves signature data to a separate <strong>witness</strong> field. The TXID
        is computed from the legacy serialization (without witness), which fixes transaction
        malleability. The <code>wtxid</code> includes witness data.
      </p>
    </>
  );
}

export default function UTXOBuilder() {
  const state = useUTXOState();
  const { completed, complete } = useModuleCompletion("utxo");

  useEffect(() => {
    if (!completed && state.isValid && state.txid) complete();
  }, [state.isValid, state.txid, completed, complete]);

  const activeTab = state.isSegWit ? "segwit" : "legacy";
  const displayHex = state.isSegWit ? state.witnessSerializedHex : state.serializedHex;

  return (
    <ModuleLayout
      moduleKey="utxo"
      title="UTXO & Transactions"
      moduleNumber={3}
      subtitle="Select UTXOs, build a transaction, and inspect every byte of the serialized result."
      theoryContent={<TheoryContent />}
      statusText="LIVE UPDATE"
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => state.setSegWit(key === "segwit"),
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl space-y-5"
      >
        <motion.div variants={stepVariants}>
          <UTXOPool
            utxos={state.utxos}
            selectedIds={state.selectedIds}
            totalInputSats={state.totalInputSats}
            onToggle={state.toggleUtxo}
          />
        </motion.div>

        <motion.div variants={stepVariants}>
          <TransactionBuilder
            selectedUtxos={state.selectedUtxos}
            recipientAmountBTC={state.recipientAmountBTC}
            onRecipientAmountChange={state.setRecipientAmount}
            totalInputSats={state.totalInputSats}
            recipientAmountSats={state.recipientAmountSats}
            changeAmountSats={state.changeAmountSats}
            feeSats={state.feeSats}
            isValid={state.isValid}
            isSegWit={state.isSegWit}
            error={state.error}
          />
        </motion.div>

        {state.isValid && displayHex && (
          <motion.div variants={stepVariants}>
            <TxHexInspector
              serializedHex={displayHex}
              segments={state.hexSegments}
              isSegWit={state.isSegWit}
            />
          </motion.div>
        )}

        {state.isValid && state.txidIntermediate && state.txid && (
          <motion.div variants={stepVariants}>
            <TxIDPanel
              txidIntermediate={state.txidIntermediate}
              txid={state.txid}
              wtxid={state.wtxid}
              isSegWit={state.isSegWit}
            />
          </motion.div>
        )}
      </motion.div>
    </ModuleLayout>
  );
}
