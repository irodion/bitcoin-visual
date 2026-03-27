import { useMemo } from "react";
import { hexToBytes } from "@noble/hashes/utils.js";
import {
  isValidPrivateKey,
  privateKeyToPublicKey,
  hash160,
  publicKeyToP2PKHAddress,
  publicKeyToP2WPKHAddress,
} from "../../shared/crypto/index.ts";

export interface PipelineResult {
  entropy: Uint8Array | null;
  publicKey: Uint8Array | null;
  publicKeyHash: Uint8Array | null;
  p2pkhAddress: string | null;
  p2wpkhAddress: string | null;
  isValid: boolean;
  error: string | null;
}

const HEX_64 = /^[0-9a-fA-F]{64}$/;

const EMPTY: PipelineResult = {
  entropy: null,
  publicKey: null,
  publicKeyHash: null,
  p2pkhAddress: null,
  p2wpkhAddress: null,
  isValid: false,
  error: null,
};

export function useKeyPipeline(entropyHex: string): PipelineResult {
  return useMemo(() => {
    if (entropyHex === "") return EMPTY;

    if (!HEX_64.test(entropyHex)) {
      return { ...EMPTY, error: "Entropy must be exactly 64 hex characters (32 bytes)" };
    }

    const bytes = hexToBytes(entropyHex);

    if (!isValidPrivateKey(bytes)) {
      return {
        ...EMPTY,
        entropy: bytes,
        error: "Invalid: value is zero or exceeds the secp256k1 curve order",
      };
    }

    const publicKey = privateKeyToPublicKey(bytes);
    const publicKeyHash = hash160(publicKey);

    return {
      entropy: bytes,
      publicKey,
      publicKeyHash,
      p2pkhAddress: publicKeyToP2PKHAddress(publicKey),
      p2wpkhAddress: publicKeyToP2WPKHAddress(publicKey),
      isValid: true,
      error: null,
    };
  }, [entropyHex]);
}
