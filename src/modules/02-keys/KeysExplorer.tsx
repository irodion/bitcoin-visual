import { type ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bytesToHex } from "@noble/hashes/utils.js";
import { generatePrivateKey } from "../../shared/crypto/index.ts";
import {
  ModuleLayout,
  ValueFlowArrow,
  SecurityCallout,
  TheoryConceptCard,
  TheoryCallout,
  CodeReviewChallenge,
} from "../../shared/components/index.ts";
import { CONTAINER_VARIANTS, STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useKeyPipeline, type PipelineResult } from "./useKeyPipeline.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { EntropyInput } from "./EntropyInput.tsx";
import { PipelineStep } from "./PipelineStep.tsx";
import { EllipticCurvesTab } from "./EllipticCurvesTab.tsx";
import { KEYS_CODE_REVIEW } from "./data/codeReviewData.ts";

type KeysTabKey = "pipeline" | "curves" | "code-review";

const TABS = [
  { key: "pipeline", label: "Key Pipeline" },
  { key: "curves", label: "Elliptic Curves" },
  { key: "code-review", label: "Code Review" },
];

interface StepDef {
  arrow?: { label: string; description: string };
  title: string;
  algorithm: string;
  algorithmDetail: string;
  value: (p: PipelineResult) => string | Uint8Array | null;
  hexVariant?: "default" | "danger" | "info" | "success";
  overlay?: ReactNode;
}

const PRIVATE_KEY_OVERLAY = (
  <SecurityCallout variant="danger">
    This is a private key. Never share it with anyone — whoever holds this key controls the funds.
  </SecurityCallout>
);

const PIPELINE_STEPS: StepDef[] = [
  {
    arrow: {
      label: "= Private Key",
      description: "The entropy bytes are used directly as the private key (must be 1 < k < n)",
    },
    title: "Private Key",
    algorithm: "secp256k1 scalar",
    algorithmDetail:
      "A valid scalar on the secp256k1 curve — must be between 1 and the curve order n",
    value: (p) => p.entropy,
    hexVariant: "danger",
    overlay: PRIVATE_KEY_OVERLAY,
  },
  {
    arrow: {
      label: "secp256k1",
      description: "Elliptic curve point multiplication: P = k × G (generator point)",
    },
    title: "Public Key (compressed)",
    algorithm: "k × G",
    algorithmDetail:
      "Multiply private key by the secp256k1 generator point G — prefix 02 (even y) or 03 (odd y)",
    value: (p) => p.publicKey,
    hexVariant: "info",
  },
  {
    arrow: {
      label: "HASH160",
      description: "SHA-256 then RIPEMD-160: compresses 33 bytes → 20 bytes",
    },
    title: "Public Key Hash",
    algorithm: "SHA-256 + RIPEMD-160",
    algorithmDetail: "RIPEMD-160(SHA-256(publicKey)) — also known as HASH160 in Bitcoin",
    value: (p) => p.publicKeyHash,
    hexVariant: "info",
  },
  {
    arrow: {
      label: "Base58Check",
      description: "Version byte (0x00) + HASH160 + 4-byte checksum → Base58 encoding",
    },
    title: "P2PKH Address",
    algorithm: "Base58Check",
    algorithmDetail: "Pay-to-Public-Key-Hash — legacy address format starting with '1' on mainnet",
    value: (p) => p.p2pkhAddress,
    hexVariant: "success",
  },
  {
    arrow: {
      label: "Bech32",
      description: "SegWit native: witness version 0 + HASH160 → Bech32 encoding",
    },
    title: "P2WPKH Address",
    algorithm: "Bech32",
    algorithmDetail:
      "Pay-to-Witness-Public-Key-Hash — native SegWit address starting with 'bc1q' on mainnet",
    value: (p) => p.p2wpkhAddress,
    hexVariant: "success",
  },
];

function PipelineTheory() {
  return (
    <>
      <h3>Private Keys</h3>
      <p>
        A Bitcoin private key is simply a random <strong>256-bit number</strong> (32 bytes). The
        only constraint is it must be between 1 and the secp256k1 curve order <code>n</code>.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="danger"
          title="Entropy → Private Key"
          description="32 random bytes that satisfy the curve constraint. Here we use raw entropy directly."
        />
        <TheoryConceptCard
          dot="accent"
          title="secp256k1"
          description="P = k × G — one-way scalar multiplication on the elliptic curve. You cannot recover k from P."
        />
        <TheoryConceptCard
          dot="info"
          title="Compressed Public Keys"
          description="Store x + prefix (02/03). Reduces 65 bytes → 33 bytes."
        />
        <TheoryConceptCard
          dot="teal"
          title="HASH160"
          description="RIPEMD-160(SHA-256(pubkey)) — compresses 33 bytes → 20 bytes."
        />
      </div>

      <TheoryCallout
        label="TWO ADDRESS FORMATS"
        title="P2PKH (Legacy) & P2WPKH (SegWit)"
        description="Both encode the same key hash. SegWit (bc1q) has lower fees and better error detection."
      />

      <h3>P2PKH (Legacy)</h3>
      <p>
        Original format (starting with <code>1</code>). Uses <strong>Base58Check</strong>: version
        byte + HASH160 + 4-byte checksum.
      </p>

      <h3>P2WPKH (SegWit)</h3>
      <p>
        Modern replacement (starting with <code>bc1q</code>). Uses <strong>Bech32</strong> with
        witness version 0. Recommended format today.
      </p>
    </>
  );
}

