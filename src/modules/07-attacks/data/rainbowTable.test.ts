import { describe, it, expect } from "vite-plus/test";
import { sha256 } from "../../../shared/crypto/hash.ts";
import { bytesToHex } from "@noble/hashes/utils.js";
import { RAINBOW_TABLE } from "./rainbowTable.ts";

const encoder = new TextEncoder();

describe("rainbowTable data", () => {
  it("contains exactly 50 entries", () => {
    expect(RAINBOW_TABLE.length).toBe(50);
  });

  it("all SHA-256 values are correct", () => {
    for (const entry of RAINBOW_TABLE) {
      const computed = bytesToHex(sha256(encoder.encode(entry.password)));
      expect(computed).toBe(entry.sha256);
    }
  });

  it("all sha256 values are 64-char lowercase hex", () => {
    for (const entry of RAINBOW_TABLE) {
      expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
