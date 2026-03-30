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
} from "../../shared/components/index.ts";
import { CONTAINER_VARIANTS, STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useKeyPipeline, type PipelineResult } from "./useKeyPipeline.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { EntropyInput } from "./EntropyInput.tsx";
import { PipelineStep } from "./PipelineStep.tsx";

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

function TheoryContent() {
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

export default function KeysExplorer() {
  const [entropyHex, setEntropyHex] = useState("");
  const [generationKey, setGenerationKey] = useState(0);
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

  return (
    <ModuleLayout
      moduleKey="keys"
      title="Keys & Address Generator"
      moduleNumber={2}
      subtitle="Generate a private key, derive the public key, and encode Bitcoin addresses step by step."
      theoryContent={<TheoryContent />}
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
    </ModuleLayout>
  );
}
