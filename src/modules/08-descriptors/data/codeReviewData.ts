import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

const REFERENCE_INPUT = new TextEncoder().encode(
  "wpkh([fingerprint/84h/0h/0h]xpub.../0/*)#checksum import",
);

export const DESCRIPTORS_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "descriptors",
  title: "Review: descriptor import",
  prompt:
    "A teammate added support for importing a watch-only wallet from a descriptor string. Which version preserves the actual wallet policy correctly?",
  referenceInput: REFERENCE_INPUT,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `Wallet importFromDescriptor(string raw) {
  // We just need the key material —
  // the rest is cosmetic metadata
  string xpub = extractXpub(raw);

  // Rebuild a standard descriptor around the key
  Wallet w = new Wallet();
  w.scriptType = "wpkh";
  w.keyOrigin  = null;
  w.keySource  = xpub;
  w.derivation = "/0/*";

  return w;
}`,
    },
    {
      key: "B",
      label: "Version B",
      code: `Wallet importFromDescriptor(string raw) {
  // Parse the full descriptor: script function,
  // key origin, key material, path, and checksum
  Descriptor desc = parseDescriptor(raw);
  validateChecksum(desc);

  // Build the wallet from the parsed policy
  Wallet w = new Wallet();
  w.scriptType = desc.scriptFunction;
  w.keyOrigin  = desc.origin;
  w.keySource  = desc.key;
  w.derivation = desc.pathSuffix;

  return w;
}`,
    },
    {
      key: "C",
      label: "Version C",
      code: `Wallet importFromDescriptor(string raw) {
  // Strip the checksum — we can recompute later
  string body = raw.split("#")[0];
  Descriptor desc = parseDescriptor(body);

  // Normalize to a single canonical template
  Wallet w = new Wallet();
  w.scriptType = desc.scriptFunction;
  w.keyOrigin  = desc.origin;
  w.keySource  = desc.key;
  w.derivation = "";

  return w;
}`,
    },
  ],
  correctKey: "B",
  reveal: {
    summary:
      "A descriptor is the policy, not a hint. If you drop wrapper, origin, path, or checksum, you are no longer importing the same wallet.",
    details:
      "Version A extracts the xpub and discards everything else — script type, key origin, and derivation path. If the original wallet was sh(wpkh(…)) or tr(…), rebuilding it as wpkh(…) sends funds to a completely different script. The addresses won't match, and coins sent there become unreachable from the original wallet. Version C keeps the script type and origin but strips the checksum before parsing and normalizes away the derivation wildcards. Without the checksum, a transcription error (e.g., one wrong character in the xpub) is silently accepted. Without /0/*, the wallet cannot generate the address sequence — it has no way to derive index 0, 1, 2, … for receive or change.\n\nwpkh([d34db33f/84'/0'/0']xpub6.../0/*)#a1b2c3d4\n  wpkh  → script type (not a default — it is the policy)\n  [d34db33f/84'/0'/0'] → which master key, which path\n  /0/* → derive receive addresses at index 0, 1, 2, …\n  #a1b2c3d4 → catches up to 4 transcription errors",
    dangerNote:
      'Version A is the most dangerous in production. It looks like a reasonable simplification — "we already have the key, so we can recreate the rest" — but the script type is part of the spending condition, not decoration. Importing a tr() wallet as wpkh() means the wallet generates addresses the original owner never used. Funds sent to those addresses are locked under a script nobody holds the witness for.',
  },
};
