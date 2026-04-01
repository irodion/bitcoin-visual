import { bytesToHex } from "@noble/hashes/utils.js";
import { generatePrivateKey, privateKeyToPublicKey } from "../../shared/crypto/index.ts";

export function bigintToHex64(n: bigint): string {
  return n.toString(16).padStart(64, "0");
}

export function generateKeyPair() {
  const priv = generatePrivateKey();
  const pub = privateKeyToPublicKey(priv);
  return { priv, pub, privHex: bytesToHex(priv), pubHex: bytesToHex(pub) };
}

export const SECP256K1_N_HEX = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";
