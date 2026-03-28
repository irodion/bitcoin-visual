import {
  ModuleLayout,
  SecurityCallout,
  ComingSoonPlaceholder,
} from "../../shared/components/index.ts";

export default function AttackLab() {
  return (
    <ModuleLayout
      moduleKey="attacks"
      title="Attack Lab"
      moduleNumber={7}
      theoryContent={
        <p>Explore real-world cryptographic attacks: nonce reuse, xpub leaks, and more.</p>
      }
    >
      <div className="space-y-6">
        {/* Non-dismissible security disclaimer — required by project security policy */}
        <SecurityCallout variant="danger">
          <strong>Educational Only.</strong> The techniques demonstrated here are real cryptographic
          vulnerabilities. They are shown purely for learning purposes so you can understand why
          certain practices are dangerous. Never use these techniques against systems you do not own
          or have explicit permission to test.
        </SecurityCallout>

        <ComingSoonPlaceholder
          title="Attack Lab"
          description="Demonstrate nonce reuse key recovery, xpub child-to-parent private key extraction, and other Bitcoin-specific attack vectors in a safe sandbox."
        />
      </div>
    </ModuleLayout>
  );
}
