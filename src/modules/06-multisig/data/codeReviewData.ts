import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

const REFERENCE_INPUT = new TextEncoder().encode("2-of-3 multisig spend validation");

export const MULTISIG_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "multisig",
  title: "Review: 2-of-3 spend validation",
  prompt:
    "A teammate implemented spend validation for a 2-of-3 multisig vault. Which version matches how the spending policy should be enforced?",
  referenceInput: REFERENCE_INPUT,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `bool validateSpend(byte[] tx, byte[][] sigs,
                      byte[][] configuredPubkeys) {
  // Check that we have enough signatures
  if (sigs.length < 2) return false;

  // Verify each signature is valid for the tx
  int validCount = 0;
  for (sig in sigs) {
    for (pk in configuredPubkeys) {
      if (ecdsaVerify(pk, sig, txHash(tx))) {
        validCount++;
        break; // sig is valid, count it
      }
    }
  }

  return validCount >= 2;
}`,
    },
    {
      key: "B",
      label: "Version B",
      code: `bool validateSpend(byte[] tx, byte[][] sigs,
                      byte[][] configuredPubkeys) {
  // The wallet already knows the 2-of-3 policy,
  // so we just need one valid cosigner signature
  // to prove the user has access
  if (sigs.length < 1) return false;

  for (sig in sigs) {
    for (pk in configuredPubkeys) {
      if (ecdsaVerify(pk, sig, txHash(tx)))
        return true; // one valid sig is enough
    }
  }

  return false;
}`,
    },
    {
      key: "C",
      label: "Version C",
      code: `bool validateSpend(byte[] tx, byte[][] sigs,
                      byte[] witnessScript) {
  // Decode the policy from the witness script itself
  (int m, byte[][] scriptPubkeys) =
    decodeMultisigScript(witnessScript);

  // Verify M distinct valid signatures
  Set<byte[]> usedKeys = {};
  int validCount = 0;
  for (sig in sigs) {
    for (pk in scriptPubkeys) {
      if (usedKeys.has(pk)) continue;
      if (ecdsaVerify(pk, sig, txHash(tx))) {
        usedKeys.add(pk);
        validCount++;
        break;
      }
    }
  }

  return validCount >= m;
}`,
    },
  ],
  correctKey: "C",
  reveal: {
    summary:
      "A multisig vault is not a workflow rule in the app. It is a spending condition enforced by the script and the signatures that satisfy it.",
    details:
      'Version A counts valid signatures but never checks that they come from distinct keys. Two copies of the same signature from the same key would count as 2 — passing the threshold with only one actual cosigner. Version B treats the spending policy as an application-layer rule: since the wallet "knows" it\'s 2-of-3, one valid signature is deemed sufficient. But the Bitcoin network enforces the script, not the app. A transaction with only one signature will be rejected by every full node, regardless of what the wallet UI says.\n\nPolicy: 2 of {K1, K2, K3}\nsig(K1) + sig(K2) → valid\nsig(K1) + sig(K1) → invalid (same key twice)\nsig(K1) alone + "app says OK" → invalid (script requires 2)',
    dangerNote:
      'Version A is subtle because "2 valid signatures" sounds correct until you realize it doesn\'t enforce distinctness. In a real system, an attacker who compromises one key could forge two valid signatures and bypass the multisig threshold. Version B reflects a common systems-thinking error: assuming application state can replace on-chain enforcement.',
  },
};
