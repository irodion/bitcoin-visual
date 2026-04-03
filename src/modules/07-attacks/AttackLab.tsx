import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { AttackDisclaimer } from "./components/AttackDisclaimer.tsx";
import { NonceReuseAttack } from "./tabs/NonceReuseAttack.tsx";
import { XpubLeakAttack } from "./tabs/XpubLeakAttack.tsx";
import { BrainWalletAttack } from "./tabs/BrainWalletAttack.tsx";
import { RainbowTableAttack } from "./tabs/RainbowTableAttack.tsx";
import { TxMalleabilityAttack } from "./tabs/TxMalleabilityAttack.tsx";

type AttackTabKey =
  | "nonce-reuse"
  | "xpub-leak"
  | "brain-wallet"
  | "rainbow-table"
  | "tx-malleability";

const TABS = [
  { key: "nonce-reuse", label: "Nonce Reuse" },
  { key: "xpub-leak", label: "xpub Leak" },
  { key: "brain-wallet", label: "Weak Entropy" },
  { key: "rainbow-table", label: "Rainbow Table" },
  { key: "tx-malleability", label: "Tx Malleability" },
];

function NonceReuseTheory() {
  return (
    <>
      <h3>ECDSA Signing</h3>
      <p>
        ECDSA produces a signature (r, s) from a private key d, a message hash z, and a random nonce
        k. The nonce must be unique and secret for every signature.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="The Signature"
          description="r = (k × G).x mod n, then s = k⁻¹(z + r·d) mod n. The nonce k is critical — it must be random and never reused."
        />
        <TheoryConceptCard
          dot="danger"
          title="The Vulnerability"
          description="If the same k is used for two different messages, both signatures share the same r. An attacker can algebraically recover k, then compute the private key d."
        />
        <TheoryConceptCard
          dot="success"
          title="The Defense"
          description="RFC 6979 derives k deterministically from the private key and message, guaranteeing a unique k per message without relying on a random number generator."
        />
      </div>

      <TheoryCallout
        label="Real-World Incidents"
        title="PS3 & Android"
        description="In 2010, fail0verflow recovered Sony's PS3 master signing key because every firmware signature used the same nonce. In 2013, weak Android SecureRandom caused Bitcoin wallet nonce collisions, draining funds."
      />
    </>
  );
}

function XpubLeakTheory() {
  return (
    <>
      <h3>BIP-32 Key Derivation</h3>
      <p>
        HD wallets derive child keys from a parent key and chain code. Normal (non-hardened)
        derivation uses only public information, while hardened derivation requires the parent
        private key.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Normal Derivation"
          description="childPriv = IL + parentPriv mod n, where IL = HMAC-SHA512(chainCode, pubKey ‖ index)[:32]. The HMAC input uses the public key, which is in the xpub."
        />
        <TheoryConceptCard
          dot="danger"
          title="The Attack"
          description="If an attacker obtains any non-hardened child private key plus the xpub, they can reverse the formula: parentPriv = childPriv − IL mod n. This compromises the parent and all siblings."
        />
        <TheoryConceptCard
          dot="success"
          title="Hardened Derivation"
          description="HMAC input uses the parent private key instead of the public key. Since the xpub doesn't contain the private key, IL cannot be computed from the xpub alone."
        />
      </div>

      <TheoryCallout
        label="Defense"
        title="Use Hardened Paths"
        description="BIP-44 uses hardened derivation at purpose'/coin'/account' levels (m/44'/0'/0'). Only the final change/index levels use normal derivation, limiting the blast radius of a single leaked child key."
      />
    </>
  );
}

function BrainWalletTheory() {
  return (
    <>
      <h3>Brain Wallets &amp; Entropy</h3>
      <p>
        A brain wallet derives a private key by hashing a passphrase with SHA-256. The security
        depends entirely on the <strong>entropy</strong> of that passphrase.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="The Mechanism"
          description="SHA-256(passphrase) produces a 256-bit private key. It's deterministic: the same phrase always produces the same key."
        />
        <TheoryConceptCard
          dot="danger"
          title="The Vulnerability"
          description="Human-chosen phrases have far fewer than 2²⁵⁶ possibilities. Attackers precompute keys for dictionaries, common phrases, and known passphrases — sweeping funds instantly."
        />
        <TheoryConceptCard
          dot="success"
          title="The Defense"
          description="Use a cryptographic random number generator (CSPRNG) to select private keys. crypto.getRandomValues provides 256 bits of true entropy from the OS."
        />
      </div>

      <TheoryCallout
        label="Real-World"
        title="Brain Wallet Sweepers"
        description="Automated bots monitor the Bitcoin network for transactions from known brain wallet addresses. Funds sent to these addresses are typically swept within seconds."
      />
    </>
  );
}

