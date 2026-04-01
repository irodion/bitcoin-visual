import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import { hexToBytes } from "@noble/hashes/utils.js";

const n = secp256k1.Point.Fn.ORDER;

/** Parse a DER-encoded ECDSA signature into its (r, s) components. */
export function parseDERSignature(der: Uint8Array): { r: bigint; s: bigint } {
  if (der[0] !== 0x30) {
    throw new Error(`Invalid DER: expected SEQUENCE tag 0x30, got 0x${der[0].toString(16)}`);
  }
  // der[1] = total length of contents
  let offset = 2;

  // Parse r
  if (der[offset] !== 0x02) {
    throw new Error(
      `Invalid DER: expected INTEGER tag 0x02 for r, got 0x${der[offset].toString(16)}`,
    );
  }
  offset += 1;
  const rLen = der[offset];
  offset += 1;
  const r = bytesToNumberBE(der.slice(offset, offset + rLen));
  offset += rLen;

  // Parse s
  if (der[offset] !== 0x02) {
    throw new Error(
      `Invalid DER: expected INTEGER tag 0x02 for s, got 0x${der[offset].toString(16)}`,
    );
  }
  offset += 1;
  const sLen = der[offset];
  offset += 1;
  const s = bytesToNumberBE(der.slice(offset, offset + sLen));

  return { r, s };
}

/** Encode (r, s) as a DER SEQUENCE. */
export function encodeDERSignature(r: bigint, s: bigint): Uint8Array {
  const rBytes = bigintToMinimalBytes(r);
  const sBytes = bigintToMinimalBytes(s);

  // DER integers must be positive — prepend 0x00 if high bit is set
  const rPad = rBytes[0] & 0x80 ? 1 : 0;
  const sPad = sBytes[0] & 0x80 ? 1 : 0;

  const rEncLen = rBytes.length + rPad;
  const sEncLen = sBytes.length + sPad;
  const contentLen = 2 + rEncLen + 2 + sEncLen; // tag+len for each integer

  const buf = new Uint8Array(2 + contentLen);
  let offset = 0;

  // SEQUENCE header
  buf[offset++] = 0x30;
  buf[offset++] = contentLen;

  // r INTEGER
  buf[offset++] = 0x02;
  buf[offset++] = rEncLen;
  if (rPad) buf[offset++] = 0x00;
  buf.set(rBytes, offset);
  offset += rBytes.length;

  // s INTEGER
  buf[offset++] = 0x02;
  buf[offset++] = sEncLen;
  if (sPad) buf[offset++] = 0x00;
  buf.set(sBytes, offset);

  return buf;
}

/**
 * Malleate an ECDSA signature by flipping s to n - s.
 *
 * Every ECDSA signature (r, s) has a complement (r, n - s) that is equally
 * valid mathematically. This changes the DER encoding and thus the TxID.
 */
export function malleateSignatureS(derSig: Uint8Array): {
  original: { r: bigint; s: bigint };
  malleated: { r: bigint; s: bigint };
  malleatedDER: Uint8Array;
} {
  const original = parseDERSignature(derSig);
  const malleatedS = n - original.s;
  const malleatedDER = encodeDERSignature(original.r, malleatedS);

  return {
    original,
    malleated: { r: original.r, s: malleatedS },
    malleatedDER,
  };
}

function bigintToMinimalBytes(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array([0]);
  const hex = value.toString(16);
  return hexToBytes(hex.length % 2 ? "0" + hex : hex);
}
