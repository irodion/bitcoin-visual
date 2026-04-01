import { useState, useCallback } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  hash160,
  sha256,
  signWithSighash,
  verifyECDSA,
  verifyECDSAPermissive,
  buildP2PKHScript,
  buildP2WPKHScript,
  buildP2PKHScriptSig,
  computeTxID,
  reverseBytes,
  serializeTransaction,
  serializeWitnessTransaction,
  mapTransactionSegments,
  computeLegacySighash,
  computeBIP143Sighash,
  malleateSignatureS,
} from "../../shared/crypto/index.ts";
import type { Transaction, TxSegment } from "../../shared/crypto/index.ts";
import { useStepReveal } from "./useStepReveal.ts";

import { bigintToHex64, generateKeyPair } from "./attackUtils.ts";

export interface MalleabilityResult {
  originalR: string;
  originalS: string;
  malleatedS: string;
  originalSigHex: string;
  malleatedSigHex: string;
  originalTxHex: string;
  malleatedTxHex: string;
  originalTxID: string;
  malleatedTxID: string;
  txIdChanged: boolean;
  verifOrigStrict: boolean;
  verifMalleatedStrict: boolean;
  verifOrigPermissive: boolean;
  verifMalleatedPermissive: boolean;
  originalSegments: TxSegment[];
  malleatedSegments: TxSegment[];
  changedBytes: Set<number>;
}

export interface TxMalleabilityState {
  privateKeyHex: string;
  publicKeyHex: string;
  txMode: "legacy" | "segwit";
  result: MalleabilityResult | null;
  stepByStep: boolean;
  revealedStep: number;
  regenerate: () => void;
  setTxMode: (mode: "legacy" | "segwit") => void;
  runAttack: () => void;
  toggleStepByStep: () => void;
  revealNext: () => void;
}

const INPUT_VALUE = 100000n; // sats (for SegWit sighash)

export function useTxMalleabilityState(): TxMalleabilityState {
  const [keyPair, setKeyPair] = useState(generateKeyPair);
  const [txMode, setTxModeRaw] = useState<"legacy" | "segwit">("legacy");
  const [result, setResult] = useState<MalleabilityResult | null>(null);
  const reveal = useStepReveal();
  const { resetReveal } = reveal;

  const regenerate = useCallback(() => {
    setKeyPair(generateKeyPair());
    setResult(null);
    setTxModeRaw("legacy");
    resetReveal(false);
  }, [resetReveal]);

  const setTxMode = useCallback(
    (mode: "legacy" | "segwit") => {
      setTxModeRaw(mode);
      setResult(null);
      resetReveal(reveal.stepByStep);
    },
    [resetReveal, reveal.stepByStep],
  );

  const runAttack = useCallback(() => {
    const isSegWit = txMode === "segwit";
    const pubKeyHash = hash160(keyPair.pub);
    const recipientHash = sha256(keyPair.pub).slice(0, 20); // deterministic dummy recipient
    const p2pkhScript = buildP2PKHScript(pubKeyHash);

    const utxoScriptPubKey = isSegWit ? buildP2WPKHScript(pubKeyHash) : p2pkhScript;

    const prevTxId = sha256(keyPair.priv);
    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: prevTxId,
          vout: 0,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        {
          value: 50000n,
          scriptPubKey: buildP2PKHScript(recipientHash),
        },
      ],
      locktime: 0,
    };

    const sighash = isSegWit
      ? computeBIP143Sighash(tx, 0, p2pkhScript, INPUT_VALUE)
      : computeLegacySighash(tx, 0, utxoScriptPubKey);

    const sig = signWithSighash(keyPair.priv, sighash);

    if (isSegWit) {
      tx.inputs[0].witness = [sig, keyPair.pub];
    } else {
      tx.inputs[0].scriptSig = buildP2PKHScriptSig(sig, keyPair.pub);
    }

    const origTxID = bytesToHex(reverseBytes(computeTxID(tx)));
    const origHex = bytesToHex(
      isSegWit ? serializeWitnessTransaction(tx) : serializeTransaction(tx),
    );
    const origSegments = mapTransactionSegments(tx, isSegWit);

    const derOnly = sig.slice(0, sig.length - 1);
    const { original, malleated, malleatedDER } = malleateSignatureS(derOnly);
    const malleatedSig = new Uint8Array(malleatedDER.length + 1);
    malleatedSig.set(malleatedDER);
    malleatedSig[malleatedDER.length] = 0x01; // SIGHASH_ALL

    const malTx: Transaction = {
      ...tx,
      inputs: tx.inputs.map((inp) => ({ ...inp })),
    };
    if (isSegWit) {
      malTx.inputs[0].witness = [malleatedSig, keyPair.pub];
    } else {
      malTx.inputs[0].scriptSig = buildP2PKHScriptSig(malleatedSig, keyPair.pub);
    }

    const malTxID = bytesToHex(reverseBytes(computeTxID(malTx)));
    const malHex = bytesToHex(
      isSegWit ? serializeWitnessTransaction(malTx) : serializeTransaction(malTx),
    );
    const malSegments = mapTransactionSegments(malTx, isSegWit);

    const verifOrigStrict = verifyECDSA(keyPair.pub, sighash, derOnly);
    const verifOrigPermissive = verifyECDSAPermissive(keyPair.pub, sighash, derOnly);
    const verifMalleatedStrict = verifyECDSA(keyPair.pub, sighash, malleatedDER);
    const verifMalleatedPermissive = verifyECDSAPermissive(keyPair.pub, sighash, malleatedDER);

    const changedBytes = new Set<number>();
    const shorter = Math.min(origHex.length, malHex.length);
    for (let i = 0; i < shorter; i += 2) {
      if (origHex[i] !== malHex[i] || origHex[i + 1] !== malHex[i + 1]) {
        changedBytes.add(i / 2);
      }
    }
    for (let i = shorter; i < Math.max(origHex.length, malHex.length); i += 2) {
      changedBytes.add(i / 2);
    }

    setResult({
      originalR: bigintToHex64(original.r),
      originalS: bigintToHex64(original.s),
      malleatedS: bigintToHex64(malleated.s),
      originalSigHex: bytesToHex(sig),
      malleatedSigHex: bytesToHex(malleatedSig),
      originalTxHex: origHex,
      malleatedTxHex: malHex,
      originalTxID: origTxID,
      malleatedTxID: malTxID,
      txIdChanged: origTxID !== malTxID,
      verifOrigStrict,
      verifMalleatedStrict,
      verifOrigPermissive,
      verifMalleatedPermissive,
      originalSegments: origSegments,
      malleatedSegments: malSegments,
      changedBytes,
    });

    resetReveal(reveal.stepByStep);
  }, [txMode, keyPair, resetReveal, reveal.stepByStep]);

  return {
    privateKeyHex: keyPair.privHex,
    publicKeyHex: keyPair.pubHex,
    txMode,
    result,
    stepByStep: reveal.stepByStep,
    revealedStep: reveal.revealedStep,
    regenerate,
    setTxMode,
    runAttack,
    toggleStepByStep: reveal.toggleStepByStep,
    revealNext: reveal.revealNext,
  };
}
