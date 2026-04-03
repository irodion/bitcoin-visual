import { useState, useEffect } from "react";
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
import { BackupRecoveryTab } from "./tabs/BackupRecoveryTab.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

type TabKey = "explorer" | "backup";

const TABS = [
  { key: "explorer", label: "Explorer" },
  { key: "backup", label: "Backup & Recovery" },
];

function ExplorerTheory() {
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

function BackupRecoveryTheory() {
  return (
    <>
      <h3>Backup & Recovery</h3>
      <p>
        Your seed phrase <strong>is</strong> your wallet. The app on your phone is just a viewer
        that derives keys from it and signs transactions.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Deterministic Recovery"
          description="The same seed phrase always regenerates the same tree of keys and addresses — on any device, in any compatible wallet app."
        />
        <TheoryConceptCard
          dot="teal"
          title="Seed = Wallet"
          description="Coins don't live in your app. They live on the blockchain, locked to public keys. Your seed phrase is the master key that unlocks them."
        />
        <TheoryConceptCard
          dot="danger"
          title="No Password Reset"
          description="Bitcoin has no central authority. If you lose your seed phrase and your device, no one — not the network, not miners, not developers — can recover your funds."
        />
      </div>

      <TheoryCallout
        label="REAL-WORLD"
        title="The Cost of Lost Keys"
        description="~3.8M BTC are estimated lost forever. James Howells discarded a hard drive with 7,500 BTC — it sits in a Welsh landfill. Stefan Thomas has 2 password attempts left on an IronKey holding 7,002 BTC. No recovery exists."
      />
    </>
  );
}

const THEORY_CONTENT: Record<TabKey, () => React.JSX.Element> = {
  explorer: ExplorerTheory,
  backup: BackupRecoveryTheory,
};

export default function HDWalletExplorer() {
  const [activeTab, setActiveTab] = useState<TabKey>("explorer");
  const state = useHDState();
  const { completed, complete } = useModuleCompletion("hd-wallet");

  useEffect(() => {
    if (!completed && state.isValidMnemonic && state.seed) complete();
  }, [state.isValidMnemonic, state.seed, completed, complete]);

  const Theory = THEORY_CONTENT[activeTab];

  return (
    <ModuleLayout
      moduleKey="hd-wallet"
      title="HD Wallet Tree"
      moduleNumber={5}
      subtitle="Generate a mnemonic, derive a master seed, and explore BIP-84 key derivation."
      theoryContent={<Theory />}
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as TabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "explorer" && (
          <motion.div
            key="explorer"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
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
          </motion.div>
        )}
        {activeTab === "backup" && (
          <motion.div
            key="backup"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <BackupRecoveryTab hdState={state} />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
