import { ModuleLayout, ComingSoonPlaceholder } from "../../shared/components/index.ts";

export default function MultisigVault() {
  return (
    <ModuleLayout
      moduleKey="multisig"
      title="Multisig Vault"
      moduleNumber={6}
      theoryContent={<p>Create 2-of-3 multisig scripts, build PSBTs, and co-sign transactions.</p>}
    >
      <ComingSoonPlaceholder
        title="Multisig Vault"
        description="Build m-of-n multisig redeem scripts, generate P2SH and P2WSH addresses, and coordinate partial signatures via PSBTs."
      />
    </ModuleLayout>
  );
}
