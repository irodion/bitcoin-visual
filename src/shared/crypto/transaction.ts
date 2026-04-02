import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256d } from "./hash";

export interface TxInput {
  txid: Uint8Array; // 32 bytes, internal byte order
  vout: number;
  scriptSig: Uint8Array;
  sequence: number;
  witness?: Uint8Array[]; // witness stack items (empty for legacy)
}

export interface TxOutput {
  value: bigint; // satoshis
  scriptPubKey: Uint8Array;
}

export interface Transaction {
  version: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  locktime: number;
}

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

function varintSize(n: number): number {
  if (n < 0xfd) return 1;
  if (n <= 0xffff) return 3;
  if (n <= 0xffffffff) return 5;
  throw new Error(`varint value too large: ${n}`);
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
  if (n <= 0xffffffff) {
    buf[offset] = 0xfe;
    writeUint32LE(buf, n, offset + 1);
    return 5;
  }
  throw new Error(`varint value too large: ${n}`);
}

function inputsSize(inputs: TxInput[]): number {
  let s = varintSize(inputs.length);
  for (const input of inputs) {
    s += 32 + 4 + varintSize(input.scriptSig.length) + input.scriptSig.length + 4;
  }
  return s;
}

function outputsSize(outputs: TxOutput[]): number {
  let s = varintSize(outputs.length);
  for (const output of outputs) {
    s += 8 + varintSize(output.scriptPubKey.length) + output.scriptPubKey.length;
  }
  return s;
}

function writeInputs(buf: Uint8Array, inputs: TxInput[], offset: number): number {
  offset += writeVarint(buf, inputs.length, offset);
  for (const input of inputs) {
    buf.set(input.txid, offset);
    offset += 32;
    writeUint32LE(buf, input.vout, offset);
    offset += 4;
    offset += writeVarint(buf, input.scriptSig.length, offset);
    buf.set(input.scriptSig, offset);
    offset += input.scriptSig.length;
    writeUint32LE(buf, input.sequence, offset);
    offset += 4;
  }
  return offset;
}

function writeOutputs(buf: Uint8Array, outputs: TxOutput[], offset: number): number {
  offset += writeVarint(buf, outputs.length, offset);
  for (const output of outputs) {
    writeUint64LE(buf, output.value, offset);
    offset += 8;
    offset += writeVarint(buf, output.scriptPubKey.length, offset);
    buf.set(output.scriptPubKey, offset);
    offset += output.scriptPubKey.length;
  }
  return offset;
}

export function serializeTransaction(tx: Transaction): Uint8Array {
  const size = 4 + inputsSize(tx.inputs) + outputsSize(tx.outputs) + 4;
  const buf = new Uint8Array(size);
  let offset = 0;

  writeUint32LE(buf, tx.version, offset);
  offset += 4;
  offset = writeInputs(buf, tx.inputs, offset);
  offset = writeOutputs(buf, tx.outputs, offset);
  writeUint32LE(buf, tx.locktime, offset);

  return buf;
}

// ── Script Builders ──

export function buildP2PKHScript(pubKeyHash: Uint8Array): Uint8Array {
  // OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
  const script = new Uint8Array(25);
  script[0] = 0x76; // OP_DUP
  script[1] = 0xa9; // OP_HASH160
  script[2] = 0x14; // push 20 bytes
  script.set(pubKeyHash, 3);
  script[23] = 0x88; // OP_EQUALVERIFY
  script[24] = 0xac; // OP_CHECKSIG
  return script;
}

export function buildP2WPKHScript(pubKeyHash: Uint8Array): Uint8Array {
  // OP_0 <20 bytes>
  const script = new Uint8Array(22);
  script[0] = 0x00; // OP_0 (witness version 0)
  script[1] = 0x14; // push 20 bytes
  script.set(pubKeyHash, 2);
  return script;
}

export function buildP2SHScript(scriptHash: Uint8Array): Uint8Array {
  if (scriptHash.length !== 20) {
    throw new Error(`buildP2SHScript: expected 20-byte script hash, got ${scriptHash.length}`);
  }
  const script = new Uint8Array(23);
  script[0] = 0xa9; // OP_HASH160
  script[1] = 0x14; // push 20 bytes
  script.set(scriptHash, 2);
  script[22] = 0x87; // OP_EQUAL
  return script;
}

export function buildP2WSHScript(witnessScriptHash: Uint8Array): Uint8Array {
  if (witnessScriptHash.length !== 32) {
    throw new Error(
      `buildP2WSHScript: expected 32-byte witness script hash, got ${witnessScriptHash.length}`,
    );
  }
  const script = new Uint8Array(34);
  script[0] = 0x00; // OP_0 (witness version 0)
  script[1] = 0x20; // push 32 bytes
  script.set(witnessScriptHash, 2);
  return script;
}

