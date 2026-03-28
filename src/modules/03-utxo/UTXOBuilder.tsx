import { ModuleLayout, ComingSoonPlaceholder } from "../../shared/components/index.ts";

export default function UTXOBuilder() {
  return (
    <ModuleLayout
      moduleKey="utxo"
      title="UTXO & Transactions"
      moduleNumber={3}
      theoryContent={
        <p>
          Build and inspect raw Bitcoin transactions — understand inputs, outputs, and the UTXO
          model.
        </p>
      }
    >
      <ComingSoonPlaceholder
        title="UTXO & Transaction Builder"
        description="Construct raw Bitcoin transactions input by input, set script types, and inspect the serialized result byte by byte."
      />
    </ModuleLayout>
  );
}
