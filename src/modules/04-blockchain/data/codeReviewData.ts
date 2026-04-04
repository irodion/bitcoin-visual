import { sha256, sha256d } from "../../../shared/crypto/index.ts";
import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

/**
 * Mock 80-byte block header for digest comparison.
 * Layout: version(4) | prevHash(32) | merkleRoot(32) | timestamp(4) | difficulty(4) | nonce(4)
 */
function buildMockHeader(): Uint8Array {
  const header = new Uint8Array(80);
  header[0] = 0x01;
  header.fill(0xaa, 4, 36);
  header.fill(0xbb, 36, 68);
  header[68] = 0x00;
  header[69] = 0xf1;
  header[70] = 0x53;
  header[71] = 0x65;
  header[72] = 0x02;
  header[76] = 0x2a;
  return header;
}

const REFERENCE_HEADER = buildMockHeader();

const TX_LIST_PLACEHOLDER = new TextEncoder().encode("Alice pays Bob 0.5 BTC|Coinbase 6.25 BTC");

export const BLOCKCHAIN_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "blockchain",
  title: "Review: proof-of-work loop",
  prompt:
    "A teammate wrote the mining loop for the block simulator. Which version actually models proof-of-work correctly?",
  referenceInput: REFERENCE_HEADER,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `bool mine(string[] txList, int target) {
  int nonce = 0;
  while (nonce <= 0xFFFFFFFF) {
    string blob = join(txList) + toString(nonce);
    byte[] hash = sha256(sha256(toBytes(blob)));
    if (toUint256(hash) < target)
      return true;
    nonce = nonce + 1;
  }
  return false;
}`,
      computeDigest: () => sha256d(TX_LIST_PLACEHOLDER),
    },
    {
      key: "B",
      label: "Version B",
      code: `bool mine(byte[] header, int difficulty) {
  int nonce = 0;
  while (nonce <= 0xFFFFFFFF) {
    writeLE32(header, 76, nonce);
    byte[] hash = sha256(header);
    string hex = toHex(hash);
    if (startsWith(hex, "0" * difficulty))
      return true;
    nonce = nonce + 1;
  }
  return false;
}`,
      computeDigest: (input) => sha256(input),
    },
    {
      key: "C",
      label: "Version C",
      code: `bool mine(byte[] header, int target) {
  // header = version(4) | prevHash(32) |
  //          merkleRoot(32) | time(4) |
  //          difficulty(4) | nonce(4)    = 80 bytes
  int nonce = 0;
  while (nonce <= 0xFFFFFFFF) {
    writeLE32(header, 76, nonce);
    byte[] hash = sha256(sha256(header));
    if (toUint256(hash) < target)
      return true;
    nonce = nonce + 1;
  }
  return false;
}`,
      computeDigest: (input) => sha256d(input),
    },
  ],
  correctKey: "C",
  reveal: {
    summary:
      "Proof-of-work hashes the 80-byte block header (not transactions) with SHA-256d (not single SHA-256), and compares the result numerically against a target (not a string prefix).",
    details:
      'Version A hashes concatenated transaction strings — but miners hash the block header, which contains the Merkle root as a 32-byte commitment to all transactions. The header also includes version, prevHash, timestamp, difficulty, and nonce in a fixed 80-byte structure. Version B gets the header right but makes two errors: it uses single SHA-256 instead of double (SHA-256d), and it checks difficulty via string prefix comparison ("starts with N zeros") rather than a numeric comparison against the target. The string method breaks down because the actual Bitcoin target is a 256-bit number — leading zeros are only a rough human-friendly approximation.',
    dangerNote:
      "Version B is particularly deceptive because leading-zero counting works as a simplification in demos. But the real protocol compares the full 256-bit hash numerically against a target that can fall between powers of 16. Notice the digests: B and C produce different hashes of the same header because double-hashing changes the output completely.",
  },
};