export function buildP2PKHScriptSig(signature: Uint8Array, pubKey: Uint8Array): Uint8Array {
  // <sigLen> <sig> <pubKeyLen> <pubKey>
  const buf = new Uint8Array(1 + signature.length + 1 + pubKey.length);
  buf[0] = signature.length;
  buf.set(signature, 1);
  buf[1 + signature.length] = pubKey.length;
  buf.set(pubKey, 1 + signature.length + 1);
  return buf;
}

// ── SegWit Serialization (BIP144) ──

export function serializeWitnessTransaction(tx: Transaction): Uint8Array {
  let witnessSize = 0;
  for (const input of tx.inputs) {
    const items = input.witness ?? [];
    witnessSize += varintSize(items.length);
    for (const item of items) {
      witnessSize += varintSize(item.length) + item.length;
    }
  }

  // version(4) + marker(1) + flag(1) + inputs + outputs + witness + locktime(4)
  const size = 4 + 1 + 1 + inputsSize(tx.inputs) + outputsSize(tx.outputs) + witnessSize + 4;
  const buf = new Uint8Array(size);
  let offset = 0;

  writeUint32LE(buf, tx.version, offset);
  offset += 4;

  buf[offset] = 0x00; // marker
  offset += 1;
  buf[offset] = 0x01; // flag
  offset += 1;

  offset = writeInputs(buf, tx.inputs, offset);
  offset = writeOutputs(buf, tx.outputs, offset);

  for (const input of tx.inputs) {
    const items = input.witness ?? [];
    offset += writeVarint(buf, items.length, offset);
    for (const item of items) {
      offset += writeVarint(buf, item.length, offset);
      buf.set(item, offset);
      offset += item.length;
    }
  }

  writeUint32LE(buf, tx.locktime, offset);

  return buf;
}

// ── TXID Helpers ──

export function reverseBytes(bytes: Uint8Array): Uint8Array {
  const reversed = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    reversed[i] = bytes[bytes.length - 1 - i];
  }
  return reversed;
}

export function computeTxID(tx: Transaction): Uint8Array {
  // TXID is always sha256d of the legacy (non-witness) serialization
  return sha256d(serializeTransaction(tx));
}

export function computeWTxID(tx: Transaction): Uint8Array {
  return sha256d(serializeWitnessTransaction(tx));
}

// ── Hex Segment Mapping ──

export interface TxSegment {
  label: string;
  byteRange: string;
  startByte: number;
  endByte: number;
  color: string;
  description: string;
}

// ── Segment Description Helpers (not exported) ──

const SEG_COLOR = {
  version: "text-yellow-400",
  segwit: "text-purple-400",
  count: "text-blue-400",
  prevTxid: "text-indigo-400",
  vout: "text-sky-300",
  meta: "text-slate-400",
  unlock: "text-emerald-400",
  outputCount: "text-green-400",
  value: "text-amber-400",
  lock: "text-orange-400",
  witnessPubkey: "text-teal-400",
  locktime: "text-gray-400",
} as const;

function byteRangeLabel(start: number, size: number): string {
  if (size === 1) return `byte ${start}`;
  return `bytes ${start}–${start + size - 1}`;
}

function formatSatsDescription(value: bigint): string {
  const sats = value.toLocaleString("en-US");
  const whole = value / 100_000_000n;
  const frac = value % 100_000_000n;
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "") || "0";
  return `${sats} sats (${whole}.${fracStr} BTC)`;
}

function formatDisplayTxid(leBytes: Uint8Array): string {
  const hex = bytesToHex(reverseBytes(leBytes));
  if (hex.length > 16) return `${hex.slice(0, 8)}…${hex.slice(-8)}`;
  return hex;
}

function describeSequence(seq: number): string {
  const hex = (seq >>> 0).toString(16).padStart(8, "0");
  if (seq === 0xffffffff) return `0x${hex} — final, no replacement`;
  return `0x${hex} — enables RBF / timelocks`;
}

function describeScriptPubKey(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14) {
    return "OP_DUP OP_HASH160 <20-byte hash> OP_EQUALVERIFY OP_CHECKSIG (P2PKH)";
  }
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
    return "OP_0 <20-byte hash> (P2WPKH — native SegWit)";
  }
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) {
    return "OP_HASH160 <20-byte script hash> OP_EQUAL (P2SH)";
  }
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
    return "OP_0 <32-byte script hash> (P2WSH)";
  }
  return `Script (${script.length} bytes)`;
}

function describeScriptSig(script: Uint8Array): string {
  if (script.length === 0) return "Empty — SegWit moves unlocking data to witness";
  if (script.length > 2) {
    const sigLen = script[0];
    const remaining = script.length - 1 - sigLen;
    if (remaining > 1) {
      const pkLen = script[1 + sigLen];
      if (1 + sigLen + 1 + pkLen === script.length) {
        return `<${sigLen}-byte DER signature> <${pkLen}-byte compressed pubkey> — proves ownership`;
      }
    }
  }
  return `Unlocking script (${script.length} bytes)`;
}

