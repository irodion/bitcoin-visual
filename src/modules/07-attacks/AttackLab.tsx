import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";
import { AttackDisclaimer } from "./components/AttackDisclaimer.tsx";
import { NonceReuseAttack } from "./tabs/NonceReuseAttack.tsx";
import { XpubLeakAttack } from "./tabs/XpubLeakAttack.tsx";

type AttackTabKey = "nonce-reuse" | "xpub-leak";

const TABS = [
  { key: "nonce-reuse", label: "Nonce Reuse" },
  { key: "xpub-leak", label: "xpub Leak" },
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
      moduleNumber={7}
      subtitle="Demonstrate real cryptographic attacks in a safe sandbox."
      theoryContent={activeTab === "nonce-reuse" ? <NonceReuseTheory /> : <XpubLeakTheory />}
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
      </AnimatePresence>
    </ModuleLayout>
  );
}
