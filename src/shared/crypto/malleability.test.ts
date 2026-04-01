import { describe, it, expect } from "vite-plus/test";
import { parseDERSignature, encodeDERSignature, malleateSignatureS } from "./malleability";
import { signECDSA, verifyECDSA, verifyECDSAPermissive } from "./signing";
import { generatePrivateKey, privateKeyToPublicKey } from "./keys";
import { sha256 } from "./hash";
import { computeTxID, buildP2PKHScript, buildP2PKHScriptSig } from "./transaction";
import type { Transaction } from "./transaction";
import { computeLegacySighash } from "./sighash";
import { signWithSighash } from "./signing";
import { hash160 } from "./hash";
import { bytesToHex } from "@noble/curves/utils.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";

const n = secp256k1.Point.Fn.ORDER;

describe("parseDERSignature", () => {
  it("extracts r and s from a real signECDSA output", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const der = signECDSA(privKey, msgHash);

    const { r, s } = parseDERSignature(der);
    expect(r).toBeGreaterThan(0n);
    expect(s).toBeGreaterThan(0n);
    expect(r).toBeLessThan(n);
    expect(s).toBeLessThan(n);
  });

  it("throws on invalid DER tag", () => {
    expect(() =>
      parseDERSignature(new Uint8Array([0x31, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01])),
    ).toThrow("SEQUENCE tag");
  });

  it("throws on too-short buffer", () => {
    expect(() => parseDERSignature(new Uint8Array([0x30, 0x00]))).toThrow("too short");
  });

  it("throws on trailing bytes", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1]));
    const der = signECDSA(privKey, msgHash);
    const withTrailing = new Uint8Array(der.length + 1);
    withTrailing.set(der);
    withTrailing[der.length] = 0x01;
    expect(() => parseDERSignature(withTrailing)).toThrow("SEQUENCE length");
  });
});

describe("encodeDERSignature", () => {
  it("round-trips with parseDERSignature", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([10, 20, 30]));
    const der = signECDSA(privKey, msgHash);

    const { r, s } = parseDERSignature(der);
    const reencoded = encodeDERSignature(r, s);
    expect(bytesToHex(reencoded)).toBe(bytesToHex(der));
  });

  it("prepends 0x00 when high bit is set (high-S value)", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([42]));
    const der = signECDSA(privKey, msgHash);
    const { r, s } = parseDERSignature(der);

    // n - s will have high bit set (since signECDSA normalizes to low-S)
    const highS = n - s;
    const encoded = encodeDERSignature(r, highS);

    // Parse it back and verify round-trip
    const parsed = parseDERSignature(encoded);
    expect(parsed.r).toBe(r);
    expect(parsed.s).toBe(highS);
  });
});

describe("malleateSignatureS", () => {
  it("produces s' = n - s", () => {
    const privKey = generatePrivateKey();
    const msgHash = sha256(new Uint8Array([1, 2, 3]));
    const der = signECDSA(privKey, msgHash);

    const { original, malleated } = malleateSignatureS(der);
    expect(original.s + malleated.s).toBe(n);
    expect(original.r).toBe(malleated.r);
  });

  it("malleated signature verifies with permissive but not strict", () => {
    const privKey = generatePrivateKey();
    const pubKey = privateKeyToPublicKey(privKey);
    const msgHash = sha256(new Uint8Array([5, 6, 7]));
    const der = signECDSA(privKey, msgHash);

    const { malleatedDER } = malleateSignatureS(der);

    // Strict (BIP-62 low-S) rejects
    expect(verifyECDSA(pubKey, msgHash, malleatedDER)).toBe(false);
    // Permissive accepts
    expect(verifyECDSAPermissive(pubKey, msgHash, malleatedDER)).toBe(true);
  });

  it("produces a different TxID when scriptSig is rebuilt", () => {
    const privKey = generatePrivateKey();
    const pubKey = privateKeyToPublicKey(privKey);
    const pubKeyHash = hash160(pubKey);
    const utxoScript = buildP2PKHScript(pubKeyHash);

    // Build unsigned tx
    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: sha256(new Uint8Array([0xaa])),
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
        },
      ],
      outputs: [{ value: 50000n, scriptPubKey: buildP2PKHScript(new Uint8Array(20)) }],
      locktime: 0,
    };

    // Sign
    const sighash = computeLegacySighash(tx, 0, utxoScript);
    const sig = signWithSighash(privKey, sighash);
    tx.inputs[0].scriptSig = buildP2PKHScriptSig(sig, pubKey);
    const originalTxID = bytesToHex(computeTxID(tx));

    // Malleate: strip sighash byte, flip S, re-append
    const derOnly = sig.slice(0, sig.length - 1);
    const { malleatedDER } = malleateSignatureS(derOnly);
    const malleatedSig = new Uint8Array(malleatedDER.length + 1);
    malleatedSig.set(malleatedDER);
    malleatedSig[malleatedDER.length] = 0x01; // SIGHASH_ALL

    tx.inputs[0].scriptSig = buildP2PKHScriptSig(malleatedSig, pubKey);
    const malleatedTxID = bytesToHex(computeTxID(tx));

    expect(malleatedTxID).not.toBe(originalTxID);
  });
});
