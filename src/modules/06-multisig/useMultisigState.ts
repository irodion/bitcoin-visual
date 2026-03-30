import { useState, useMemo, useCallback } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  sha256,
  generatePrivateKey,
  privateKeyToPublicKey,
  createMultisigRedeemScript,
  redeemScriptToP2SHAddress,
  redeemScriptToP2WSHAddress,
  buildP2WSHScript,
  buildP2WPKHScript,
  reverseBytes,
  serializeWitnessTransaction,
  computeTxID,
  createUnsignedPSBT,
  addPartialSignature,
  finalizePSBTMultisig,
  countSignatures,
  serializePSBTDisplay,
  computeBIP143SighashVerbose,
  signWithSighash,
} from "../../shared/crypto/index.ts";
import type { Transaction, PSBT, SighashDetail } from "../../shared/crypto/index.ts";
import { useMempoolStore } from "../../shared/stores/index.ts";

// ── Types ──

export interface Cosigner {
  id: number;
  label: string;
  privateKey: Uint8Array | null;
  publicKey: Uint8Array | null;
}

export interface MultisigState {
  activeTab: "setup" | "sign" | "models";
  setActiveTab: (tab: "setup" | "sign" | "models") => void;

  cosigners: Cosigner[];
  generateCosignerKey: (index: number) => void;
  generateAllKeys: () => void;
  allKeysGenerated: boolean;

  redeemScript: Uint8Array | null;
  redeemScriptHex: string | null;
  p2shAddress: string | null;
  p2wshAddress: string | null;

  mockUtxo: { txid: Uint8Array; vout: number; value: bigint } | null;
  sendAmountSats: bigint;
  feeSats: bigint;

  psbt: PSBT | null;
  psbtStep: 0 | 1 | 2 | 3 | 4;
  createPSBT: () => void;
  signWithCosigner: (cosignerIndex: number) => void;
  finalizePSBT: () => void;
  simulateBroadcast: () => void;

  psbtDisplayHex: string | null;
  signatureTracker: Array<{ cosignerId: number; label: string; signed: boolean }>;
  finalizedTxHex: string | null;
  txid: string | null;
  broadcastSimulated: boolean;
  sighashDetails: SighashDetail | null;
}

// ── Constants ──

const COSIGNER_LABELS = ["Phone", "Hardware HSM", "Cold Backup"] as const;
const MOCK_TXID = new Uint8Array(32);
// Fill with a deterministic pattern so it looks realistic in hex
for (let i = 0; i < 32; i++) MOCK_TXID[i] = (0xa1 + i * 7) & 0xff;

const MOCK_UTXO_VALUE = 10_000_000n; // 0.1 BTC
const SEND_AMOUNT = 8_000_000n; // 0.08 BTC
const FEE = 2_000n; // 2000 sats

// ── Hook ──

