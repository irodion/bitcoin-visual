import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { CentralLedgerTab } from "./tabs/CentralLedgerTab.tsx";
import { DoubleSpendTab } from "./tabs/DoubleSpendTab.tsx";
import { NetworkFlowTab } from "./tabs/NetworkFlowTab.tsx";
import { LockersTab } from "./tabs/LockersTab.tsx";

type IntroTabKey = "central" | "double-spend" | "network" | "lockers";

const TABS = [
  { key: "central", label: "Central Ledger" },
  { key: "double-spend", label: "Double Spend" },
  { key: "network", label: "The Network" },
  { key: "lockers", label: "Lockers" },
];

/* ── Theory per tab ── */

function CentralLedgerTheory() {
  return (
    <>
      <h3>Why Bitcoin?</h3>
      <p>
        Digital money is usually managed by central institutions. They maintain the official ledger,
        decide who can participate, and can freeze, reverse, or delay transfers.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Trusted Third Party"
          description="Every traditional payment passes through an intermediary who authorizes and records it."
        />
        <TheoryConceptCard
          dot="danger"
          title="Censorship Risk"
          description="A central operator can block transactions, freeze accounts, or deny access entirely."
        />
        <TheoryConceptCard
          dot="teal"
          title="Single Point of Failure"
          description="If the institution goes down, gets hacked, or acts badly, the whole system is at risk."
        />
      </div>

      <TheoryCallout
        label="KEY INSIGHT"
        title="Bitcoin's alternative"
        description="Bitcoin replaces central ledger maintenance with network consensus — many computers independently verifying the same rules."
      />
    </>
  );
}

function DoubleSpendTheory() {
  return (
    <>
      <h3>The Double-Spend Problem</h3>
      <p>
        Digital information is easy to copy. If digital coins were just files, they could be
        duplicated and spent multiple times. A payment system needs a way to agree which spends are
        valid.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Digital Copying"
          description="Unlike physical cash, digital data can be duplicated perfectly. This creates ambiguity about which copy is 'real.'"
        />
        <TheoryConceptCard
          dot="teal"
          title="Consensus"
          description="The network must agree on one version of history. Bitcoin achieves this through shared rules and proof of work."
        />
        <TheoryConceptCard
          dot="success"
          title="Shared Rules"
          description="Every node checks every transaction against the same rules. No single entity decides — the math does."
        />
      </div>
    </>
  );
}

function NetworkTheory() {
  return (
    <>
      <h3>The Bitcoin Network</h3>
      <p>
        Bitcoin is a network of computers running the same software. They receive, validate, and
        relay transactions, then store or verify the blockchain.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Nodes"
          description="Computers that enforce rules, verify transactions, and maintain a copy of the blockchain."
        />
        <TheoryConceptCard
          dot="teal"
          title="Miners"
          description="Specialized participants who compete to add new blocks by finding a proof-of-work solution."
        />
        <TheoryConceptCard
          dot="success"
          title="Blocks"
          description="Batches of valid transactions plus proof of work. Each block references the previous one, forming a chain."
        />
      </div>

      <TheoryCallout
        label="IMPORTANT"
        title="Nodes ≠ Miners"
        description="Every miner runs a node, but most nodes don't mine. Nodes verify; miners compete to extend the chain. Both roles are essential."
      />
    </>
  );
}

function LockersTheory() {
  return (
    <>
      <h3>Ownership as Lockers</h3>
      <p>
        Bitcoin ownership is not an account balance at a bank. It is the ability to unlock spendable
        pieces of value and lock them again for someone else.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Spendable Outputs"
          description="Each 'locker' holds some bitcoin and has a lock condition. Only the person with the right key can open it."
        />
        <TheoryConceptCard
          dot="teal"
          title="Change"
          description="When you spend, you often create two new lockers: one for the recipient and one returning the leftover to yourself."
        />
      </div>

      <TheoryCallout
        label="COMING NEXT"
        title="Module 3: UTXOs"
        description="The lockers analogy becomes real 'Unspent Transaction Outputs' (UTXOs) — the actual data structure Bitcoin uses to track spendable value."
      />
    </>
  );
}

const THEORY_CONTENT: Record<IntroTabKey, () => React.JSX.Element> = {
  central: CentralLedgerTheory,
  "double-spend": DoubleSpendTheory,
  network: NetworkTheory,
  lockers: LockersTheory,
};

/* ── Main component ── */

export default function WhyBitcoinExists() {
  const [activeTab, setActiveTab] = useState<IntroTabKey>("central");
  const { completed, complete } = useModuleCompletion("intro");

  const handleInteract = useCallback(() => {
    if (!completed) complete();
  }, [completed, complete]);

  const Theory = THEORY_CONTENT[activeTab];

  return (
    <ModuleLayout
      moduleKey="intro"
      title="Why Bitcoin Exists"
      moduleNumber={0}
      subtitle="How a peer-to-peer network replaces the need to trust a single authority."
      theoryContent={<Theory />}
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as IntroTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "central" && (
          <motion.div
            key="central"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <CentralLedgerTab onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "double-spend" && (
          <motion.div
            key="double-spend"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <DoubleSpendTab onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "network" && (
          <motion.div
            key="network"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <NetworkFlowTab onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "lockers" && (
          <motion.div
            key="lockers"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <LockersTab onInteract={handleInteract} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
