import { describe, it, expect } from "vite-plus/test";
import { computeBIP143Sighash, computeBIP143SighashVerbose, computeLegacySighash } from "./sighash";
import { buildP2PKHScript } from "./transaction";
import { generatePrivateKey, privateKeyToPublicKey } from "./keys";
import { createMultisigRedeemScript } from "./multisig";
import type { Transaction } from "./transaction";

function makeTx(): Transaction {
  return {
    version: 2,
    inputs: [
      {
        txid: new Uint8Array(32).fill(0xaa),
        vout: 0,
        scriptSig: new Uint8Array(0),
        sequence: 0xffffffff,
      },
    ],
    outputs: [
      {
        value: 8_000_000n,
        scriptPubKey: new Uint8Array(22).fill(0xbb),
      },
      {
        value: 1_998_000n,
        scriptPubKey: new Uint8Array(34).fill(0xcc),
      },
    ],
    locktime: 0,
  };
}

function makeWitnessScript(): Uint8Array {
  const keys = Array.from({ length: 3 }, () => privateKeyToPublicKey(generatePrivateKey()));
  return createMultisigRedeemScript(keys, 2);
}

describe("computeBIP143Sighash", () => {
  it("returns a 32-byte hash", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const hash = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    expect(hash.length).toBe(32);
  });

  it("is deterministic", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const h1 = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    const h2 = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    expect(h1).toEqual(h2);
  });

  it("changes when output value changes", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const h1 = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    tx.outputs[0].value = 7_000_000n;
    const h2 = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    expect(h1).not.toEqual(h2);
  });

  it("changes when input value changes", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const h1 = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    const h2 = computeBIP143Sighash(tx, 0, ws, 5_000_000n);
    expect(h1).not.toEqual(h2);
  });
});

describe("computeBIP143SighashVerbose", () => {
  it("returns all intermediate fields", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const details = computeBIP143SighashVerbose(tx, 0, ws, 10_000_000n);

    expect(details.hashPrevouts.length).toBe(32);
    expect(details.hashSequence.length).toBe(32);
    expect(details.hashOutputs.length).toBe(32);
    expect(details.preimage.length).toBeGreaterThan(100);
    expect(details.sighash.length).toBe(32);
  });

  it("sighash matches non-verbose version", () => {
    const tx = makeTx();
    const ws = makeWitnessScript();
    const simple = computeBIP143Sighash(tx, 0, ws, 10_000_000n);
    const verbose = computeBIP143SighashVerbose(tx, 0, ws, 10_000_000n);
    expect(verbose.sighash).toEqual(simple);
  });
});

describe("computeLegacySighash", () => {
  it("returns a 32-byte hash", () => {
    const tx = makeTx();
    const subscript = buildP2PKHScript(new Uint8Array(20));
    const hash = computeLegacySighash(tx, 0, subscript);
    expect(hash.length).toBe(32);
  });

  it("is deterministic", () => {
    const tx = makeTx();
    const subscript = buildP2PKHScript(new Uint8Array(20));
    const h1 = computeLegacySighash(tx, 0, subscript);
    const h2 = computeLegacySighash(tx, 0, subscript);
    expect(h1).toEqual(h2);
  });

  it("produces different hash than BIP143 sighash", () => {
    const tx = makeTx();
    const subscript = buildP2PKHScript(new Uint8Array(20));
    const legacy = computeLegacySighash(tx, 0, subscript);
    const segwit = computeBIP143Sighash(tx, 0, subscript, 10_000_000n);
    expect(legacy).not.toEqual(segwit);
  });

  it("does not mutate the original transaction", () => {
    const tx = makeTx();
    tx.inputs[0].scriptSig = new Uint8Array([0xde, 0xad]);
    const originalScriptSig = tx.inputs[0].scriptSig;
    const subscript = buildP2PKHScript(new Uint8Array(20));

    computeLegacySighash(tx, 0, subscript);

    expect(tx.inputs[0].scriptSig).toBe(originalScriptSig);
    expect(tx.inputs[0].scriptSig).toEqual(new Uint8Array([0xde, 0xad]));
  });
});
