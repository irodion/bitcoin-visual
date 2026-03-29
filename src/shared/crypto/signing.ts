import { secp256k1 } from "@noble/curves/secp256k1.js";

/** Returns DER-encoded ECDSA signature (typically 70–72 bytes). */
export function signECDSA(privKey: Uint8Array, msgHash: Uint8Array): Uint8Array {
  return secp256k1.sign(msgHash, privKey, { prehash: false, format: "der" });
}

/**
 * Returns DER-encoded signature with SIGHASH type byte appended.
 * This is the format used in Bitcoin witness stacks and scriptSigs.
 */
export function signWithSighash(
  privKey: Uint8Array,
  msgHash: Uint8Array,
  sighashType = 0x01,
): Uint8Array {
  if (!Number.isInteger(sighashType) || sighashType < 0x00 || sighashType > 0xff) {
    throw new RangeError(`sighashType must be a byte (0x00–0xff), got ${sighashType}`);
  }
  const der = signECDSA(privKey, msgHash);
  const result = new Uint8Array(der.length + 1);
  result.set(der);
  result[der.length] = sighashType;
  return result;
}

/** Verify an ECDSA signature (DER-encoded) against a public key. */
export function verifyECDSA(
  pubKey: Uint8Array,
  msgHash: Uint8Array,
  signature: Uint8Array,
): boolean {
  return secp256k1.verify(signature, msgHash, pubKey, { prehash: false, format: "der" });
}
