import { type ReactNode, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { bytesToHex } from "@noble/hashes/utils.js";
import { generatePrivateKey } from "../../shared/crypto/index.ts";
import { ModuleLayout, ValueFlowArrow, SecurityCallout } from "../../shared/components/index.ts";
import { useKeyPipeline, type PipelineResult } from "./useKeyPipeline.ts";
import { EntropyInput } from "./EntropyInput.tsx";
import { PipelineStep } from "./PipelineStep.tsx";

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
        only constraint is it must be between 1 and the secp256k1 curve order <code>n</code> (a
        256-bit prime). Any 32 random bytes that satisfy this are a valid key.
      </p>
      <p>
        Here we use raw entropy directly as the private key for clarity. Real wallets typically add
        layers of protection: a <strong>mnemonic phrase</strong> (BIP-39) is derived from entropy,
        then stretched through PBKDF2 into a seed, which feeds <strong>HD key derivation</strong>{" "}
        (BIP-32). You&apos;ll explore that full pipeline in the HD Wallet module.
      </p>

      <h3>secp256k1</h3>
      <p>
        Bitcoin uses the <strong>secp256k1</strong> elliptic curve. The public key is derived by{" "}
        <em>scalar multiplication</em>: <code>P = k &times; G</code>, where <code>k</code> is the
        private key and <code>G</code> is the curve&apos;s generator point. This is a one-way
        operation &mdash; you cannot recover <code>k</code> from <code>P</code>.
      </p>

      <h3>Compressed Public Keys</h3>
      <p>
        A public key is a point (x, y) on the curve. Since y can be derived from x (there are only
        two possible y values), we store just x plus a prefix: <code>02</code> if y is even,{" "}
        <code>03</code> if y is odd. This reduces the key from 65 bytes to <strong>33 bytes</strong>
        .
      </p>

      <h3>HASH160</h3>
      <p>
        Bitcoin addresses use <code>HASH160</code> = <code>RIPEMD-160(SHA-256(pubkey))</code>. This
        shortens the 33-byte public key to a <strong>20-byte</strong> hash, providing a compact
        identifier with an extra layer of protection.
      </p>

      <h3>Two Address Formats</h3>
      <p>
        Both address types below encode the <em>same</em> public key hash &mdash; they are two ways
        to receive Bitcoin to the same key. The pipeline shows both so you can compare them.
      </p>

      <h3>P2PKH (Legacy)</h3>
      <p>
        The original Bitcoin address format (starting with <code>1</code>). Uses{" "}
        <strong>Base58Check</strong> encoding: a version byte (<code>0x00</code>) is prepended to
        the HASH160, a 4-byte checksum is appended, and the result is Base58-encoded. Still widely
        supported but largely superseded by SegWit.
      </p>

      <h3>P2WPKH (SegWit)</h3>
      <p>
        The modern replacement (starting with <code>bc1q</code>). Uses <strong>Bech32</strong>{" "}
        encoding with witness version 0. SegWit addresses produce smaller transactions (lower fees),
        have stronger error detection than Base58Check, and are the recommended format today.
      </p>
    </>
  );
}

export default function KeysExplorer() {
  const [entropyHex, setEntropyHex] = useState("");
  const [generationKey, setGenerationKey] = useState(0);
  const pipeline = useKeyPipeline(entropyHex);

  function handleGenerate() {
    const privKey = generatePrivateKey();
    setEntropyHex(bytesToHex(privKey));
    setGenerationKey((k) => k + 1);
  }

  return (
    <ModuleLayout
      moduleKey="keys"
      title="Keys & Address Generator"
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
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2 pt-4"
            >
              <motion.div variants={stepVariants}>
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
                      <motion.div variants={stepVariants}>
                        <ValueFlowArrow
                          label={step.arrow.label}
                          description={step.arrow.description}
                          animationKey={entropyHex}
                        />
                      </motion.div>
                    )}
                    <motion.div variants={stepVariants}>
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
