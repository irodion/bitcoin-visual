import { useState, useCallback } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import {
  generatePrivateKey,
  sha256,
  signWithNonce,
  recoverNonceFromTwoSigs,
  recoverPrivKeyFromNonce,
} from "../../shared/crypto/index.ts";
import { useStepReveal } from "./useStepReveal.ts";
import { bigintToHex64, generateKeyPair } from "./attackUtils.ts";

const encoder = new TextEncoder();

interface SignatureHex {
  rHex: string;
  sHex: string;
  r: bigint;
}

interface SignResult {
  sig1: SignatureHex;
  sig2: SignatureHex;
  z1Hex: string;
  z2Hex: string;
  recoveredKHex: string | null;
  recoveredPrivKeyHex: string | null;
}

export interface NonceReuseState {
  privateKeyHex: string;
  publicKeyHex: string;
  message1: string;
  message2: string;
  nonceMode: "same" | "different";
  stepByStep: boolean;
  revealedStep: number;

  signResult: SignResult | null;
  keysMatch: boolean | null;

  regenerate: () => void;
  setMessage1: (m: string) => void;
  setMessage2: (m: string) => void;
  setNonceMode: (mode: "same" | "different") => void;
  signBoth: () => void;
  toggleStepByStep: () => void;
  revealNext: () => void;
}

export function useNonceReuseState(): NonceReuseState {
  const [keyPair, setKeyPair] = useState(generateKeyPair);
  const [message1, setMessage1] = useState("Hello, Bitcoin!");
  const [message2, setMessage2] = useState("Buy coffee");
  const [nonceMode, setNonceMode] = useState<"same" | "different">("same");
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const reveal = useStepReveal();

  const keysMatch =
    signResult?.recoveredPrivKeyHex != null
      ? signResult.recoveredPrivKeyHex === keyPair.privHex
      : null;

  const regenerate = useCallback(() => {
    setKeyPair(generateKeyPair());
    setSignResult(null);
    reveal.resetReveal(reveal.stepByStep);
  }, [reveal]);

  const signBoth = useCallback(() => {
    const hash1 = sha256(encoder.encode(message1));
    const hash2 = sha256(encoder.encode(message2));
    const z1 = bytesToNumberBE(hash1);
    const z2 = bytesToNumberBE(hash2);

    const nonce1 = generatePrivateKey();
    const nonce2 = nonceMode === "same" ? nonce1 : generatePrivateKey();

    const s1 = signWithNonce(keyPair.priv, hash1, nonce1);
    const s2 = signWithNonce(keyPair.priv, hash2, nonce2);

    let recoveredKHex: string | null = null;
    let recoveredPrivKeyHex: string | null = null;

    if (nonceMode === "same") {
      const k = recoverNonceFromTwoSigs(s1.s, z1, s2.s, z2);
      const recovered = recoverPrivKeyFromNonce(s1.r, s1.s, z1, k);
      recoveredKHex = bigintToHex64(k);
      recoveredPrivKeyHex = bytesToHex(recovered);
    }

    setSignResult({
      sig1: { rHex: bigintToHex64(s1.r), sHex: bigintToHex64(s1.s), r: s1.r },
      sig2: { rHex: bigintToHex64(s2.r), sHex: bigintToHex64(s2.s), r: s2.r },
      z1Hex: bigintToHex64(z1),
      z2Hex: bigintToHex64(z2),
      recoveredKHex,
      recoveredPrivKeyHex,
    });

    reveal.resetReveal(reveal.stepByStep);
  }, [message1, message2, nonceMode, keyPair, reveal]);

  return {
    privateKeyHex: keyPair.privHex,
    publicKeyHex: keyPair.pubHex,
    message1,
    message2,
    nonceMode,
    stepByStep: reveal.stepByStep,
    revealedStep: reveal.revealedStep,
    signResult,
    keysMatch,
    regenerate,
    setMessage1,
    setMessage2,
    setNonceMode,
    signBoth,
    toggleStepByStep: reveal.toggleStepByStep,
    revealNext: reveal.revealNext,
  };
}
