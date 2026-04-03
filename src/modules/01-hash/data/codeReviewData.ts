import { sha256, sha256d } from "../../../shared/crypto/index.ts";
import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

/**
 * Reference input: the hex-encoded bytes of a minimal serialized transaction.
 * The exact value doesn't matter — it just needs to be consistent across all
 * three digest computations so users can compare outputs in the reveal.
 */
const REFERENCE_TX = new TextEncoder().encode("sample-transaction-bytes");

export const HASH_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "hash",
  title: "Review: txid helper",
  prompt:
    "A teammate wrote a helper to compute the transaction ID used by our wallet. Which version is correct?",
  referenceInput: REFERENCE_TX,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `byte[] txid(byte[] raw_tx) {
  byte[] first  = sha256(raw_tx);
  byte[] second = sha256(first);
  return second;
}`,
      computeDigest: (input) => sha256d(input),
    },
    {
      key: "B",
      label: "Version B",
      code: `byte[] txid(byte[] raw_tx) {
  byte[] digest = sha256(raw_tx);
  return digest;
}`,
      computeDigest: (input) => sha256(input),
    },
    {
      key: "C",
      label: "Version C",
      code: `byte[] txid(byte[] raw_tx) {
  byte[] first  = sha256(raw_tx);
  byte[] second = sha256(raw_tx);
  return second;
}`,
      // C hashes the original message twice — the second call is identical to the first
      computeDigest: (input) => sha256(input),
    },
  ],
  correctKey: "A",
  reveal: {
    summary:
      "Bitcoin uses SHA-256d: the second SHA-256 consumes the first digest, not the original message.",
    details:
      "Version B applies only a single SHA-256 — it produces a valid hash but not the double-hash Bitcoin expects for TXIDs. Version C hashes the original message twice instead of hashing the first digest — the second call is identical to the first, so it does not provide the length-extension protection of true double-hashing.",
    dangerNote:
      "Both B and C produce stable, deterministic 32-byte outputs. A test suite checking only output length or stability would pass all three. Notice that B and C produce the exact same digest — that is the tell.",
  },
};