export function useMultisigState(): MultisigState {
  const [activeTab, setActiveTab] = useState<"setup" | "sign" | "models">("setup");
  const [cosigners, setCosigners] = useState<Cosigner[]>(
    COSIGNER_LABELS.map((label, i) => ({
      id: i + 1,
      label,
      privateKey: null,
      publicKey: null,
    })),
  );
  const [psbt, setPsbt] = useState<PSBT | null>(null);
  const [psbtStep, setPsbtStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [finalizedTx, setFinalizedTx] = useState<Transaction | null>(null);
  const [broadcastSimulated, setBroadcastSimulated] = useState(false);
  const [sighashDetails, setSighashDetails] = useState<SighashDetail | null>(null);

  const allKeysGenerated = cosigners.every((c) => c.publicKey !== null);

  // ── Key generation ──

  const generateCosignerKey = useCallback((index: number) => {
    const priv = generatePrivateKey();
    const pub = privateKeyToPublicKey(priv);
    setCosigners((prev) =>
      prev.map((c, i) => (i === index ? { ...c, privateKey: priv, publicKey: pub } : c)),
    );
    // Reset PSBT workflow when keys change
    setPsbt(null);
    setPsbtStep(0);
    setFinalizedTx(null);
    setBroadcastSimulated(false);
    setSighashDetails(null);
  }, []);

  const generateAllKeys = useCallback(() => {
    setCosigners((prev) =>
      prev.map((c) => {
        const priv = generatePrivateKey();
        const pub = privateKeyToPublicKey(priv);
        return { ...c, privateKey: priv, publicKey: pub };
      }),
    );
    setPsbt(null);
    setPsbtStep(0);
    setFinalizedTx(null);
    setBroadcastSimulated(false);
    setSighashDetails(null);
  }, []);

  // ── Derived multisig data ──

  const redeemScript = useMemo(() => {
    if (!allKeysGenerated) return null;
    const pubkeys = cosigners.map((c) => c.publicKey!);
    return createMultisigRedeemScript(pubkeys, 2);
  }, [cosigners, allKeysGenerated]);

  const redeemScriptHex = useMemo(
    () => (redeemScript ? bytesToHex(redeemScript) : null),
    [redeemScript],
  );

  const p2shAddress = useMemo(
    () => (redeemScript ? redeemScriptToP2SHAddress(redeemScript) : null),
    [redeemScript],
  );

  const p2wshAddress = useMemo(
    () => (redeemScript ? redeemScriptToP2WSHAddress(redeemScript) : null),
    [redeemScript],
  );

  // ── Mock UTXO ──

  const mockUtxo = useMemo(() => {
    if (!redeemScript) return null;
    return { txid: MOCK_TXID, vout: 0, value: MOCK_UTXO_VALUE };
  }, [redeemScript]);

  // ── P2WSH scriptPubKey for the multisig address ──

  const p2wshScriptPubKey = useMemo(() => {
    if (!redeemScript) return null;
    const witnessScriptHash = sha256(redeemScript);
    return buildP2WSHScript(witnessScriptHash);
  }, [redeemScript]);

  // ── PSBT workflow ──

  const createPSBTAction = useCallback(() => {
    if (!mockUtxo || !redeemScript || !p2wshScriptPubKey) return;

    // Build a recipient P2WPKH output (using a deterministic fake address hash)
    const fakeRecipientHash = new Uint8Array(20);
    for (let i = 0; i < 20; i++) fakeRecipientHash[i] = (0xb2 + i * 3) & 0xff;
    const recipientScript = buildP2WPKHScript(fakeRecipientHash);

    // Change goes back to the multisig P2WSH address
    const changeAmount = MOCK_UTXO_VALUE - SEND_AMOUNT - FEE;

    const tx: Transaction = {
      version: 2,
      inputs: [
        {
          txid: mockUtxo.txid,
          vout: mockUtxo.vout,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
        },
      ],
      outputs: [
        { value: SEND_AMOUNT, scriptPubKey: recipientScript },
        { value: changeAmount, scriptPubKey: p2wshScriptPubKey },
      ],
      locktime: 0,
    };

    const newPsbt = createUnsignedPSBT(tx, redeemScript, mockUtxo.value, p2wshScriptPubKey);
    setPsbt(newPsbt);
    setPsbtStep(1);
    setFinalizedTx(null);
    setBroadcastSimulated(false);
    setSighashDetails(null);
  }, [mockUtxo, redeemScript, p2wshScriptPubKey]);

  const signWithCosignerAction = useCallback(
    (cosignerIndex: number) => {
      if (!psbt || !redeemScript) return;
      if (cosignerIndex < 0 || cosignerIndex >= cosigners.length) return;
      const cosigner = cosigners[cosignerIndex];
      if (!cosigner.privateKey || !cosigner.publicKey) return;

      // Compute BIP143 sighash
      const details = computeBIP143SighashVerbose(
        psbt.unsignedTx,
        0,
        redeemScript,
        mockUtxo!.value,
      );
      setSighashDetails(details);

      // Sign
      const sig = signWithSighash(cosigner.privateKey, details.sighash);

      // Add to PSBT
      const updated = addPartialSignature(psbt, 0, cosigner.publicKey, sig);
      setPsbt(updated);

      const sigCount = countSignatures(updated, 0);
      if (sigCount >= 2) {
        setPsbtStep(3);
      } else {
        setPsbtStep(2);
      }
    },
    [psbt, cosigners, redeemScript, mockUtxo],
  );

  const finalizePSBTAction = useCallback(() => {
    if (!psbt) return;
    try {
      const finalized = finalizePSBTMultisig(psbt, 0, 2);
      setFinalizedTx(finalized);
      setPsbtStep(4);
    } catch {
      // finalizePSBTMultisig can throw on insufficient/invalid signatures.
      // In this educational UI the signing flow prevents that, but guard anyway.
    }
  }, [psbt]);

  const simulateBroadcastAction = useCallback(() => {
    setBroadcastSimulated(true);
    if (finalizedTx) {
      const txidBytes = computeTxID(finalizedTx);
      const txHex = bytesToHex(serializeWitnessTransaction(finalizedTx));
      const txidHex = bytesToHex(reverseBytes(txidBytes));
      useMempoolStore.getState().setPendingTx({
        txid: txidBytes,
        txidHex,
        data: `2-of-3 Multisig (${txHex.slice(0, 16)}\u2026)`,
      });
    }
  }, [finalizedTx]);

  // ── Display values ──

  const psbtDisplayHex = useMemo(() => (psbt ? serializePSBTDisplay(psbt) : null), [psbt]);

  const signatureTracker = useMemo(() => {
    return cosigners.map((c) => ({
      cosignerId: c.id,
      label: c.label,
      signed:
        psbt && c.publicKey
          ? (psbt.inputs[0]?.partialSigs.has(bytesToHex(c.publicKey)) ?? false)
          : false,
    }));
  }, [cosigners, psbt]);

  const finalizedTxHex = useMemo(() => {
    if (!finalizedTx) return null;
    return bytesToHex(serializeWitnessTransaction(finalizedTx));
  }, [finalizedTx]);

  const txid = useMemo(() => {
    if (!finalizedTx) return null;
    return bytesToHex(reverseBytes(computeTxID(finalizedTx)));
  }, [finalizedTx]);

  return {
    activeTab,
    setActiveTab,
    cosigners,
    generateCosignerKey,
    generateAllKeys,
    allKeysGenerated,
    redeemScript,
    redeemScriptHex,
    p2shAddress,
    p2wshAddress,
    mockUtxo,
    sendAmountSats: SEND_AMOUNT,
    feeSats: FEE,
    psbt,
    psbtStep,
    createPSBT: createPSBTAction,
    signWithCosigner: signWithCosignerAction,
    finalizePSBT: finalizePSBTAction,
    simulateBroadcast: simulateBroadcastAction,
    psbtDisplayHex,
    signatureTracker,
    finalizedTxHex,
    txid,
    broadcastSimulated,
    sighashDetails,
  };
}
