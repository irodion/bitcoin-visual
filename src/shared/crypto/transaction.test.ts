import { describe, it, expect } from "vitest";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import {
  serializeTransaction,
  serializeWitnessTransaction,
  buildP2PKHScript,
  buildP2WPKHScript,
  buildP2SHScript,
  buildP2WSHScript,
  buildP2PKHScriptSig,
  computeTxID,
  reverseBytes,
  mapTransactionSegments,
} from "./transaction";
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

describe("buildP2PKHScript", () => {
  it("produces a 25-byte script with correct opcodes", () => {
    const hash = new Uint8Array(20).fill(0xab);
    const script = buildP2PKHScript(hash);

    expect(script.length).toBe(25);
    expect(script[0]).toBe(0x76); // OP_DUP
    expect(script[1]).toBe(0xa9); // OP_HASH160
    expect(script[2]).toBe(0x14); // push 20
    expect(script.slice(3, 23)).toEqual(hash);
    expect(script[23]).toBe(0x88); // OP_EQUALVERIFY
    expect(script[24]).toBe(0xac); // OP_CHECKSIG
  });
});

describe("buildP2WPKHScript", () => {
  it("produces a 22-byte script with witness version 0", () => {
    const hash = new Uint8Array(20).fill(0xcd);
    const script = buildP2WPKHScript(hash);

    expect(script.length).toBe(22);
    expect(script[0]).toBe(0x00); // OP_0
    expect(script[1]).toBe(0x14); // push 20
    expect(script.slice(2)).toEqual(hash);
  });
});

describe("buildP2PKHScriptSig", () => {
  it("pushes signature and pubkey with length prefixes", () => {
    const sig = new Uint8Array([0x30, 0x44, 0x01]);
    const pubKey = new Uint8Array([0x02, 0xab, 0xcd]);
    const scriptSig = buildP2PKHScriptSig(sig, pubKey);

    expect(scriptSig.length).toBe(1 + 3 + 1 + 3);
    expect(scriptSig[0]).toBe(3); // sig length
    expect(scriptSig.slice(1, 4)).toEqual(sig);
    expect(scriptSig[4]).toBe(3); // pubkey length
    expect(scriptSig.slice(5)).toEqual(pubKey);
  });
});

describe("serializeWitnessTransaction", () => {
  it("includes marker, flag, and witness data", () => {
    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: new Uint8Array(32).fill(0x11),
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
          witness: [new Uint8Array([0x30, 0x44]), new Uint8Array([0x02, 0xab])],
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

    const serialized = serializeWitnessTransaction(tx);

    // Version = 2
    expect(serialized[0]).toBe(0x02);
    // Marker = 0x00
    expect(serialized[4]).toBe(0x00);
    // Flag = 0x01
    expect(serialized[5]).toBe(0x01);
    // Input count = 1
    expect(serialized[6]).toBe(0x01);

    // Last 4 bytes = locktime = 0
    const len = serialized.length;
    expect(serialized[len - 4]).toBe(0x00);
    expect(serialized[len - 3]).toBe(0x00);
    expect(serialized[len - 2]).toBe(0x00);
    expect(serialized[len - 1]).toBe(0x00);

    // Witness section exists (before locktime): 2 items
    // Find witness: after outputs, before locktime
    // Legacy portion (without marker/flag) would be shorter
    const legacySerialized = serializeTransaction(tx);
    expect(serialized.length).toBeGreaterThan(legacySerialized.length);
  });
});

describe("reverseBytes", () => {
  it("reverses byte order", () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const reversed = reverseBytes(input);
    expect(reversed).toEqual(new Uint8Array([0x04, 0x03, 0x02, 0x01]));
  });

  it("round-trips correctly", () => {
    const input = new Uint8Array(32).fill(0xab);
    input[0] = 0x01;
    input[31] = 0xff;
    expect(reverseBytes(reverseBytes(input))).toEqual(input);
  });
});

