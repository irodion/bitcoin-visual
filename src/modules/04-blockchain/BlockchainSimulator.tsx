import { ModuleLayout, ComingSoonPlaceholder } from "../../shared/components/index.ts";

export default function BlockchainSimulator() {
  return (
    <ModuleLayout
      moduleKey="blockchain"
      title="Blockchain & Mining"
      moduleNumber={4}
      theoryContent={
        <p>
          Mine blocks, adjust difficulty, and watch the chain grow — all simulated in your browser.
        </p>
      }
    >
      <ComingSoonPlaceholder
        title="Blockchain & Mining Simulator"
        description="Mine blocks by finding valid nonces, adjust the difficulty target, and see how block headers chain together through hash pointers."
      />
    </ModuleLayout>
  );
}