function ECTheory() {
  return (
    <>
      <h3>Elliptic Curves</h3>
      <p>
        An elliptic curve is defined by <strong>y² = x³ + ax + b</strong>. Over a finite field F
        <sub>p</sub>, the set of solutions forms a mathematical group used for public key
        cryptography.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Point Addition"
          description="Draw a line through P and Q, find the third intersection with the curve, then reflect across the x-axis. This defines P + Q."
        />
        <TheoryConceptCard
          dot="teal"
          title="Point Doubling"
          description="When P = Q, use the tangent line at P instead of a secant. This is how we compute 2P."
        />
        <TheoryConceptCard
          dot="info"
          title="Scalar Multiplication"
          description="k × P = P added to itself k times. The double-and-add algorithm makes this efficient: O(log k) operations."
        />
        <TheoryConceptCard
          dot="danger"
          title="Finite Fields"
          description="Real curves use integers mod a prime p. Points become discrete — no continuous line, but the same algebraic rules apply."
        />
      </div>

      <TheoryCallout
        label="ONE-WAY TRAPDOOR"
        title="The Discrete Logarithm Problem"
        description="Given k × P and P, finding k is computationally infeasible for large curves. This is what makes public key cryptography secure."
      />

      <h3>Toy Curve</h3>
      <p>
        This playground uses F<sub>61</sub> (y² = x³ + 9x + 1) with only 72 points. The math is
        identical to secp256k1 — the security comes from the field size.
      </p>
    </>
  );
}

function CodeReviewTheory() {
  return (
    <>
      <h3>Address Derivation Review</h3>
      <p>
        P2PKH address generation chains multiple cryptographic operations. Each step has a specific
        purpose — skipping or reordering any of them produces a valid-looking but semantically wrong
        address.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="HASH160 = SHA-256 + RIPEMD-160"
          description="Both hash rounds are required. RIPEMD-160 alone does not provide the same pre-image resistance."
        />
        <TheoryConceptCard
          dot="danger"
          title="Public Keys Are Not Addresses"
          description="Encoding a raw public key as Base58 does not make it an address. The hash step provides a layer of quantum resistance and a shorter representation."
        />
        <TheoryConceptCard
          dot="teal"
          title="Double-SHA-256 Checksum"
          description="The 4-byte checksum uses SHA-256d, not a single SHA-256. This prevents length-extension attacks on the checksum."
        />
      </div>

      <TheoryCallout
        label="REVIEW TIP"
        title="Compare output sizes"
        description="HASH160 produces 20 bytes. If you see 33 bytes in the versioned payload, the public key was not hashed."
      />
    </>
  );
}

const THEORY_CONTENT: Record<KeysTabKey, () => React.JSX.Element> = {
  pipeline: PipelineTheory,
  curves: ECTheory,
  "code-review": CodeReviewTheory,
};

export default function KeysExplorer() {
  const [entropyHex, setEntropyHex] = useState("");
  const [generationKey, setGenerationKey] = useState(0);
  const [activeTab, setActiveTab] = useState<KeysTabKey>("pipeline");
  const pipeline = useKeyPipeline(entropyHex);
  const { completed, complete } = useModuleCompletion("keys");

  useEffect(() => {
    if (!completed && pipeline.isValid) complete();
  }, [pipeline.isValid, completed, complete]);

  function handleGenerate() {
    const privKey = generatePrivateKey();
    setEntropyHex(bytesToHex(privKey));
    setGenerationKey((k) => k + 1);
  }

  const Theory = THEORY_CONTENT[activeTab];

  return (
    <ModuleLayout
      moduleKey="keys"
      title="Keys & Address Generator"
      moduleNumber={2}
      subtitle="Generate a private key, derive the public key, and encode Bitcoin addresses step by step."
      theoryContent={<Theory />}
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as KeysTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "pipeline" && (
          <motion.div
            key="pipeline"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="mx-auto max-w-2xl space-y-2">
              <EntropyInput
                value={entropyHex}
                onChange={setEntropyHex}
                onGenerate={handleGenerate}
                error={pipeline.error}
              />

              {(pipeline.isValid || pipeline.entropy) && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={generationKey}
                    variants={CONTAINER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2 pt-4"
                  >
                    <motion.div variants={STEP_VARIANTS}>
                      <PipelineStep
                        stepNumber={1}
                        title="Entropy"
                        algorithm="CSPRNG"
                        algorithmDetail="Cryptographically secure pseudorandom number generator — 32 random bytes from the OS"
                        value={pipeline.entropy}
                      />
                    </motion.div>

                    {pipeline.isValid &&
                      PIPELINE_STEPS.map((step, i) => (
                        <div key={step.title}>
                          {step.arrow && (
                            <motion.div variants={STEP_VARIANTS}>
                              <ValueFlowArrow
                                label={step.arrow.label}
                                description={step.arrow.description}
                                animationKey={entropyHex}
                              />
                            </motion.div>
                          )}
                          <motion.div variants={STEP_VARIANTS}>
                            <PipelineStep
                              stepNumber={i + 2}
                              title={step.title}
                              algorithm={step.algorithm}
                              algorithmDetail={step.algorithmDetail}
                              value={step.value(pipeline)}
                              hexVariant={step.hexVariant}
                              overlay={step.overlay}
                            />
                          </motion.div>
                        </div>
                      ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "curves" && (
          <motion.div
            key="curves"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <EllipticCurvesTab entropyHex={entropyHex} />
          </motion.div>
        )}

        {activeTab === "code-review" && (
          <motion.div
            key="code-review"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <CodeReviewChallenge challenge={KEYS_CODE_REVIEW} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
