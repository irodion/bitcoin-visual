import { describe, it, expect } from "vitest";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToNumberBE, numberToBytesBE } from "@noble/curves/utils.js";
import { HDKey, HARDENED_OFFSET } from "@scure/bip32";
import { sha256 } from "./hash";
import {
  isHardenedIndex,
  signWithNonce,
  recoverNonceFromTwoSigs,
  recoverPrivKeyFromNonce,
  xpubChildPrivToParentPriv,
  deriveAllSiblings,
} from "./attacks";

describe("isHardenedIndex", () => {
  it("returns true for 0x80000000", () => {
    expect(isHardenedIndex(0x80000000)).toBe(true);
  });

  it("returns true for 0x80000001", () => {
    expect(isHardenedIndex(0x80000001)).toBe(true);
  });

  it("returns true for 0xFFFFFFFF", () => {
    expect(isHardenedIndex(0xffffffff)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isHardenedIndex(0)).toBe(false);
  });

  it("returns false for 0x7FFFFFFF", () => {
    expect(isHardenedIndex(0x7fffffff)).toBe(false);
  });
});

describe("signWithNonce", () => {
  const privKey = hexToBytes("0000000000000000000000000000000000000000000000000000000000000001");
  const msgHash = sha256(new TextEncoder().encode("test message"));
  const nonce = hexToBytes("0000000000000000000000000000000000000000000000000000000000003039"); // k = 12345

  it("produces a deterministic signature", () => {
    const sig1 = signWithNonce(privKey, msgHash, nonce);
    const sig2 = signWithNonce(privKey, msgHash, nonce);
    expect(sig1.r).toBe(sig2.r);
    expect(sig1.s).toBe(sig2.s);
  });

  it("signature is verifiable by secp256k1.verify", () => {
    const sig = signWithNonce(privKey, msgHash, nonce);
    // Construct 64-byte compact signature
    const sigBytes = new Uint8Array(64);
    sigBytes.set(numberToBytesBE(sig.r, 32), 0);
    sigBytes.set(numberToBytesBE(sig.s, 32), 32);

    const pubKey = secp256k1.getPublicKey(privKey);
    expect(secp256k1.verify(sigBytes, msgHash, pubKey, { prehash: false })).toBe(true);
  });

  it("different messages produce different signatures", () => {
    const msg2 = sha256(new TextEncoder().encode("other message"));
    const sig1 = signWithNonce(privKey, msgHash, nonce);
    const sig2 = signWithNonce(privKey, msg2, nonce);
    // Same nonce means same r, but different s
    expect(sig1.r).toBe(sig2.r);
    expect(sig1.s).not.toBe(sig2.s);
  });

  it("throws for zero nonce", () => {
    expect(() => signWithNonce(privKey, msgHash, new Uint8Array(32))).toThrow();
  });
});

describe("nonce reuse attack round-trip", () => {
  const privKey = hexToBytes("000000000000000000000000000000000000000000000000000000000000002a"); // 42
  const nonce = hexToBytes("0000000000000000000000000000000000000000000000000000000000007b00");
  const msg1 = sha256(new TextEncoder().encode("message one"));
  const msg2 = sha256(new TextEncoder().encode("message two"));

  it("recovers the nonce from two signatures with same k", () => {
    const sig1 = signWithNonce(privKey, msg1, nonce);
    const sig2 = signWithNonce(privKey, msg2, nonce);
    const z1 = bytesToNumberBE(msg1);
    const z2 = bytesToNumberBE(msg2);

    const recoveredK = recoverNonceFromTwoSigs(sig1.s, z1, sig2.s, z2);
    expect(recoveredK).toBe(bytesToNumberBE(nonce));
  });

  it("recovers the private key from known nonce", () => {
    const sig1 = signWithNonce(privKey, msg1, nonce);
    const z1 = bytesToNumberBE(msg1);
    const k = bytesToNumberBE(nonce);

    const recoveredPrivKey = recoverPrivKeyFromNonce(sig1.r, sig1.s, z1, k);
    expect(bytesToHex(recoveredPrivKey)).toBe(bytesToHex(privKey));
  });

  it("full round-trip: two sigs → recover nonce → recover privkey", () => {
    const sig1 = signWithNonce(privKey, msg1, nonce);
    const sig2 = signWithNonce(privKey, msg2, nonce);
    const z1 = bytesToNumberBE(msg1);
    const z2 = bytesToNumberBE(msg2);

    const recoveredK = recoverNonceFromTwoSigs(sig1.s, z1, sig2.s, z2);
    const recoveredPrivKey = recoverPrivKeyFromNonce(sig1.r, sig1.s, z1, recoveredK);
    expect(bytesToHex(recoveredPrivKey)).toBe(bytesToHex(privKey));
  });
});

describe("xpubChildPrivToParentPriv", () => {
  const seed = hexToBytes("000102030405060708090a0b0c0d0e0f");
  const master = HDKey.fromMasterSeed(seed);

  it("recovers parent private key from non-hardened child", () => {
    const child = master.deriveChild(0);
    const xpub = {
      publicKey: master.publicKey!,
      chainCode: master.chainCode!,
    };

    const recoveredParent = xpubChildPrivToParentPriv(xpub, child.privateKey!, 0);
    expect(bytesToHex(recoveredParent)).toBe(bytesToHex(master.privateKey!));
  });

  it("works for different child indices", () => {
    const child = master.deriveChild(5);
    const xpub = {
      publicKey: master.publicKey!,
      chainCode: master.chainCode!,
    };

    const recoveredParent = xpubChildPrivToParentPriv(xpub, child.privateKey!, 5);
    expect(bytesToHex(recoveredParent)).toBe(bytesToHex(master.privateKey!));
  });

  it("throws for hardened child index", () => {
    expect(() =>
      xpubChildPrivToParentPriv(
        { publicKey: master.publicKey!, chainCode: master.chainCode! },
        master.privateKey!,
        HARDENED_OFFSET,
      ),
    ).toThrow("hardened");
  });
});

describe("deriveAllSiblings", () => {
  const seed = hexToBytes("000102030405060708090a0b0c0d0e0f");
  const master = HDKey.fromMasterSeed(seed);

  it("produces the correct number of siblings", () => {
    const siblings = deriveAllSiblings(master.privateKey!, master.chainCode!, 5);
    expect(siblings).toHaveLength(5);
  });

  it("siblings match direct derivation", () => {
    const siblings = deriveAllSiblings(master.privateKey!, master.chainCode!, 3);
    for (let i = 0; i < 3; i++) {
      const direct = master.deriveChild(i);
      expect(bytesToHex(siblings[i])).toBe(bytesToHex(direct.privateKey!));
    }
  });

  it("all siblings are valid private keys", () => {
    const siblings = deriveAllSiblings(master.privateKey!, master.chainCode!, 5);
    for (const key of siblings) {
      expect(key).toHaveLength(32);
      expect(secp256k1.utils.isValidSecretKey(key)).toBe(true);
    }
  });
});
