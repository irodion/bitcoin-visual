import { describe, it, expect } from "vite-plus/test";
import { signECDSA, signWithSighash, verifyECDSA, verifyECDSAPermissive } from "./signing";
import { malleateSignatureS } from "./malleability";
import { generatePrivateKey, privateKeyToPublicKey } from "./keys";
import { sha256 } from "./hash";

describe("signECDSA", () => {
  it("produces a DER-encoded signature (starts with 0x30)", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const sig = signECDSA(privKey, msgHash);
    expect(sig[0]).toBe(0x30); // DER sequence tag
    expect(sig.length).toBeGreaterThanOrEqual(68);
    expect(sig.length).toBeLessThanOrEqual(72);
  });

  it("different messages produce different signatures", () => {
    const privKey = generatePrivateKey();
    const hash1 = sha256(new Uint8Array([1]));
    const hash2 = sha256(new Uint8Array([2]));
    const sig1 = signECDSA(privKey, hash1);
    const sig2 = signECDSA(privKey, hash2);
    expect(sig1).not.toEqual(sig2);
  });
});

describe("signWithSighash", () => {
  it("appends SIGHASH_ALL (0x01) byte at the end", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const sig = signWithSighash(privKey, msgHash);
    expect(sig[sig.length - 1]).toBe(0x01);
    // Without sighash byte, DER sig starts at same offset
    expect(sig[0]).toBe(0x30);
  });

  it("supports custom sighash type", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1]));
    const sig = signWithSighash(privKey, msgHash, 0x83);
    expect(sig[sig.length - 1]).toBe(0x83);
  });
});

describe("verifyECDSA", () => {
  it("accepts a valid signature", () => {
    const privKey = generatePrivateKey();
    const pubKey = privateKeyToPublicKey(privKey);
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const sig = signECDSA(privKey, msgHash);
    expect(verifyECDSA(pubKey, msgHash, sig)).toBe(true);
  });

  it("rejects a signature from a different key", () => {
    const privKey1 = generatePrivateKey();
    const privKey2 = generatePrivateKey();
    const pubKey2 = privateKeyToPublicKey(privKey2);
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const sig = signECDSA(privKey1, msgHash);
    expect(verifyECDSA(pubKey2, msgHash, sig)).toBe(false);
  });

  it("rejects a signature for a different message", () => {
    const privKey = generatePrivateKey();
    const pubKey = privateKeyToPublicKey(privKey);
    const hash1 = sha256(new Uint8Array([1]));
    const hash2 = sha256(new Uint8Array([2]));
    const sig = signECDSA(privKey, hash1);
    expect(verifyECDSA(pubKey, hash2, sig)).toBe(false);
  });
});

describe("verifyECDSAPermissive", () => {
  it("accepts a high-S signature that strict verify rejects", () => {
    const privKey = generatePrivateKey();
    const pubKey = privateKeyToPublicKey(privKey);
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const der = signECDSA(privKey, msgHash);

    const { malleatedDER } = malleateSignatureS(der);

    // Strict rejects high-S
    expect(verifyECDSA(pubKey, msgHash, malleatedDER)).toBe(false);
    // Permissive accepts
    expect(verifyECDSAPermissive(pubKey, msgHash, malleatedDER)).toBe(true);
  });
});
