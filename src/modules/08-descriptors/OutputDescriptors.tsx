import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useDescriptorState, type DescriptorTabKey } from "./useDescriptorState.ts";
import { AnatomyPanel } from "./AnatomyPanel.tsx";
import { DerivePanel } from "./DerivePanel.tsx";
import { BuilderPanel } from "./BuilderPanel.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

const TABS = [
  { key: "anatomy", label: "Anatomy" },
  { key: "derive", label: "Derive" },
  { key: "builder", label: "Builder" },
];

function TheoryContent() {
  return (
    <>
      <h3>Output Descriptors</h3>
      <p>
        A wallet descriptor is a single compact string that fully encodes a wallet's{" "}
        <strong>script type</strong>, <strong>key material</strong>, and{" "}
        <strong>derivation strategy</strong>. One string → infinite addresses, zero ambiguity. The
        string <em>is</em> the wallet.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="What is a Descriptor?"
          description="A portable template like wpkh([fingerprint/84'/0'/0']xpub…/0/*) that tells any compliant wallet exactly which script type to use, which key tree to derive from, and how to generate addresses."
        />
        <TheoryConceptCard
          dot="teal"
          title="Script Functions"
          description="pkh(), wpkh(), sh(), wsh(), tr() — each wraps keys in a different Bitcoin script. Nesting like sh(wpkh(…)) mirrors actual script evaluation: read inside-out."
        />
        <TheoryConceptCard
          dot="warning"
          title="Script Evolution"
          description="P2SH (2012): sealed envelope — open when spending. P2WSH (2017): same idea, bigger capacity, witness discount, fixes malleability. P2TR (2021): no envelope at all — looks like a normal payment. If there's a dispute, reveal one page from a sealed book without showing the rest. Each generation hides more."
        />
        <TheoryConceptCard
          dot="success"
          title="Taproot — tr()"
          description="The most private format. A key-path Taproot spend looks identical on-chain whether it's single-sig or aggregated multisig (MuSig2) — one 32-byte key, one 64-byte Schnorr signature. Alternative spending conditions (timelocks, fallback keys) hide in an unrevealed Merkle tree. Every bc1p… address looks the same regardless of internal complexity."
        />
        <TheoryConceptCard
          dot="info"
          title="Key Origin"
          description="[fingerprint/path] identifies which master key an xpub descends from. The fingerprint is hash160(master pubkey)[0:4]. Hardware wallets use this to find their signing key."
        />
        <TheoryConceptCard
          dot="warning"
          title="Wildcard Expansion"
          description="/* means 'derive a child at every index.' One descriptor template generates addresses 0, 1, 2, … — the /0 prefix selects the receive chain, /1 selects the change chain."
        />
        <TheoryConceptCard
          dot="success"
          title="Checksum"
          description="An 8-character BCH code (bech32 alphabet) appended after #. Catches up to 4 character errors in descriptors under 507 chars. Never copy a descriptor without its checksum."
        />
        <TheoryConceptCard
          dot="danger"
          title="Why Not Just xpub?"
          description="A bare xpub doesn't specify the script type. The old workaround — ypub for P2SH-SegWit, zpub for native SegWit — was a layer violation. Descriptors make the script type explicit and the key format orthogonal."
        />
      </div>

      <TheoryCallout
        label="DESCRIPTOR FORMAT"
        title="wpkh([fingerprint/84'/0'/0']xpub…/0/*)#checksum"
        description="Function(origin + key + derivation)#checksum. The function defines the script type. The origin traces the key's ancestry. The wildcard generates an infinite address chain."
      />
    </>
  );
}

export default function OutputDescriptors() {
  const state = useDescriptorState();
  const { completed, complete } = useModuleCompletion("descriptors");

  useEffect(() => {
    if (!completed && (state.parsed !== null || state.builtDescriptor !== null)) {
      complete();
    }
  }, [state.parsed, state.builtDescriptor, completed, complete]);

  return (
    <ModuleLayout
      moduleKey="descriptors"
      title="Output Descriptors"
      moduleNumber={7}
      subtitle="Parse, expand, and build wallet descriptors — the universal language for Bitcoin wallets."
      theoryContent={<TheoryContent />}
      tabConfig={{
        tabs: TABS,
        activeTab: state.activeTab,
        onTabChange: (key) => state.setActiveTab(key as DescriptorTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {state.activeTab === "anatomy" && (
          <motion.div
            key="anatomy"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <AnatomyPanel
              descriptorInput={state.descriptorInput}
              setDescriptorInput={state.handleDescriptorInput}
              parsed={state.parsed}
              parseError={state.parseError}
              selectedSegmentIndex={state.selectedSegmentIndex}
              setSelectedSegmentIndex={state.setSelectedSegmentIndex}
              selectPreset={state.selectPreset}
            />
          </motion.div>
        )}
        {state.activeTab === "derive" && (
          <motion.div
            key="derive"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <DerivePanel
              parsed={state.parsed}
              expandedAddresses={state.expandedAddresses}
              expandError={state.expandError}
              addressCount={state.addressCount}
              setAddressCount={state.setAddressCount}
              comparisonAddresses={state.comparisonAddresses}
            />
          </motion.div>
        )}
        {state.activeTab === "builder" && (
          <motion.div
            key="builder"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <BuilderPanel
              builderScriptType={state.builderScriptType}
              setBuilderScriptType={state.setBuilderScriptType}
              isMulti={state.isMulti}
              builderKeys={state.builderKeys}
              addBuilderKey={state.addBuilderKey}
              removeBuilderKey={state.removeBuilderKey}
              updateBuilderKey={state.updateBuilderKey}
              builderThreshold={state.builderThreshold}
              setBuilderThreshold={state.setBuilderThreshold}
              builderChain={state.builderChain}
              setBuilderChain={state.setBuilderChain}
              generateKeyMaterial={state.generateKeyMaterial}
              isGeneratingKey={state.isGeneratingKey}
              builtDescriptor={state.builtDescriptor}
              builtDescriptorError={state.builtDescriptorError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
