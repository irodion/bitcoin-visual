import { sha256d } from "./hash";
import { serializeTransaction } from "./transaction";
import type { Transaction } from "./transaction";

export interface SighashDetail {
  hashPrevouts: Uint8Array;
  hashSequence: Uint8Array;
  hashOutputs: Uint8Array;
  preimage: Uint8Array;
  sighash: Uint8Array;
}

// ── Helpers (local, same logic as transaction.ts) ──

function writeUint32LE(buf: Uint8Array, value: number, offset: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

function writeUint64LE(buf: Uint8Array, value: bigint, offset: number): void {
  const lo = Number(value & 0xffffffffn);
  const hi = Number((value >> 32n) & 0xffffffffn);
  writeUint32LE(buf, lo, offset);
  writeUint32LE(buf, hi, offset + 4);
}

function writeVarint(buf: Uint8Array, n: number, offset: number): number {
  if (n < 0xfd) {
    buf[offset] = n;
    return 1;
  }
  if (n <= 0xffff) {
    buf[offset] = 0xfd;
    buf[offset + 1] = n & 0xff;
    buf[offset + 2] = (n >> 8) & 0xff;
    return 3;
  }
  throw new Error(`varint value too large: ${n}`);
}

function varintSize(n: number): number {
  if (n < 0xfd) return 1;
  if (n <= 0xffff) return 3;
  throw new Error(`varint value too large: ${n}`);
}

// ── BIP143 Sighash ──

function computeHashPrevouts(tx: Transaction): Uint8Array {
  // SHA256d of all outpoints (txid + vout) concatenated
  const buf = new Uint8Array(tx.inputs.length * 36);
  let offset = 0;
  for (const input of tx.inputs) {
    buf.set(input.txid, offset);
    offset += 32;
    writeUint32LE(buf, input.vout, offset);
    offset += 4;
  }
  return sha256d(buf);
}

function computeHashSequence(tx: Transaction): Uint8Array {
  // SHA256d of all sequence values concatenated
  const buf = new Uint8Array(tx.inputs.length * 4);
  let offset = 0;
  for (const input of tx.inputs) {
    writeUint32LE(buf, input.sequence, offset);
    offset += 4;
  }
  return sha256d(buf);
}

function computeHashOutputs(tx: Transaction): Uint8Array {
  // SHA256d of all outputs serialized
  let size = 0;
  for (const output of tx.outputs) {
    size += 8 + varintSize(output.scriptPubKey.length) + output.scriptPubKey.length;
  }
  const buf = new Uint8Array(size);
  let offset = 0;
  for (const output of tx.outputs) {
    writeUint64LE(buf, output.value, offset);
    offset += 8;
    offset += writeVarint(buf, output.scriptPubKey.length, offset);
    buf.set(output.scriptPubKey, offset);
    offset += output.scriptPubKey.length;
  }
  return sha256d(buf);
}

/**
 * BIP143 sighash for SegWit inputs (P2WSH, P2WPKH).
 *
 * The scriptCode for P2WSH is the witnessScript itself (NOT the P2WSH scriptPubKey).
 */
export function computeBIP143Sighash(
  tx: Transaction,
  inputIndex: number,
  witnessScript: Uint8Array,
  value: bigint,
  sighashType = 0x01,
): Uint8Array {
  return computeBIP143SighashVerbose(tx, inputIndex, witnessScript, value, sighashType).sighash;
}

/**
 * BIP143 sighash with all intermediate values exposed for educational display.
 */
export function computeBIP143SighashVerbose(
  tx: Transaction,
  inputIndex: number,
  witnessScript: Uint8Array,
  value: bigint,
  sighashType = 0x01,
): SighashDetail {
  if (sighashType !== 0x01) {
    throw new Error(
      `Only SIGHASH_ALL (0x01) is supported in this educational tool, got 0x${sighashType.toString(16)}`,
    );
  }
  if (!Number.isInteger(inputIndex) || inputIndex < 0 || inputIndex >= tx.inputs.length) {
    throw new RangeError(
      `inputIndex out of range: ${inputIndex} (tx has ${tx.inputs.length} inputs)`,
    );
  }

  const hashPrevouts = computeHashPrevouts(tx);
  const hashSequence = computeHashSequence(tx);
  const hashOutputs = computeHashOutputs(tx);

  const input = tx.inputs[inputIndex];

  // scriptCode = varint(witnessScript.length) + witnessScript
  const scriptCodeVarintLen = varintSize(witnessScript.length);
  const scriptCodeLen = scriptCodeVarintLen + witnessScript.length;

  // Preimage: version(4) + hashPrevouts(32) + hashSequence(32) + outpoint(36) +
  //           scriptCode(variable) + value(8) + nSequence(4) + hashOutputs(32) +
  //           nLocktime(4) + nHashType(4)
  const preimageSize = 4 + 32 + 32 + 36 + scriptCodeLen + 8 + 4 + 32 + 4 + 4;
  const preimage = new Uint8Array(preimageSize);
  let offset = 0;

  // 1. nVersion
  writeUint32LE(preimage, tx.version, offset);
  offset += 4;

  // 2. hashPrevouts
  preimage.set(hashPrevouts, offset);
  offset += 32;

  // 3. hashSequence
  preimage.set(hashSequence, offset);
  offset += 32;

  // 4. outpoint (txid + vout of the input being signed)
  preimage.set(input.txid, offset);
  offset += 32;
  writeUint32LE(preimage, input.vout, offset);
  offset += 4;

  // 5. scriptCode
  offset += writeVarint(preimage, witnessScript.length, offset);
  preimage.set(witnessScript, offset);
  offset += witnessScript.length;

  // 6. value of the output being spent
  writeUint64LE(preimage, value, offset);
  offset += 8;

  // 7. nSequence of the input being signed
  writeUint32LE(preimage, input.sequence, offset);
  offset += 4;

  // 8. hashOutputs
  preimage.set(hashOutputs, offset);
  offset += 32;

  // 9. nLocktime
  writeUint32LE(preimage, tx.locktime, offset);
  offset += 4;

  // 10. nHashType
  writeUint32LE(preimage, sighashType, offset);

  const sighash = sha256d(preimage);

  return { hashPrevouts, hashSequence, hashOutputs, preimage, sighash };
}

// ── Legacy Sighash (pre-SegWit) ──

/**
 * Compute the legacy sighash for a P2PKH input (SIGHASH_ALL only).
 *
 * Algorithm: clone the transaction, replace all scriptSigs with empty,
 * set the signing input's scriptSig to the subscript (the UTXO's scriptPubKey),
 * serialize, append the sighash type as a 4-byte LE uint32, then SHA-256d.
 */
export function computeLegacySighash(
  tx: Transaction,
  inputIndex: number,
  subscript: Uint8Array,
  sighashType = 0x01,
): Uint8Array {
  if (!Number.isInteger(inputIndex) || inputIndex < 0 || inputIndex >= tx.inputs.length) {
    throw new RangeError(
      `inputIndex out of range: ${inputIndex} (tx has ${tx.inputs.length} inputs)`,
    );
  }

  const modifiedInputs = tx.inputs.map((input, i) => ({
    ...input,
    scriptSig: i === inputIndex ? subscript : new Uint8Array(0),
  }));

  const modifiedTx = { ...tx, inputs: modifiedInputs };
  const serialized = serializeTransaction(modifiedTx);

  const preimage = new Uint8Array(serialized.length + 4);
  preimage.set(serialized);
  writeUint32LE(preimage, sighashType, serialized.length);

  return sha256d(preimage);
}
