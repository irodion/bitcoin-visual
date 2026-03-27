import { describe, it, expect } from "vitest";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  createMultisigRedeemScript,
  redeemScriptToP2SHAddress,
  redeemScriptToP2WSHAddress,
} from "./multisig";
import { generatePrivateKey, privateKeyToPublicKey } from "./keys";

function makeKeys(count: number): Uint8Array[] {
  return Array.from({ length: count }, () => privateKeyToPublicKey(generatePrivateKey(), true));
}

describe("createMultisigRedeemScript", () => {
  it("creates a valid 2-of-3 script structure", () => {
    const keys = makeKeys(3);
    const script = createMultisigRedeemScript(keys, 2);

    // OP_2 = 0x52, OP_3 = 0x53, OP_CHECKMULTISIG = 0xae
    expect(script[0]).toBe(0x52);
    expect(script[script.length - 2]).toBe(0x53);
    expect(script[script.length - 1]).toBe(0xae);
  });

  it("sorts pubkeys lexicographically (BIP67)", () => {
    const keys = makeKeys(3);
    const script = createMultisigRedeemScript(keys, 2);

    // Extract pubkeys from script
    const extracted: string[] = [];
    let offset = 1; // skip OP_M
    while (script[offset] !== 0x53) {
      const len = script[offset];
      offset += 1;
      extracted.push(bytesToHex(script.slice(offset, offset + len)));
      offset += len;
    }

    const sorted = [...extracted].sort();
    expect(extracted).toEqual(sorted);
  });

  it("has correct total length for 2-of-3 with 33-byte compressed keys", () => {
    const keys = makeKeys(3);
    const script = createMultisigRedeemScript(keys, 2);
    // 1 (OP_2) + 3*(1+33) + 1 (OP_3) + 1 (OP_CHECKMULTISIG) = 105
    expect(script.length).toBe(105);
  });

  it("throws when m < 1", () => {
    expect(() => createMultisigRedeemScript(makeKeys(3), 0)).toThrow();
  });

  it("throws when m > n", () => {
    expect(() => createMultisigRedeemScript(makeKeys(2), 3)).toThrow();
  });

  it("throws when n > 16", () => {
    expect(() => createMultisigRedeemScript(makeKeys(17), 1)).toThrow();
  });
});

describe("redeemScriptToP2SHAddress", () => {
  it("mainnet address starts with '3'", () => {
    const script = createMultisigRedeemScript(makeKeys(3), 2);
    expect(redeemScriptToP2SHAddress(script, "mainnet")).toMatch(/^3/);
  });

  it("testnet address starts with '2'", () => {
    const script = createMultisigRedeemScript(makeKeys(3), 2);
    expect(redeemScriptToP2SHAddress(script, "testnet")).toMatch(/^2/);
  });
});

describe("redeemScriptToP2WSHAddress", () => {
  it("mainnet address starts with 'bc1q'", () => {
    const script = createMultisigRedeemScript(makeKeys(3), 2);
    expect(redeemScriptToP2WSHAddress(script, "mainnet")).toMatch(/^bc1q/);
  });

  it("testnet address starts with 'tb1q'", () => {
    const script = createMultisigRedeemScript(makeKeys(3), 2);
    expect(redeemScriptToP2WSHAddress(script, "testnet")).toMatch(/^tb1q/);
  });

  it("P2WSH address is longer than P2SH (32-byte hash vs 20-byte)", () => {
    const script = createMultisigRedeemScript(makeKeys(3), 2);
    const p2sh = redeemScriptToP2SHAddress(script);
    const p2wsh = redeemScriptToP2WSHAddress(script);
    expect(p2wsh.length).toBeGreaterThan(p2sh.length);
  });
});
