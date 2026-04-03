import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { PlaygroundTab } from "./tabs/PlaygroundTab.tsx";
import { AvalancheTab } from "./tabs/AvalancheTab.tsx";
import { MiningPuzzleTab } from "./tabs/MiningPuzzleTab.tsx";
import { DeepDiveTab } from "./tabs/DeepDiveTab.tsx";

type HashTabKey = "playground" | "avalanche" | "mining" | "deep-dive";

const TABS = [
  { key: "playground", label: "Playground" },
  { key: "avalanche", label: "Avalanche" },
  { key: "mining", label: "Mining Puzzle" },
  { key: "deep-dive", label: "Deep Dive" },
];

/* ── Theory per tab ── */

function PlaygroundTheory() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <h3>What is SHA-256?</h3>
      <p>
        SHA-256 is a cryptographic hash function that maps any input to a fixed{" "}
        <strong>256-bit (32-byte)</strong> output. Bitcoin uses it everywhere: block header hashing,
        transaction IDs (TXIDs), and address derivation via <code>HASH160</code>.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Determinism"
          description="Same input, same fingerprint. No randomness involved."
        />
        <TheoryConceptCard
          dot="teal"
          title="Avalanche Effect"
          description="One letter shifts the whole digest. Try the demo to see it live."
        />
        <TheoryConceptCard
          dot="danger"
          title="Pre-image Resistance"
          description="You can verify, not reverse. This is what makes proof-of-work hard."
        />
        <TheoryConceptCard
          dot="warning"
          title="Fixed Output Length"
          description="Always 256 bits, always 64 hex chars, regardless of input size."
        />
      </div>

      <TheoryCallout
        label="WHY DOUBLE HASH?"
        title="Bitcoin often uses SHA-256d"
        description="Hashing twice is a conservative defense: it neutralizes length-extension properties of the Merkle-Damgård construction. Whether that was Satoshi's primary motivation or simply a safety margin is debated — but the result is a strictly harder-to-attack construction."
      />

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 cursor-pointer text-xs font-medium text-accent hover:underline"
      >
        {expanded ? "Hide details" : "Why not just once?"}
      </button>
      {expanded && (
        <p className="mt-2">
          One property double-hashing removes is <strong>length-extension</strong>: with a single
          SHA-256, anyone who knows <code>H(m)</code> can compute{" "}
          <code>H(m || padding || extra)</code> without knowing <code>m</code>. A second SHA-256
          round breaks that property. Whether this was the main reason Satoshi chose SHA-256d or
          simply a general precaution is unclear — Bitcoin's use cases (TXIDs, block hashing) don't
          directly resemble the MAC scenarios where length-extension is typically exploited.
        </p>
      )}
    </>
  );
}

function AvalancheTheory() {
  return (
    <>
      <h3>Avalanche Effect</h3>
      <p>
        A good hash function exhibits the Strict Avalanche Criterion: flipping any single input bit
        should flip each output bit with 50% probability.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Spatial Distribution"
          description="Flipped bits are spread uniformly across the output, not clustered."
        />
        <TheoryConceptCard
          dot="teal"
          title="One Bit Is Enough"
          description="Change just the least-significant bit of one character and the entire hash transforms."
        />
        <TheoryConceptCard
          dot="warning"
          title="64 Rounds"
          description="SHA-256 runs 64 rounds of mixing. The best public attack breaks 46 of 64 — an 18-round safety margin."
        />
      </div>
    </>
  );
}

