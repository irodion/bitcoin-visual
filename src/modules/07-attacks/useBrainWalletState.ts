import { useState, useMemo, useCallback } from "react";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import {
  sha256,
  generatePrivateKey,
  privateKeyToPublicKey,
  isValidPrivateKey,
  publicKeyToP2PKHAddress,
} from "../../shared/crypto/index.ts";
import {
  BRAIN_WALLET_HALL_OF_SHAME,
  BRAIN_WALLET_PHRASES,
  type BrainWalletEntry,
} from "./data/brainWalletHallOfShame.ts";

const encoder = new TextEncoder();

export interface BrainWalletDerived {
  privKeyHex: string;
  pubKeyHex: string;
  address: string;
}

export interface BrainWalletState {
  phrase: string;
  mode: "phrase" | "custom-bytes";
  customHex: string;
  customHexError: string | null;
  phraseDerived: BrainWalletDerived | null;
  rngDerived: BrainWalletDerived | null;
  hallOfShameMatch: BrainWalletEntry | null;

  setPhrase: (p: string) => void;
  setMode: (m: "phrase" | "custom-bytes") => void;
  setCustomHex: (h: string) => void;
  generateRngKey: () => void;
}

function deriveFromPrivKey(privKey: Uint8Array): BrainWalletDerived | null {
  if (!isValidPrivateKey(privKey)) return null;
  const pubKey = privateKeyToPublicKey(privKey, true);
  return {
    privKeyHex: bytesToHex(privKey),
    pubKeyHex: bytesToHex(pubKey),
    address: publicKeyToP2PKHAddress(pubKey, "mainnet"),
  };
}

export function useBrainWalletState(): BrainWalletState {
  const [phrase, setPhrase] = useState("correct horse battery staple");
  const [mode, setMode] = useState<"phrase" | "custom-bytes">("phrase");
  const [customHex, setCustomHex] = useState("");
  const [rngDerived, setRngDerived] = useState<BrainWalletDerived | null>(null);

  const customHexError = useMemo(() => {
    if (mode !== "custom-bytes" || customHex === "") return null;
    if (!/^[0-9a-fA-F]*$/.test(customHex)) return "Invalid hex characters";
    if (customHex.length !== 64) return "Must be exactly 64 hex characters (32 bytes)";
    const bytes = hexToBytes(customHex);
    if (!isValidPrivateKey(bytes)) return "Value is not a valid secp256k1 private key";
    return null;
  }, [mode, customHex]);

  const phraseDerived = useMemo<BrainWalletDerived | null>(() => {
    if (mode === "phrase") {
      if (phrase === "") return null;
      const privKey = sha256(encoder.encode(phrase));
      return deriveFromPrivKey(privKey);
    }
    if (customHex.length !== 64 || customHexError) return null;
    const privKey = hexToBytes(customHex);
    return deriveFromPrivKey(privKey);
  }, [mode, phrase, customHex, customHexError]);

  const hallOfShameMatch = useMemo<BrainWalletEntry | null>(() => {
    if (mode !== "phrase" || phrase === "") return null;
    if (!BRAIN_WALLET_PHRASES.has(phrase.toLowerCase())) return null;
    return (
      BRAIN_WALLET_HALL_OF_SHAME.find((e) => e.passphrase.toLowerCase() === phrase.toLowerCase()) ??
      null
    );
  }, [mode, phrase]);

  const generateRngKey = useCallback(() => {
    const privKey = generatePrivateKey();
    const derived = deriveFromPrivKey(privKey);
    setRngDerived(derived);
  }, []);

  return {
    phrase,
    mode,
    customHex,
    customHexError,
    phraseDerived,
    rngDerived,
    hallOfShameMatch,
    setPhrase,
    setMode,
    setCustomHex,
    generateRngKey,
  };
}
