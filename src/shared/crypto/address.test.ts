import { describe, it, expect } from "vitest";
import { hexToBytes } from "@noble/hashes/utils.js";
import {
  base58CheckEncode,
  base58CheckDecode,
  publicKeyToP2PKHAddress,
  publicKeyToP2WPKHAddress,
} from "./address";

const GENERATOR_PUBKEY = hexToBytes(
  "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
);

describe("base58CheckEncode / decode", () => {
  it("round-trips", () => {
    const payload = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    const encoded = base58CheckEncode(payload);
    expect(base58CheckDecode(encoded)).toEqual(payload);
  });
});

describe("publicKeyToP2PKHAddress", () => {
  it("produces correct address for generator point compressed pubkey", () => {
    expect(publicKeyToP2PKHAddress(GENERATOR_PUBKEY)).toBe("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
  });

  it("mainnet address starts with '1'", () => {
    expect(publicKeyToP2PKHAddress(GENERATOR_PUBKEY, "mainnet")).toMatch(/^1/);
  });

  it("testnet address starts with 'm' or 'n'", () => {
    expect(publicKeyToP2PKHAddress(GENERATOR_PUBKEY, "testnet")).toMatch(/^[mn]/);
  });
});

describe("publicKeyToP2WPKHAddress", () => {
  it("produces correct address for generator point compressed pubkey", () => {
    expect(publicKeyToP2WPKHAddress(GENERATOR_PUBKEY)).toBe(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    );
  });

  it("mainnet address starts with 'bc1q'", () => {
    expect(publicKeyToP2WPKHAddress(GENERATOR_PUBKEY, "mainnet")).toMatch(/^bc1q/);
  });

  it("testnet address starts with 'tb1q'", () => {
    expect(publicKeyToP2WPKHAddress(GENERATOR_PUBKEY, "testnet")).toMatch(/^tb1q/);
  });

  it("rejects uncompressed (65-byte) public keys", () => {
    const uncompressed = new Uint8Array(65);
    uncompressed[0] = 0x04;
    expect(() => publicKeyToP2WPKHAddress(uncompressed)).toThrow("compressed");
  });
});
