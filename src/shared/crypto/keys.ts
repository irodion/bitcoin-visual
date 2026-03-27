import { secp256k1 } from "@noble/curves/secp256k1.js";

export function generatePrivateKey(): Uint8Array {
  return secp256k1.utils.randomSecretKey();
}

export function privateKeyToPublicKey(privKey: Uint8Array, compressed = true): Uint8Array {
  return secp256k1.getPublicKey(privKey, compressed);
}

export function isValidPrivateKey(privKey: Uint8Array): boolean {
  return secp256k1.utils.isValidSecretKey(privKey);
}
