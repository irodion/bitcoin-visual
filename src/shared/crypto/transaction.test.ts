import { describe, it, expect } from "vitest";
import { hexToBytes } from "@noble/hashes/utils.js";
import { serializeTransaction } from "./transaction";
import type { Transaction } from "./transaction";

describe("serializeTransaction", () => {
  it("serializes a simple coinbase-like transaction", () => {
    const tx: Transaction = {
      version: 1,
      inputs: [
        {
          txid: new Uint8Array(32), // null txid for coinbase
          vout: 0xffffffff,
          scriptSig: hexToBytes("04ffff001d0104"),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        {
          value: 5000000000n, // 50 BTC
          scriptPubKey: hexToBytes(
            "4104678afdb0fe5548271967f1a67130b7105cd6a62e3e52e3e29139e5516cc76914e43f5c0b0c7bceb3bae80000000000000000000000000000000000000000000000ac",
          ),
          // shortened pubkey for test, but structure is correct
        },
      ],
      locktime: 0,
    };

    const serialized = serializeTransaction(tx);

    // Check version bytes (little-endian)
    expect(serialized[0]).toBe(0x01);
    expect(serialized[1]).toBe(0x00);
    expect(serialized[2]).toBe(0x00);
    expect(serialized[3]).toBe(0x00);

    // Input count = 1
    expect(serialized[4]).toBe(0x01);

    // Last 4 bytes = locktime = 0
    const len = serialized.length;
    expect(serialized[len - 4]).toBe(0x00);
    expect(serialized[len - 3]).toBe(0x00);
    expect(serialized[len - 2]).toBe(0x00);
    expect(serialized[len - 1]).toBe(0x00);
  });

  it("handles empty scriptSig", () => {
    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: new Uint8Array(32),
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        {
          value: 100000n,
          scriptPubKey: new Uint8Array([0x00, 0x14, ...Array.from({ length: 20 }, () => 0)]),
        },
      ],
      locktime: 0,
    };

    const serialized = serializeTransaction(tx);
    // version(4) + vincount(1) + txid(32) + vout(4) + scriptlen(1) + seq(4)
    // + voutcount(1) + value(8) + scriptlen(1) + script(22) + locktime(4)
    expect(serialized.length).toBe(4 + 1 + 32 + 4 + 1 + 0 + 4 + 1 + 8 + 1 + 22 + 4);
  });

  it("serializes multiple inputs and outputs", () => {
    const tx: Transaction = {
      version: 1,
      inputs: [
        {
          txid: new Uint8Array(32).fill(0xaa),
          vout: 0,
          scriptSig: new Uint8Array([0x00]),
          sequence: 0xffffffff,
        },
        {
          txid: new Uint8Array(32).fill(0xbb),
          vout: 1,
          scriptSig: new Uint8Array([0x00]),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        { value: 50000n, scriptPubKey: new Uint8Array([0x76, 0xa9]) },
        { value: 30000n, scriptPubKey: new Uint8Array([0x76, 0xa9]) },
      ],
      locktime: 500000,
    };

    const serialized = serializeTransaction(tx);
    // Input count
    expect(serialized[4]).toBe(0x02);

    // Locktime 500000 = 0x0007A120 in LE
    const len = serialized.length;
    expect(serialized[len - 4]).toBe(0x20);
    expect(serialized[len - 3]).toBe(0xa1);
    expect(serialized[len - 2]).toBe(0x07);
    expect(serialized[len - 1]).toBe(0x00);
  });
});
