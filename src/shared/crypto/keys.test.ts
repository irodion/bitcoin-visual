import { describe, it, expect } from "vitest";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { generatePrivateKey, privateKeyToPublicKey, isValidPrivateKey } from "./keys";

describe("generatePrivateKey", () => {
  it("returns 32 bytes", () => {
    expect(generatePrivateKey()).toHaveLength(32);
  });

  it("produces a valid secp256k1 scalar", () => {
    expect(isValidPrivateKey(generatePrivateKey())).toBe(true);
  });

  it("produces different keys on successive calls", () => {
    const a = bytesToHex(generatePrivateKey());
    const b = bytesToHex(generatePrivateKey());
    expect(a).not.toBe(b);
  });
});

describe("privateKeyToPublicKey", () => {
  it("returns 33-byte compressed key starting with 02 or 03", () => {
    const pub = privateKeyToPublicKey(generatePrivateKey(), true);
    expect(pub).toHaveLength(33);
    expect([0x02, 0x03]).toContain(pub[0]);
  });

  it("returns 65-byte uncompressed key starting with 04", () => {
    const pub = privateKeyToPublicKey(generatePrivateKey(), false);
    expect(pub).toHaveLength(65);
    expect(pub[0]).toBe(0x04);
  });

  it("matches known vector: privkey 0x01 → generator point", () => {
    const privKey = new Uint8Array(32);
    privKey[31] = 1;
    const pub = privateKeyToPublicKey(privKey, true);
    expect(bytesToHex(pub)).toBe(
      "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    );
  });

  it("defaults to compressed", () => {
    const key = generatePrivateKey();
    expect(privateKeyToPublicKey(key)).toHaveLength(33);
  });
});

describe("isValidPrivateKey", () => {
  it("rejects all-zero bytes", () => {
    expect(isValidPrivateKey(new Uint8Array(32))).toBe(false);
  });

  it("rejects the curve order n", () => {
    const n = hexToBytes("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    expect(isValidPrivateKey(n)).toBe(false);
  });

  it("accepts valid 32-byte scalars", () => {
    const valid = hexToBytes("0000000000000000000000000000000000000000000000000000000000000001");
    expect(isValidPrivateKey(valid)).toBe(true);
  });

  it("rejects wrong-length input", () => {
    expect(isValidPrivateKey(new Uint8Array(16))).toBe(false);
  });
});
