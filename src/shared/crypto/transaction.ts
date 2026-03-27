export interface TxInput {
  txid: Uint8Array; // 32 bytes, internal byte order
  vout: number;
  scriptSig: Uint8Array;
  sequence: number;
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

export function serializeTransaction(tx: Transaction): Uint8Array {
  let size = 4;
  size += varintSize(tx.inputs.length);
  for (const input of tx.inputs) {
    size += 32;
    size += 4;
    size += varintSize(input.scriptSig.length);
    size += input.scriptSig.length;
    size += 4;
  }
  size += varintSize(tx.outputs.length);
  for (const output of tx.outputs) {
    size += 8;
    size += varintSize(output.scriptPubKey.length);
    size += output.scriptPubKey.length;
  }
  size += 4;

  const buf = new Uint8Array(size);
  let offset = 0;

  writeUint32LE(buf, tx.version, offset);
  offset += 4;

  offset += writeVarint(buf, tx.inputs.length, offset);
  for (const input of tx.inputs) {
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

  offset += writeVarint(buf, tx.outputs.length, offset);
  for (const output of tx.outputs) {
    writeUint64LE(buf, output.value, offset);
    offset += 8;
    offset += writeVarint(buf, output.scriptPubKey.length, offset);
    buf.set(output.scriptPubKey, offset);
    offset += output.scriptPubKey.length;
  }

  writeUint32LE(buf, tx.locktime, offset);

  return buf;
}
