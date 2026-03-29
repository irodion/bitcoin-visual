import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ModuleLayout,
  ValueFlowArrow,
  TheoryConceptCard,
  TheoryCallout,
} from "../../shared/components/index.ts";
import { CONTAINER_VARIANTS, STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useHDState } from "./useHDState.ts";
import { MnemonicPanel } from "./MnemonicPanel.tsx";
import { SeedDerivationPanel } from "./SeedDerivationPanel.tsx";
import { PathBuilder } from "./PathBuilder.tsx";
import { KeyTreeView } from "./KeyTreeView.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

function TheoryContent() {
  return (
    <>
      <h3>HD Wallets</h3>
      <p>
        Hierarchical Deterministic (HD) wallets derive an entire tree of keys from a single{" "}
        <strong>mnemonic phrase</strong>. One backup protects all your addresses — past and future.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="BIP39 — Mnemonic"
          description="12 or 24 words encoding 128/256 bits of entropy plus a checksum. Human-readable backup."
        />
        <TheoryConceptCard
          dot="teal"
          title="PBKDF2 — Seed Derivation"
          description="2048 rounds of HMAC-SHA-512 stretch the mnemonic into a 512-bit seed. An optional passphrase adds a second factor."
        />
        <TheoryConceptCard
          dot="info"
          title="BIP32 — Hierarchical Derivation"
          description="HMAC-SHA-512 with key 'Bitcoin seed' produces the master key + chain code. Child keys are derived recursively."
        />
        <TheoryConceptCard
          dot="danger"
          title="Hardened vs Normal"
          description="Hardened derivation (') prevents child xpub from leaking the parent private key. Normal derivation enables watch-only wallets."
        />
      </div>

      <TheoryCallout
        label="BIP84 PATH"
        title="m / purpose' / coin' / account' / change / index"
        description="Standard 5-level path. Hardened levels isolate accounts; normal levels allow xpub-based address generation."
      />

      <h3>Security</h3>
      <p>
        If an attacker gets your <strong>account xpub</strong> and any single non-hardened child
        private key, they can derive all sibling private keys. This is why account-level derivation
        is always hardened.
      </p>
    </>
  );
}

export default function HDWalletExplorer() {
  const state = useHDState();
  const { completed, complete } = useModuleCompletion("hd-wallet");

  useEffect(() => {
    if (!completed && state.isValidMnemonic && state.seed) complete();
  }, [state.isValidMnemonic, state.seed, completed, complete]);

  return (
    <ModuleLayout
      moduleKey="hd-wallet"
      title="HD Wallet Tree"
      moduleNumber={5}
      subtitle="Generate a mnemonic, derive a master seed, and explore BIP-84 key derivation."
      theoryContent={<TheoryContent />}
    >
      <div className="mx-auto max-w-3xl space-y-2">
        <MnemonicPanel
          mnemonicText={state.mnemonicText}
          setMnemonicText={state.setMnemonicText}
          passphrase={state.passphrase}
          setPassphrase={state.setPassphrase}
          wordCount={state.wordCount}
          setWordCount={state.setWordCount}
          generateNewMnemonic={state.generateNewMnemonic}
          isValidMnemonic={state.isValidMnemonic}
          words={state.words}
        />

        {state.isValidMnemonic && (
          <AnimatePresence mode="wait">
            <motion.div
              key={state.generationKey}
              variants={CONTAINER_VARIANTS}
              initial="hidden"
              animate="visible"
              className="space-y-2 pt-4"
            >
              <motion.div variants={STEP_VARIANTS}>
                <ValueFlowArrow
                  label="PBKDF2"
                  description="2048 rounds of HMAC-SHA-512 with salt 'mnemonic' + passphrase"
                  animationKey={state.generationKey}
                />
              </motion.div>

              <motion.div variants={STEP_VARIANTS}>
                <SeedDerivationPanel
                  seedHex={state.seedHex}
                  isDerivingSeed={state.isDerivingSeed}
                  masterPrivateKey={state.masterPrivateKey}
                  masterChainCode={state.masterChainCode}
                  generationKey={state.generationKey}
                  privateKeysRevealed={state.privateKeysRevealed}
                  onRequestReveal={() => state.setPrivateKeysRevealed(true)}
                />
              </motion.div>

              {state.seed && (
                <>
                  <motion.div variants={STEP_VARIANTS}>
                    <ValueFlowArrow
                      label="BIP32 Derivation"
                      description="Walk the derivation path: each segment derives a child key via HMAC-SHA-512"
                      animationKey={state.generationKey}
                    />
                  </motion.div>

                  <motion.div variants={STEP_VARIANTS}>
                    <PathBuilder
                      pathSegments={state.pathSegments}
                      updatePathSegment={state.updatePathSegment}
                      selectedSegmentIndex={state.selectedSegmentIndex}
                      setSelectedSegmentIndex={state.setSelectedSegmentIndex}
                      derivedTree={state.derivedTree}
                      fullPathString={state.fullPathString}
                    />
                  </motion.div>

                  <motion.div variants={STEP_VARIANTS}>
                    <KeyTreeView
                      derivedTree={state.derivedTree}
                      privateKeysRevealed={state.privateKeysRevealed}
                      setPrivateKeysRevealed={state.setPrivateKeysRevealed}
                    />
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </ModuleLayout>
  );
}
