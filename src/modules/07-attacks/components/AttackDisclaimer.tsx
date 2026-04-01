import { SecurityCallout } from "../../../shared/components/index.ts";

export function AttackDisclaimer() {
  return (
    <SecurityCallout variant="danger">
      <strong>Educational Only.</strong> The techniques demonstrated here are real cryptographic
      vulnerabilities. They are shown purely for learning purposes so you can understand why certain
      practices are dangerous. Never use these techniques against systems you do not own or have
      explicit permission to test.
    </SecurityCallout>
  );
}
