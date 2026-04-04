import { hexToBytes } from "@noble/hashes/utils.js";
import { hash160, ripemd160 } from "../../../shared/crypto/index.ts";
import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

/**
 * Reference input: compressed public key for private key 0x01 (well-known test vector).
 * Used to compute and compare digests in the reveal panel.
 */
const REFERENCE_PUBKEY = hexToBytes(
  "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
);

export const KEYS_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "keys",
  title: "Review: P2PKH address derivation",
  prompt:
    "A teammate added legacy address generation from a compressed public key. Which implementation is correct?",
  referenceInput: REFERENCE_PUBKEY,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `string p2pkh(byte[] pubkey) {
  byte[] h1  = sha256(pubkey);
  byte[] h2  = ripemd160(h1);
  byte[] ver = 0x00 + h2;
  byte[] chk = sha256(sha256(ver));
  return base58encode(ver + chk[0..4]);
}`,
      computeDigest: (input) => hash160(input),
    },
    {
      key: "B",
      label: "Version B",
      code: `string p2pkh(byte[] pubkey) {
  byte[] ver = 0x00 + pubkey;
  byte[] chk = sha256(sha256(ver));
  return base58encode(ver + chk[0..4]);
}`,
      computeDigest: (input) => input,
    },
    {
      key: "C",
      label: "Version C",
      code: `string p2pkh(byte[] pubkey) {
  byte[] h1  = ripemd160(pubkey);
  byte[] ver = 0x00 + h1;
  byte[] chk = sha256(ver);
  return base58encode(ver + chk[0..4]);
}`,
      computeDigest: (input) => ripemd160(input),
    },
  ],
  correctKey: "A",
  reveal: {
    summary:
      "An address is not a pretty-printed public key. It is a versioned, checksummed encoding of a public-key hash.",
    details:
      "Version B skips HASH160 entirely — it Base58Check-encodes the raw compressed public key, producing a longer, invalid address. Version C applies RIPEMD-160 without the preceding SHA-256, breaking the HASH160 construction, and uses only a single SHA-256 for the checksum instead of the required double-SHA-256.",
    dangerNote: `All three produce valid-looking Base58 strings. A test that only checks "starts with 1" and "is Base58" would pass B and C. Notice the digest lengths: A and C are 20 bytes but differ; B is 33 bytes — the raw public key leaking through.`,
  },
};
