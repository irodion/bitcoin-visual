import { describe, it, expect } from "vitest";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "./hash";
import {
  createUnsignedPSBT,
  addPartialSignature,
  finalizePSBTMultisig,
  countSignatures,
  serializePSBTDisplay,
} from "./psbt";
import { createMultisigRedeemScript } from "./multisig";
import { buildP2WSHScript } from "./transaction";
import { generatePrivateKey, privateKeyToPublicKey } from "./keys";
import { computeBIP143Sighash } from "./sighash";
import { signWithSighash } from "./signing";
import type { Transaction } from "./transaction";

function setup() {
  const privKeys = Array.from({ length: 3 }, () => generatePrivateKey());
  const pubKeys = privKeys.map((k) => privateKeyToPublicKey(k));
  const redeemScript = createMultisigRedeemScript(pubKeys, 2);
  const scriptHash = sha256(redeemScript);
  const scriptPubKey = buildP2WSHScript(scriptHash);

  const tx: Transaction = {
    version: 2,
    inputs: [
      {
        txid: new Uint8Array(32).fill(0xa1),
        vout: 0,
        scriptSig: new Uint8Array(0),
        sequence: 0xffffffff,
      },
    ],
    outputs: [
      { value: 8_000_000n, scriptPubKey: new Uint8Array(22).fill(0xbb) },
      { value: 1_998_000n, scriptPubKey },
    ],
    locktime: 0,
  };

  const inputValue = 10_000_000n;
  const psbt = createUnsignedPSBT(tx, redeemScript, inputValue, scriptPubKey);

  return { privKeys, pubKeys, redeemScript, scriptPubKey, tx, inputValue, psbt };
}

describe("createUnsignedPSBT", () => {
  it("creates PSBT with status 'unsigned'", () => {
    const { psbt } = setup();
    expect(psbt.status).toBe("unsigned");
  });

  it("has zero signatures", () => {
    const { psbt } = setup();
    expect(countSignatures(psbt, 0)).toBe(0);
  });
});

describe("addPartialSignature", () => {
  it("increments signature count", () => {
    const { psbt, privKeys, pubKeys, redeemScript, inputValue, tx } = setup();
    const sighash = computeBIP143Sighash(tx, 0, redeemScript, inputValue);
    const sig = signWithSighash(privKeys[0], sighash);
    const updated = addPartialSignature(psbt, 0, pubKeys[0], sig);
    expect(countSignatures(updated, 0)).toBe(1);
    expect(updated.status).toBe("partially_signed");
  });

  it("accumulates multiple signatures", () => {
    const { psbt, privKeys, pubKeys, redeemScript, inputValue, tx } = setup();
    const sighash = computeBIP143Sighash(tx, 0, redeemScript, inputValue);
    const sig1 = signWithSighash(privKeys[0], sighash);
    const sig2 = signWithSighash(privKeys[1], sighash);
    let updated = addPartialSignature(psbt, 0, pubKeys[0], sig1);
    updated = addPartialSignature(updated, 0, pubKeys[1], sig2);
    expect(countSignatures(updated, 0)).toBe(2);
  });
});

describe("finalizePSBTMultisig", () => {
  it("builds correct witness stack with 4 items", () => {
    const { psbt, privKeys, pubKeys, redeemScript, inputValue, tx } = setup();
    const sighash = computeBIP143Sighash(tx, 0, redeemScript, inputValue);
    const sig1 = signWithSighash(privKeys[0], sighash);
    const sig2 = signWithSighash(privKeys[1], sighash);
    let updated = addPartialSignature(psbt, 0, pubKeys[0], sig1);
    updated = addPartialSignature(updated, 0, pubKeys[1], sig2);

    const finalized = finalizePSBTMultisig(updated, 0, 2);
    const witness = finalized.inputs[0].witness!;

    // [OP_0 dummy, sig1, sig2, witnessScript]
    expect(witness.length).toBe(4);
    expect(witness[0].length).toBe(0); // dummy
    expect(witness[3]).toEqual(redeemScript); // last item is witness script
  });

  it("orders signatures by pubkey position in script (BIP67)", () => {
    const { psbt, privKeys, pubKeys, redeemScript, inputValue, tx } = setup();
    const sighash = computeBIP143Sighash(tx, 0, redeemScript, inputValue);

    // Sign in reverse order (key 1 then key 0) — finalization should still order correctly
    const sig1 = signWithSighash(privKeys[1], sighash);
    const sig0 = signWithSighash(privKeys[0], sighash);
    let updated = addPartialSignature(psbt, 0, pubKeys[1], sig1);
    updated = addPartialSignature(updated, 0, pubKeys[0], sig0);

    const finalized = finalizePSBTMultisig(updated, 0, 2);
    const witness = finalized.inputs[0].witness!;

    // Extract sorted pubkeys from redeem script
    const sortedPubkeyHexes: string[] = [];
    let offset = 1;
    while (offset < redeemScript.length - 2) {
      const len = redeemScript[offset];
      if (len !== 33) break;
      offset += 1;
      sortedPubkeyHexes.push(bytesToHex(redeemScript.slice(offset, offset + len)));
      offset += len;
    }

    // Find which sorted pubkey's sig comes first in the witness
    const pk0Hex = bytesToHex(pubKeys[0]);
    const pk1Hex = bytesToHex(pubKeys[1]);
    const pk0SortedIdx = sortedPubkeyHexes.indexOf(pk0Hex);
    const pk1SortedIdx = sortedPubkeyHexes.indexOf(pk1Hex);

    // The witness sig order should match the sorted pubkey order
    if (pk0SortedIdx < pk1SortedIdx) {
      expect(witness[1]).toEqual(sig0);
      expect(witness[2]).toEqual(sig1);
    } else {
      expect(witness[1]).toEqual(sig1);
      expect(witness[2]).toEqual(sig0);
    }
  });

  it("throws when not enough signatures", () => {
    const { psbt, privKeys, pubKeys, redeemScript, inputValue, tx } = setup();
    const sighash = computeBIP143Sighash(tx, 0, redeemScript, inputValue);
    const sig = signWithSighash(privKeys[0], sighash);
    const updated = addPartialSignature(psbt, 0, pubKeys[0], sig);
    expect(() => finalizePSBTMultisig(updated, 0, 2)).toThrow("Not enough signatures");
  });
});

describe("serializePSBTDisplay", () => {
  it("produces structured text output", () => {
    const { psbt } = setup();
    const display = serializePSBTDisplay(psbt);
    expect(display).toContain("PSBT");
    expect(display).toContain("unsigned");
    expect(display).toContain("version: 2");
    expect(display).toContain("partialSigs: 0");
  });
});