export function mapTransactionSegments(tx: Transaction, isSegWit: boolean): TxSegment[] {
  const segments: TxSegment[] = [];
  let offset = 0;

  function push(label: string, size: number, color: string, description: string): void {
    segments.push({
      label,
      byteRange: byteRangeLabel(offset, size),
      startByte: offset,
      endByte: offset + size,
      color,
      description,
    });
    offset += size;
  }

  push(
    "Version",
    4,
    SEG_COLOR.version,
    `Transaction version ${tx.version} — determines which validation rules apply (little-endian uint32)`,
  );

  if (isSegWit) {
    push("Marker", 1, SEG_COLOR.segwit, "SegWit marker byte (0x00) — signals witness data follows");
    push("Flag", 1, SEG_COLOR.segwit, "SegWit flag byte (0x01)");
  }

  push(
    "Input Count",
    varintSize(tx.inputs.length),
    SEG_COLOR.count,
    `${tx.inputs.length} input(s) — each references a prior UTXO to spend (CompactSize uint)`,
  );

  for (let i = 0; i < tx.inputs.length; i++) {
    const input = tx.inputs[i];

    push(
      `Input ${i} → Prev TxID`,
      32,
      SEG_COLOR.prevTxid,
      `${formatDisplayTxid(input.txid)} — which prior transaction's output is being spent`,
    );
    push(
      `Input ${i} → Vout`,
      4,
      SEG_COLOR.vout,
      `Output index: ${input.vout} — which output within that transaction (little-endian uint32)`,
    );

    const ssVarLen = varintSize(input.scriptSig.length);
    push(
      `Input ${i} → ScriptSig Length`,
      ssVarLen,
      SEG_COLOR.meta,
      input.scriptSig.length === 0
        ? "0 bytes — empty for SegWit, unlocking data is in witness"
        : `${input.scriptSig.length} bytes of unlocking script to follow`,
    );

    if (input.scriptSig.length > 0) {
      push(
        `Input ${i} → ScriptSig`,
        input.scriptSig.length,
        SEG_COLOR.unlock,
        describeScriptSig(input.scriptSig),
      );
    }

    push(`Input ${i} → Sequence`, 4, SEG_COLOR.meta, describeSequence(input.sequence));
  }

  push(
    "Output Count",
    varintSize(tx.outputs.length),
    SEG_COLOR.outputCount,
    `${tx.outputs.length} output(s) — each creates a new spendable UTXO (CompactSize uint)`,
  );

  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    push(
      `Output ${i} → Value`,
      8,
      SEG_COLOR.value,
      `${formatSatsDescription(output.value)} — amount locked in this output (little-endian uint64)`,
    );

    push(
      `Output ${i} → ScriptPubKey Length`,
      varintSize(output.scriptPubKey.length),
      SEG_COLOR.meta,
      `${output.scriptPubKey.length} bytes of locking script to follow`,
    );

    push(
      `Output ${i} → ScriptPubKey`,
      output.scriptPubKey.length,
      SEG_COLOR.lock,
      `${describeScriptPubKey(output.scriptPubKey)} — locking script: who can spend this output?`,
    );
  }

  if (isSegWit) {
    for (let i = 0; i < tx.inputs.length; i++) {
      const items = tx.inputs[i].witness ?? [];

      push(
        `Witness ${i} → Item Count`,
        varintSize(items.length),
        SEG_COLOR.meta,
        `${items.length} stack item(s) for input ${i}`,
      );

      for (let j = 0; j < items.length; j++) {
        const item = items[j];

        push(
          `Witness ${i} → Item ${j} Length`,
          varintSize(item.length),
          SEG_COLOR.meta,
          `${item.length} bytes`,
        );

        const itemLabel = j === 0 ? "Signature" : j === 1 ? "PubKey" : `Item ${j}`;
        const itemDesc =
          j === 0
            ? `DER-encoded ECDSA signature (${item.length}B) — proves private key ownership`
            : j === 1
              ? `Compressed public key (${item.length}B) — matches the pubkey hash in the UTXO being spent`
              : `Witness stack item (${item.length} bytes)`;

        push(
          `Witness ${i} → ${itemLabel}`,
          item.length,
          j === 1 ? SEG_COLOR.witnessPubkey : SEG_COLOR.unlock,
          itemDesc,
        );
      }
    }
  }

  const locktimeSuffix =
    tx.locktime === 0
      ? " — no time lock, spendable immediately"
      : tx.locktime < 500_000_000
        ? " — block height lock"
        : " — Unix timestamp lock";
  push(
    "Locktime",
    4,
    SEG_COLOR.locktime,
    `Lock time: ${tx.locktime}${locktimeSuffix} (little-endian uint32)`,
  );

  return segments;
}