describe("computeTxID", () => {
  it("produces a 32-byte hash", () => {
    const tx: Transaction = {
      version: 1,
      inputs: [
        {
          txid: new Uint8Array(32),
          vout: 0xffffffff,
          scriptSig: hexToBytes("04ffff001d0104"),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        {
          value: 5000000000n,
          scriptPubKey: hexToBytes(
            "4104678afdb0fe5548271967f1a67130b7105cd6a62e3e52e3e29139e5516cc76914e43f5c0b0c7bceb3bae80000000000000000000000000000000000000000000000ac",
          ),
        },
      ],
      locktime: 0,
    };

    const txid = computeTxID(tx);
    expect(txid.length).toBe(32);
    // Verify it's deterministic
    expect(bytesToHex(txid)).toBe(bytesToHex(computeTxID(tx)));
  });

  it("uses legacy serialization even when witness data is present", () => {
    const baseTx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: new Uint8Array(32).fill(0x11),
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
        },
      ],
      outputs: [{ value: 100000n, scriptPubKey: new Uint8Array([0x00, 0x14]) }],
      locktime: 0,
    };

    const witnessTx: Transaction = {
      ...baseTx,
      inputs: [{ ...baseTx.inputs[0], witness: [new Uint8Array(72), new Uint8Array(33)] }],
    };

    // TXID should be the same regardless of witness data
    expect(bytesToHex(computeTxID(baseTx))).toBe(bytesToHex(computeTxID(witnessTx)));
  });
});

describe("mapTransactionSegments", () => {
  it("produces segments that cover the full serialized length (legacy)", () => {
    const tx: Transaction = {
      version: 1,
      inputs: [
        {
          txid: new Uint8Array(32),
          vout: 0,
          scriptSig: new Uint8Array([0x00]),
          sequence: 0xffffffff,
        },
      ],
      outputs: [{ value: 50000n, scriptPubKey: new Uint8Array([0x76, 0xa9]) }],
      locktime: 0,
    };

    const segments = mapTransactionSegments(tx, false);
    const serialized = serializeTransaction(tx);

    // First segment starts at 0
    expect(segments[0].startByte).toBe(0);
    // Last segment ends at serialized length
    const lastSeg = segments[segments.length - 1];
    expect(lastSeg.endByte).toBe(serialized.length);

    // No gaps between segments
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].startByte).toBe(segments[i - 1].endByte);
    }
  });

  it("includes marker, flag, and witness segments for SegWit", () => {
    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: new Uint8Array(32),
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
          witness: [new Uint8Array(72)],
        },
      ],
      outputs: [{ value: 50000n, scriptPubKey: new Uint8Array(22) }],
      locktime: 0,
    };

    const segments = mapTransactionSegments(tx, true);
    const labels = segments.map((s) => s.label);

    expect(labels).toContain("Marker");
    expect(labels).toContain("Flag");
    expect(labels).toContain("Witness 0");

    // Verify segments cover full witness serialization
    const serialized = serializeWitnessTransaction(tx);
    const lastSeg = segments[segments.length - 1];
    expect(lastSeg.endByte).toBe(serialized.length);
  });
});

describe("buildP2SHScript", () => {
  it("produces a 23-byte script with OP_HASH160 and OP_EQUAL", () => {
    const hash = new Uint8Array(20).fill(0xef);
    const script = buildP2SHScript(hash);

    expect(script.length).toBe(23);
    expect(script[0]).toBe(0xa9); // OP_HASH160
    expect(script[1]).toBe(0x14); // push 20
    expect(script.slice(2, 22)).toEqual(hash);
    expect(script[22]).toBe(0x87); // OP_EQUAL
  });
});

describe("buildP2WSHScript", () => {
  it("produces a 34-byte script with OP_0 and 32-byte push", () => {
    const hash = new Uint8Array(32).fill(0xde);
    const script = buildP2WSHScript(hash);

    expect(script.length).toBe(34);
    expect(script[0]).toBe(0x00); // OP_0
    expect(script[1]).toBe(0x20); // push 32
    expect(script.slice(2)).toEqual(hash);
  });
});