function MiningTheory() {
  return (
    <>
      <h3>Proof of Work</h3>
      <p>
        In Bitcoin, mining means finding a nonce in an 80-byte block header such that
        SHA-256d(header) is below a numeric target. The demo below simplifies this to a prefix-zero
        rule on a short message — the real protocol uses double-SHA256 over a structured header and
        compares the full 256-bit hash against the target.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Difficulty"
          description="Each additional leading zero hex digit makes the puzzle ~16× harder. Bitcoin adjusts difficulty every 2,016 blocks to target ~10 minute intervals."
        />
        <TheoryConceptCard
          dot="danger"
          title="Hash Rate"
          description="The Bitcoin network collectively computes ~600 EH/s (600 × 10¹⁸). Your browser does perhaps 200,000. That is a trillion-fold gap."
        />
        <TheoryConceptCard
          dot="success"
          title="The Genesis Block"
          description="Block 0's hash has 10 leading hex zeros. Modern blocks require ~19+, reflecting astronomical difficulty growth since 2009."
        />
      </div>

      <TheoryCallout
        label="FUN FACT"
        title="Double Hash"
        description="Bitcoin uses SHA-256d (hash twice) for mining and TXIDs. The technique appears in Ferguson & Schneier's 'Practical Cryptography' (2003) as a conservative defense against length-extension properties of Merkle-Damgård hashes. Whether that was Satoshi's specific rationale or a general safety margin is unknown."
      />
    </>
  );
}

function DeepDiveTheory() {
  return (
    <>
      <h3>Cryptographic Foundations</h3>
      <p>
        SHA-256 was designed by the NSA and published by NIST in 2001. Its internal constants were
        chosen transparently to build trust.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Nothing Up My Sleeve"
          description="The initial hash values are derived from square roots of the first 8 primes. Anyone can verify them with a calculator — no hidden backdoor."
        />
        <TheoryConceptCard
          dot="teal"
          title="Birthday Paradox"
          description="Collision resistance is the square root of the output space: 2¹²⁸ for SHA-256. That is ~3.4 × 10³⁸ — far more than grains of sand on Earth."
        />
        <TheoryConceptCard
          dot="info"
          title="Merkle-Damgård"
          description="SHA-256 processes input in 512-bit blocks using chaining. This construction allows length-extension attacks — a known weakness that double-hashing neutralizes, though Bitcoin's specific use cases (TXIDs, block headers) don't involve the MAC-like scenarios where length-extension is typically exploited."
        />
      </div>

      <TheoryCallout
        label="SHA-3"
        title="Keccak and Sponges"
        description="SHA-3 (2012) uses a completely different 'sponge' construction that is immune to length-extension attacks by design. Bitcoin predates SHA-3 and relies on double-hashing instead."
      />
    </>
  );
}

const THEORY_CONTENT: Record<HashTabKey, () => React.JSX.Element> = {
  playground: PlaygroundTheory,
  avalanche: AvalancheTheory,
  mining: MiningTheory,
  "deep-dive": DeepDiveTheory,
};

/* ── Main component ── */

export default function HashPlayground() {
  const [input, setInput] = useState("Hello, Bitcoin!");
  const [activeTab, setActiveTab] = useState<HashTabKey>("playground");
  const [hasInteracted, setHasInteracted] = useState(false);
  const { completed, complete } = useModuleCompletion("hash");

  useEffect(() => {
    if (!completed && hasInteracted && input.length > 0) complete();
  }, [input, hasInteracted, completed, complete]);

  const handleInteract = useCallback(() => setHasInteracted(true), []);

  const Theory = THEORY_CONTENT[activeTab];

  return (
    <ModuleLayout
      moduleKey="hash"
      title="Hash Playground"
      moduleNumber={1}
      subtitle="Type anything below. Watch SHA-256 and SHA-256d materialize in real time."
      theoryContent={<Theory />}
      statusText="LIVE UPDATE <100MS"
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as HashTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "playground" && (
          <motion.div
            key="playground"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PlaygroundTab input={input} setInput={setInput} onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "avalanche" && (
          <motion.div
            key="avalanche"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <AvalancheTab input={input} setInput={setInput} onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "mining" && (
          <motion.div
            key="mining"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <MiningPuzzleTab onInteract={handleInteract} />
          </motion.div>
        )}
        {activeTab === "deep-dive" && (
          <motion.div
            key="deep-dive"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <DeepDiveTab onInteract={handleInteract} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
