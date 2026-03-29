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

export function mapTransactionSegments(tx: Transaction, isSegWit: boolean): TxSegment[] {
  const segments: TxSegment[] = [];
  let offset = 0;

  // Version
  segments.push({
    label: "Version",
    byteRange: `bytes ${offset}–${offset + 3}`,
    startByte: offset,
    endByte: offset + 4,
    color: "text-yellow-400",
    description: `Transaction version (${tx.version})`,
  });
  offset += 4;

  if (isSegWit) {
    // Marker
    segments.push({
      label: "Marker",
      byteRange: `byte ${offset}`,
      startByte: offset,
      endByte: offset + 1,
      color: "text-purple-400",
      description: "SegWit marker byte (0x00) — signals witness data follows",
    });
    offset += 1;

    // Flag
    segments.push({
      label: "Flag",
      byteRange: `byte ${offset}`,
      startByte: offset,
      endByte: offset + 1,
      color: "text-purple-400",
      description: "SegWit flag byte (0x01)",
    });
    offset += 1;
  }

  // Input count
  const vinCountSize = varintSize(tx.inputs.length);
  segments.push({
    label: "Input Count",
    byteRange: `byte${vinCountSize > 1 ? "s" : ""} ${offset}${vinCountSize > 1 ? `–${offset + vinCountSize - 1}` : ""}`,
    startByte: offset,
    endByte: offset + vinCountSize,
    color: "text-blue-400",
    description: `Number of inputs: ${tx.inputs.length}`,
  });
  offset += vinCountSize;

  // Each input
  for (let i = 0; i < tx.inputs.length; i++) {
    const input = tx.inputs[i];
    const inputStart = offset;

    // txid (32) + vout (4) + scriptSig varint + scriptSig + sequence (4)
    const scriptSigVarintSize = varintSize(input.scriptSig.length);
    const inputSize = 32 + 4 + scriptSigVarintSize + input.scriptSig.length + 4;

    segments.push({
      label: `Input ${i}`,
      byteRange: `bytes ${inputStart}–${inputStart + inputSize - 1}`,
      startByte: inputStart,
      endByte: inputStart + inputSize,
      color: "text-blue-400",
      description: `Input ${i}: prev txid (32B) + vout (4B) + scriptSig (${input.scriptSig.length}B) + sequence (4B)`,
    });
    offset += inputSize;
  }

  // Output count
  const voutCountSize = varintSize(tx.outputs.length);
  segments.push({
    label: "Output Count",
    byteRange: `byte${voutCountSize > 1 ? "s" : ""} ${offset}${voutCountSize > 1 ? `–${offset + voutCountSize - 1}` : ""}`,
    startByte: offset,
    endByte: offset + voutCountSize,
    color: "text-green-400",
    description: `Number of outputs: ${tx.outputs.length}`,
  });
  offset += voutCountSize;

  // Each output
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];
    const outputStart = offset;

    const scriptVarintSize = varintSize(output.scriptPubKey.length);
    const outputSize = 8 + scriptVarintSize + output.scriptPubKey.length;

    segments.push({
      label: `Output ${i}`,
      byteRange: `bytes ${outputStart}–${outputStart + outputSize - 1}`,
      startByte: outputStart,
      endByte: outputStart + outputSize,
      color: "text-green-400",
      description: `Output ${i}: value (8B) + scriptPubKey (${output.scriptPubKey.length}B)`,
    });
    offset += outputSize;
  }

  // Witness data (SegWit only)
  if (isSegWit) {
    for (let i = 0; i < tx.inputs.length; i++) {
      const items = tx.inputs[i].witness ?? [];
      const witnessStart = offset;

      let witnessSize = varintSize(items.length);
      for (const item of items) {
        witnessSize += varintSize(item.length) + item.length;
      }

      segments.push({
        label: `Witness ${i}`,
        byteRange: `bytes ${witnessStart}–${witnessStart + witnessSize - 1}`,
        startByte: witnessStart,
        endByte: witnessStart + witnessSize,
        color: "text-purple-300",
        description: `Witness for input ${i}: ${items.length} stack item(s)`,
      });
      offset += witnessSize;
    }
  }

  // Locktime
  segments.push({
    label: "Locktime",
    byteRange: `bytes ${offset}–${offset + 3}`,
    startByte: offset,
    endByte: offset + 4,
    color: "text-gray-400",
    description: `Lock time: ${tx.locktime}`,
  });

  return segments;
}