function RainbowTableTheory() {
  return (
    <>
      <h3>Rainbow Tables &amp; Salting</h3>
      <p>
        A rainbow table is a precomputed lookup table mapping hash outputs back to their inputs. It
        trades storage for computation time.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="The Technique"
          description="Compute hash(password) for millions of common passwords and store the pairs. To crack a hash, just look it up — O(1) instead of brute force."
        />
        <TheoryConceptCard
          dot="danger"
          title="The Vulnerability"
          description="Any unsalted hash of a common password can be instantly reversed. This applies to password storage, brain wallets, and any system using bare hash(input)."
        />
        <TheoryConceptCard
          dot="success"
          title="The Defense"
          description="Salting prepends a random value before hashing: hash(password + salt). Each unique salt invalidates the entire precomputed table. Modern systems use bcrypt/scrypt/Argon2."
        />
      </div>

      <TheoryCallout
        label="Scale"
        title="Real Rainbow Tables"
        description="Real-world rainbow tables can contain billions of entries covering all alphanumeric passwords up to 8–10 characters. Our 50-entry demo shows the principle — the real threat is vastly larger."
      />
    </>
  );
}

function TxMalleabilityTheory() {
  return (
    <>
      <h3>Transaction Malleability</h3>
      <p>
        A third party can alter a signed transaction's signature encoding without invalidating it.
        Since the TxID is computed from the full serialized transaction (including the signature),
        the TxID changes — while the payment itself remains identical.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="The Mechanism"
          description="Every ECDSA signature (r, s) has a valid complement (r, n − s). Flipping s in the scriptSig changes the serialized bytes and thus the TxID, without affecting what the transaction does."
        />
        <TheoryConceptCard
          dot="accent"
          title="Why Both s and n − s Verify"
          description="ECDSA verification computes a point R = u₁·G + u₂·Q and checks R.x against r. Replacing s with −s negates both u₁ and u₂, producing −R. On an elliptic curve, negating a point flips y but keeps x identical: (x, y) → (x, −y). Since verification only checks the x-coordinate, both s and n − s pass."
        />
        <TheoryConceptCard
          dot="info"
          title="Strict vs. Permissive Verification"
          description="BIP-62 introduced the low-S rule: only accept s ≤ n/2. This is a policy choice, not a math constraint — it picks one of the two valid forms by convention. Modern nodes reject high-S signatures at relay time, but pre-2015 nodes and the raw ECDSA math accept both."
        />
        <TheoryConceptCard
          dot="danger"
          title="The Vulnerability"
          description="Any network observer can malleate unconfirmed transactions. Systems that track payments by TxID — like exchange withdrawal systems — lose track of them and may re-send funds."
        />
        <TheoryConceptCard
          dot="success"
          title="The Fix (SegWit)"
          description="BIP-141 Segregated Witness moves signature data to the witness, which is excluded from the TxID hash. This eliminates third-party malleability of the TxID for witness programs. The wtxid (which includes witness data) can still change if the witness is modified."
        />
      </div>

      <TheoryCallout
        label="Real-World"
        title="Mt. Gox (2014)"
        description="Mt. Gox cited transaction malleability when halting withdrawals in February 2014. Attackers malleated withdrawal transactions so the exchange's TxID-based tracking failed, potentially triggering duplicate payouts. While not the sole cause of Mt. Gox's ~744k BTC loss, it exposed a critical flaw: never use TxIDs as immutable payment identifiers."
      />
    </>
  );
}

const THEORY_CONTENT: Record<AttackTabKey, () => React.JSX.Element> = {
  "nonce-reuse": NonceReuseTheory,
  "xpub-leak": XpubLeakTheory,
  "brain-wallet": BrainWalletTheory,
  "rainbow-table": RainbowTableTheory,
  "tx-malleability": TxMalleabilityTheory,
};

export default function AttackLab() {
  const [activeTab, setActiveTab] = useState<AttackTabKey>("nonce-reuse");
  const { completed, complete } = useModuleCompletion("attacks");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!completed && hasInteracted) {
      complete();
    }
  }, [completed, hasInteracted, complete]);

  return (
    <ModuleLayout
      moduleKey="attacks"
      title="Attack Lab"
      moduleNumber={8}
      subtitle="Demonstrate real cryptographic attacks in a safe sandbox."
      theoryContent={(() => {
        const Theory = THEORY_CONTENT[activeTab];
        return <Theory />;
      })()}
      headerNotice={<AttackDisclaimer />}
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as AttackTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "nonce-reuse" && (
          <motion.div
            key="nonce-reuse"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <NonceReuseAttack onAttackRun={() => setHasInteracted(true)} />
          </motion.div>
        )}
        {activeTab === "xpub-leak" && (
          <motion.div
            key="xpub-leak"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <XpubLeakAttack onAttackRun={() => setHasInteracted(true)} />
          </motion.div>
        )}
        {activeTab === "brain-wallet" && (
          <motion.div
            key="brain-wallet"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <BrainWalletAttack onAttackRun={() => setHasInteracted(true)} />
          </motion.div>
        )}
        {activeTab === "rainbow-table" && (
          <motion.div
            key="rainbow-table"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <RainbowTableAttack onAttackRun={() => setHasInteracted(true)} />
          </motion.div>
        )}
        {activeTab === "tx-malleability" && (
          <motion.div
            key="tx-malleability"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <TxMalleabilityAttack onAttackRun={() => setHasInteracted(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
