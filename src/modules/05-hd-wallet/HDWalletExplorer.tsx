import { ModuleLayout, ComingSoonPlaceholder } from "../../shared/components/index.ts";

export default function HDWalletExplorer() {
  return (
    <ModuleLayout
      moduleKey="hd-wallet"
      title="HD Wallet Tree"
      moduleNumber={5}
      theoryContent={
        <p>
          Visualize BIP-32/39 hierarchical deterministic key derivation from mnemonic to child keys.
        </p>
      }
    >
      <ComingSoonPlaceholder
        title="HD Wallet Tree Explorer"
        description="Generate a mnemonic phrase, derive a master seed, and explore the full BIP-44 derivation tree with interactive path navigation."
      />
    </ModuleLayout>
  );
}
