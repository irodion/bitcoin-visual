import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

const REFERENCE_INPUT = new TextEncoder().encode("m/84'/0'/0'/0/0 child key derivation");

export const HD_WALLET_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "hd-wallet",
  title: "Review: child key derivation",
  prompt:
    "A teammate implemented child private key derivation for the wallet tree. Which version preserves the intended HD wallet security model?",
  referenceInput: REFERENCE_INPUT,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `HDKey deriveChild(HDKey parent, int index,
                    bool hardened) {
  // Treat hardened the same as normal —
  // just add the offset to the index
  int childIndex = hardened
    ? index + 0x80000000
    : index;

  // Always use the public key as HMAC data
  byte[] data = parent.publicKey + toLE32(childIndex);
  byte[] I = hmacSHA512(parent.chainCode, data);

  byte[] childKey = addMod(parent.privateKey, I[0..32]);
  byte[] childChainCode = parent.chainCode; // reuse
  return new HDKey(childKey, childChainCode);
}`,
    },
    {
      key: "B",
      label: "Version B",
      code: `HDKey deriveChild(HDKey parent, int index,
                    bool hardened) {
  byte[] data;
  if (hardened) {
    // Private derivation: use 0x00 + private key
    // so this child CANNOT be derived from xpub
    data = 0x00 + parent.privateKey + toBE32(index);
  } else {
    // Public derivation: use compressed public key
    // so watch-only wallets can derive this child
    data = parent.publicKey + toBE32(index);
  }

  byte[] I = hmacSHA512(parent.chainCode, data);
  byte[] childKey = addMod(parent.privateKey, I[0..32]);
  byte[] childChainCode = I[32..64];
  return new HDKey(childKey, childChainCode);
}`,
    },
    {
      key: "C",
      label: "Version C",
      code: `HDKey deriveChild(HDKey parent, int index,
                    bool hardened) {
  // Use the xpub path for all derivations —
  // the tree should be reproducible from xpub alone
  byte[] data = parent.publicKey + toBE32(index);
  byte[] I = hmacSHA512(parent.chainCode, data);

  byte[] childKey = addMod(parent.privateKey, I[0..32]);
  byte[] childChainCode = I[32..64];
  return new HDKey(childKey, childChainCode);
}`,
    },
  ],
  correctKey: "B",
  reveal: {
    summary:
      "The important distinction is not just the path notation. Hardened derivation changes who can derive descendants. If an xpub can derive a branch that was meant to be hardened, the wallet boundary is broken.",
    details:
      "Version A reuses the parent chain code instead of deriving a fresh one from HMAC-SHA-512, and always feeds the public key as HMAC data regardless of the hardened flag. This makes hardened and non-hardened derivation identical in practice — the apostrophe in the path becomes meaningless. Version C derives every child from the parent public key, even for paths marked as hardened. An attacker with the xpub could derive all children, including account-level keys that are supposed to be isolated.\n\nxprv → can derive everything below\nxpub → can derive only non-hardened descendants\n′ (apostrophe) → marks where public derivation stops",
    dangerNote:
      'Version C is a realistic mistake for engineers who think of an xpub as "the whole subtree forever." It works correctly for non-hardened paths but silently removes the security boundary that protects account isolation. Version A compounds the error by also reusing the parent chain code, breaking the derivation chain entirely.',
  },
};
