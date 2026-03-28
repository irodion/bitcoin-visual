import { useMemo, useState, useCallback } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "../../shared/crypto/index.ts";
import {
  serializeTransaction,
  serializeWitnessTransaction,
  buildP2PKHScript,
  buildP2WPKHScript,
  buildP2PKHScriptSig,
  reverseBytes,
  mapTransactionSegments,
  type Transaction,
  type TxSegment,
} from "../../shared/crypto/transaction.ts";
import {
  MOCK_UTXOS,
  MOCK_PUBKEY,
  MOCK_SIGNATURE,
  RECIPIENT_PUBKEY_HASH,
  MOCK_PUBKEY_HASH,
  FEE_SATS,
  btcToSats,
  type UTXO,
} from "./constants.ts";

export interface TxIDIntermediate {
  serialized: string;
  firstHash: string;
  secondHash: string;
  reversed: string;
}

export interface UTXOState {
  // Data
  utxos: UTXO[];
  selectedIds: Set<string>;
  selectedUtxos: UTXO[];
  recipientAmountBTC: string;
  isSegWit: boolean;

  // Computed amounts
  totalInputSats: bigint;
  recipientAmountSats: bigint;
  changeAmountSats: bigint;
  feeSats: bigint;

  // Validation
  isValid: boolean;
  error: string | null;

  // Transaction data
  transaction: Transaction | null;
  serializedHex: string | null;
  witnessSerializedHex: string | null;
  txid: string | null;
  wtxid: string | null;
  txidIntermediate: TxIDIntermediate | null;
  hexSegments: TxSegment[];

  // Actions
  toggleUtxo: (id: string) => void;
  setRecipientAmount: (btc: string) => void;
  setSegWit: (enabled: boolean) => void;
}

export function useUTXOState(): UTXOState {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recipientAmountBTC, setRecipientAmountBTC] = useState("");
  const [isSegWit, setIsSegWit] = useState(false);

  const toggleUtxo = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setRecipientAmount = useCallback((btc: string) => {
    // Allow only valid BTC input: digits and single decimal point
    if (btc !== "" && !/^\d*\.?\d{0,8}$/.test(btc)) return;
    setRecipientAmountBTC(btc);
  }, []);

  const selectedUtxos = useMemo(
    () => MOCK_UTXOS.filter((u) => selectedIds.has(u.id)),
    [selectedIds],
  );

  const totalInputSats = useMemo(
    () => selectedUtxos.reduce((sum, u) => sum + u.valueSats, 0n),
    [selectedUtxos],
  );

  const recipientAmountSats = useMemo(() => btcToSats(recipientAmountBTC), [recipientAmountBTC]);

  const changeAmountSats = useMemo(
    () => totalInputSats - recipientAmountSats - FEE_SATS,
    [totalInputSats, recipientAmountSats],
  );

  const error = useMemo(() => {
    if (selectedUtxos.length === 0) return null; // No selection yet, not an error
    if (recipientAmountBTC === "" || recipientAmountSats === 0n) return null;
    if (changeAmountSats < 0n) return "Insufficient funds — select more UTXOs or reduce amount";
    if (recipientAmountSats < 546n) return "Output too small — below dust limit (546 sats)";
    if (changeAmountSats > 0n && changeAmountSats < 546n)
      return "Change output below dust limit (546 sats) — adjust amount";
    return null;
  }, [selectedUtxos.length, recipientAmountBTC, recipientAmountSats, changeAmountSats]);

  const isValid = useMemo(
    () =>
      selectedUtxos.length > 0 &&
      recipientAmountSats > 0n &&
      changeAmountSats >= 0n &&
      error === null,
    [selectedUtxos.length, recipientAmountSats, changeAmountSats, error],
  );

  const transaction = useMemo((): Transaction | null => {
    if (!isValid) return null;

    const inputs = selectedUtxos.map((u) => {
      if (isSegWit) {
        return {
          txid: u.txidBytes,
          vout: u.vout,
          scriptSig: new Uint8Array(0), // empty for SegWit
          sequence: 0xffffffff,
          witness: [MOCK_SIGNATURE, MOCK_PUBKEY],
        };
      }
      return {
        txid: u.txidBytes,
        vout: u.vout,
        scriptSig: buildP2PKHScriptSig(MOCK_SIGNATURE, MOCK_PUBKEY),
        sequence: 0xffffffff,
      };
    });

    const recipientScript = isSegWit
      ? buildP2WPKHScript(RECIPIENT_PUBKEY_HASH)
      : buildP2PKHScript(RECIPIENT_PUBKEY_HASH);

    const changeScript = isSegWit
      ? buildP2WPKHScript(MOCK_PUBKEY_HASH)
      : buildP2PKHScript(MOCK_PUBKEY_HASH);

    const outputs = [{ value: recipientAmountSats, scriptPubKey: recipientScript }];

    if (changeAmountSats > 0n) {
      outputs.push({ value: changeAmountSats, scriptPubKey: changeScript });
    }

    return { version: 2, inputs, outputs, locktime: 0 };
  }, [isValid, selectedUtxos, isSegWit, recipientAmountSats, changeAmountSats]);

  // Memoize raw bytes once, derive hex strings and hashes from them
  const serializedBytes = useMemo(() => {
    if (!transaction) return null;
    return serializeTransaction(transaction);
  }, [transaction]);

  const serializedHex = useMemo(() => {
    if (!serializedBytes) return null;
    return bytesToHex(serializedBytes);
  }, [serializedBytes]);

  const witnessSerializedBytes = useMemo(() => {
    if (!transaction || !isSegWit) return null;
    return serializeWitnessTransaction(transaction);
  }, [transaction, isSegWit]);

  const witnessSerializedHex = useMemo(() => {
    if (!witnessSerializedBytes) return null;
    return bytesToHex(witnessSerializedBytes);
  }, [witnessSerializedBytes]);

  const txidIntermediate = useMemo((): TxIDIntermediate | null => {
    if (!serializedBytes) return null;
    const firstHash = sha256(serializedBytes);
    const secondHash = sha256(firstHash);
    const reversed = reverseBytes(secondHash);
    return {
      serialized: bytesToHex(serializedBytes),
      firstHash: bytesToHex(firstHash),
      secondHash: bytesToHex(secondHash),
      reversed: bytesToHex(reversed),
    };
  }, [serializedBytes]);

  const txid = useMemo(() => txidIntermediate?.reversed ?? null, [txidIntermediate]);

  const wtxid = useMemo(() => {
    if (!witnessSerializedBytes) return null;
    const firstHash = sha256(witnessSerializedBytes);
    const secondHash = sha256(firstHash);
    return bytesToHex(reverseBytes(secondHash));
  }, [witnessSerializedBytes]);

  const hexSegments = useMemo(() => {
    if (!transaction) return [];
    return mapTransactionSegments(transaction, isSegWit);
  }, [transaction, isSegWit]);

  return {
    utxos: MOCK_UTXOS,
    selectedIds,
    selectedUtxos,
    recipientAmountBTC,
    isSegWit,
    totalInputSats,
    recipientAmountSats,
    changeAmountSats,
    feeSats: FEE_SATS,
    isValid,
    error,
    transaction,
    serializedHex,
    witnessSerializedHex,
    txid,
    wtxid,
    txidIntermediate,
    hexSegments,
    toggleUtxo,
    setRecipientAmount,
    setSegWit: setIsSegWit,
  };
}
