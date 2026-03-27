import { describe, it, expect } from "vitest";
import { bytesToHex } from "@noble/hashes/utils.js";
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from "./bip39";

describe("generateMnemonic", () => {
  it("generates 12 words by default", () => {
    const words = generateMnemonic().split(" ");
    expect(words).toHaveLength(12);
  });

  it("generates 24 words when requested", () => {
    const words = generateMnemonic(24).split(" ");
    expect(words).toHaveLength(24);
  });

  it("produces a valid mnemonic", () => {
    expect(validateMnemonic(generateMnemonic())).toBe(true);
  });

  it("produces different mnemonics on successive calls", () => {
    expect(generateMnemonic()).not.toBe(generateMnemonic());
  });
});

describe("mnemonicToSeed", () => {
  it("returns 64 bytes", async () => {
    const mnemonic = generateMnemonic();
    const seed = await mnemonicToSeed(mnemonic);
    expect(seed).toHaveLength(64);
  });

  it("matches BIP39 test vector for 'abandon' mnemonic", async () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const seed = await mnemonicToSeed(mnemonic, "");
    expect(bytesToHex(seed)).toBe(
      "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4",
    );
  });

  it("produces different seeds with different passphrases", async () => {
    const mnemonic = generateMnemonic();
    const seed1 = await mnemonicToSeed(mnemonic, "");
    const seed2 = await mnemonicToSeed(mnemonic, "password");
    expect(bytesToHex(seed1)).not.toBe(bytesToHex(seed2));
  });
});

describe("validateMnemonic", () => {
  it("rejects invalid words", () => {
    expect(validateMnemonic("invalid words that are not real")).toBe(false);
  });

  it("rejects wrong checksum", () => {
    // valid words but wrong checksum
    expect(
      validateMnemonic(
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
      ),
    ).toBe(false);
  });

  it("accepts known valid mnemonic", () => {
    expect(
      validateMnemonic(
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      ),
    ).toBe(true);
  });
});
