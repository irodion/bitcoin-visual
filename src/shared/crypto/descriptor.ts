import { HDKey } from "@scure/bip32";
import { publicKeyToP2PKHAddress, publicKeyToP2WPKHAddress } from "./address";
import { hash160 } from "./hash";
import {
  createMultisigRedeemScript,
  redeemScriptToP2SHAddress,
  redeemScriptToP2WSHAddress,
} from "./multisig";

// ── Types ──

export type ScriptType = "pkh" | "wpkh" | "sh" | "wsh" | "multi" | "sortedmulti" | "tr";

export interface KeyOrigin {
  fingerprint: string;
  path: number[];
  hardenedFlags: boolean[];
}

export interface KeyExpression {
  origin: KeyOrigin | null;
  key: string;
  derivationSuffix: string | null;
  isRange: boolean;
}

export interface DescriptorNode {
  type: ScriptType;
  children: DescriptorNode[];
  keys: KeyExpression[];
  threshold: number | null;
}

export type SegmentKind =
  | "function"
  | "origin"
  | "fingerprint"
  | "originPath"
  | "key"
  | "suffix"
  | "checksum"
  | "separator"
  | "threshold";

export interface DescriptorSegmentInfo {
  text: string;
  start: number;
  end: number;
  kind: SegmentKind;
}

export interface ParsedDescriptor {
  root: DescriptorNode;
  raw: string;
  checksum: string | null;
  segments: DescriptorSegmentInfo[];
}

export interface ExpandedAddress {
  index: number;
  publicKey: Uint8Array;
  address: string;
  scriptType: string;
  isTaproot: boolean;
}

export interface DescriptorConfig {
  scriptType: "pkh" | "wpkh" | "sh-wpkh" | "wsh-multi" | "wsh-sortedmulti" | "tr";
  keys: Array<{ origin: KeyOrigin | null; key: string; derivationSuffix: string }>;
  threshold: number | null;
  chain: 0 | 1;
}

// ── Checksum (BIP-380) ──

const INPUT_CHARSET =
  "0123456789()[],'/*abcdefgh@:$%{}" +
  "IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~" +
  'ijklmnopqrstuvwxyzABCDEFGH`#"\\ ';

// Pre-built O(1) lookup for checksum computation instead of O(n) indexOf per char
const INPUT_CHARSET_MAP = new Map<string, number>();
for (let i = 0; i < INPUT_CHARSET.length; i++) {
  INPUT_CHARSET_MAP.set(INPUT_CHARSET[i], i);
}

const CHECKSUM_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function polymod(c: bigint, val: number): bigint {
  const c0 = c >> 35n;
  c = ((c & 0x7ffffffffn) << 5n) ^ BigInt(val);
  if (c0 & 1n) c ^= 0xf5dee51989n;
  if (c0 & 2n) c ^= 0xa9fdca3312n;
  if (c0 & 4n) c ^= 0x1bab10e32dn;
  if (c0 & 8n) c ^= 0x3706b1677an;
  if (c0 & 16n) c ^= 0x644d626ffdn;
  return c;
}

export function computeDescriptorChecksum(desc: string): string {
  let c = 1n;
  let cls = 0;
  let clsCount = 0;

  for (let i = 0; i < desc.length; i++) {
    const pos = INPUT_CHARSET_MAP.get(desc[i]);
    if (pos === undefined) {
      throw new Error(`Invalid character '${desc[i]}' at position ${i} in descriptor`);
    }
    c = polymod(c, pos & 31);
    cls = cls * 3 + (pos >> 5);
    clsCount++;
    if (clsCount === 3) {
      c = polymod(c, cls);
      cls = 0;
      clsCount = 0;
    }
  }

  if (clsCount > 0) {
    c = polymod(c, cls);
  }

  for (let i = 0; i < 8; i++) {
    c = polymod(c, 0);
  }

  c ^= 1n;

  let result = "";
  for (let i = 0; i < 8; i++) {
    result += CHECKSUM_CHARSET[Number((c >> BigInt(5 * (7 - i))) & 31n)];
  }

  return result;
}

export function validateDescriptorChecksum(fullStr: string): boolean {
  const hashIdx = fullStr.lastIndexOf("#");
  if (hashIdx === -1) return false;
  const desc = fullStr.slice(0, hashIdx);
  const checksum = fullStr.slice(hashIdx + 1);
  if (checksum.length !== 8) return false;
  return computeDescriptorChecksum(desc) === checksum;
}

// ── Recursive Descent Parser ──

interface ParserState {
  input: string;
  pos: number;
  segments: DescriptorSegmentInfo[];
}

function addSegment(state: ParserState, start: number, end: number, kind: SegmentKind): void {
  if (end > start) {
    state.segments.push({ text: state.input.slice(start, end), start, end, kind });
  }
}

function peek(state: ParserState): string {
  return state.input[state.pos] ?? "";
}

function consume(state: ParserState, expected?: string): string {
  const ch = state.input[state.pos];
  if (ch === undefined) {
    throw new Error(`Unexpected end of descriptor at position ${state.pos}`);
  }
  if (expected !== undefined && ch !== expected) {
    throw new Error(`Expected '${expected}' at position ${state.pos}, got '${ch}'`);
  }
  state.pos++;
  return ch;
}

const FUNCTION_NAMES: ScriptType[] = ["pkh", "wpkh", "sh", "wsh", "multi", "sortedmulti", "tr"];

function readFunctionName(state: ParserState): ScriptType {
  for (const name of FUNCTION_NAMES) {
    if (state.input.startsWith(name + "(", state.pos)) {
      return name;
    }
  }
  // Try to extract what's there for a better error message
  const remaining = state.input.slice(state.pos, state.pos + 20);
  const match = remaining.match(/^([a-zA-Z_]+)/);
  const found = match ? match[1] : remaining.slice(0, 10);
  throw new Error(`Unknown function '${found}' at position ${state.pos}`);
}

function parseKeyExpression(state: ParserState): KeyExpression {
  let origin: KeyOrigin | null = null;

  // Optional key origin: [fingerprint/path]
  if (peek(state) === "[") {
    const originStart = state.pos;
    consume(state, "[");

    // Fingerprint: 8 hex chars
    const fpStart = state.pos;
    let fingerprint = "";
    while (
      state.pos < state.input.length &&
      state.input[state.pos] !== "/" &&
      state.input[state.pos] !== "]"
    ) {
      fingerprint += state.input[state.pos];
      state.pos++;
    }
    addSegment(state, fpStart, state.pos, "fingerprint");

    const path: number[] = [];
    const hardenedFlags: boolean[] = [];

    // Path segments: /N' or /N
    while (peek(state) === "/") {
      addSegment(state, state.pos, state.pos + 1, "separator");
      state.pos++; // consume /
      const segStart = state.pos;
      let numStr = "";
      while (state.pos < state.input.length && /[0-9]/.test(state.input[state.pos])) {
        numStr += state.input[state.pos];
        state.pos++;
      }
      let hardened = false;
      if (peek(state) === "'" || peek(state) === "h") {
        hardened = true;
        state.pos++;
      }
      if (numStr.length === 0) {
        throw new Error(`Empty index in key origin path at position ${segStart}`);
      }
      const idx = parseInt(numStr, 10);
      if (!Number.isFinite(idx) || idx < 0) {
        throw new Error(`Invalid index '${numStr}' in key origin path at position ${segStart}`);
      }
      addSegment(state, segStart, state.pos, "originPath");
      path.push(idx);
      hardenedFlags.push(hardened);
    }

    consume(state, "]");
    addSegment(state, originStart, originStart + 1, "origin"); // [
    addSegment(state, state.pos - 1, state.pos, "origin"); // ]
    origin = { fingerprint, path, hardenedFlags };
  }

  // Key material: xpub.../xprv.../hex pubkey
  const keyStart = state.pos;
  // Read until we hit a delimiter: /, ), ,, #, or end
  while (
    state.pos < state.input.length &&
    state.input[state.pos] !== "/" &&
    state.input[state.pos] !== ")" &&
    state.input[state.pos] !== "," &&
    state.input[state.pos] !== "#"
  ) {
    state.pos++;
  }
  const key = state.input.slice(keyStart, state.pos);
  if (key.length === 0) {
    throw new Error(`Empty key expression at position ${keyStart}`);
  }
  addSegment(state, keyStart, state.pos, "key");

  // Optional derivation suffix: /0/* or /*
  let derivationSuffix: string | null = null;
  let isRange = false;
  if (peek(state) === "/") {
    const suffixStart = state.pos;
    let suffix = "";
    while (
      state.pos < state.input.length &&
      state.input[state.pos] !== ")" &&
      state.input[state.pos] !== "," &&
      state.input[state.pos] !== "#"
    ) {
      suffix += state.input[state.pos];
      state.pos++;
    }
    derivationSuffix = suffix;
    isRange = suffix.includes("*");
    addSegment(state, suffixStart, state.pos, "suffix");
  }

  return { origin, key, derivationSuffix, isRange };
}

function parseExpression(state: ParserState): DescriptorNode {
  const funcName = readFunctionName(state);
  const funcStart = state.pos;
  state.pos += funcName.length;
  addSegment(state, funcStart, state.pos, "function");

  // Consume (
  addSegment(state, state.pos, state.pos + 1, "separator");
  consume(state, "(");

  let node: DescriptorNode;

  if (funcName === "sh" || funcName === "wsh") {
    // Wrapping function: recurse into child expression
    const child = parseExpression(state);
    node = { type: funcName, children: [child], keys: [], threshold: null };
  } else if (funcName === "multi" || funcName === "sortedmulti") {
    // Multi: threshold, key1, key2, ...
    const threshStart = state.pos;
    let threshStr = "";
    while (state.pos < state.input.length && /[0-9]/.test(state.input[state.pos])) {
      threshStr += state.input[state.pos];
      state.pos++;
    }
    if (threshStr.length === 0) {
      throw new Error(`Missing threshold in ${funcName}() at position ${threshStart}`);
    }
    const threshold = parseInt(threshStr, 10);
    if (!Number.isFinite(threshold) || threshold < 1) {
      throw new Error(
        `Invalid threshold '${threshStr}' in ${funcName}() at position ${threshStart}`,
      );
    }
    addSegment(state, threshStart, state.pos, "threshold");

    const keys: KeyExpression[] = [];
    while (peek(state) === ",") {
      addSegment(state, state.pos, state.pos + 1, "separator");
      state.pos++; // consume ,
      keys.push(parseKeyExpression(state));
    }

    node = { type: funcName, children: [], keys, threshold };
  } else {
    // Single-key function: pkh, wpkh, tr
    const keyExpr = parseKeyExpression(state);
    node = { type: funcName, children: [], keys: [keyExpr], threshold: null };
  }

  // Consume )
  addSegment(state, state.pos, state.pos + 1, "separator");
  consume(state, ")");

  return node;
}

export function parseDescriptor(str: string): ParsedDescriptor {
  const trimmed = str.trim();
  if (trimmed.length === 0) {
    throw new Error("Empty descriptor");
  }

  // Separate checksum if present
  let raw = trimmed;
  let checksum: string | null = null;
  const hashIdx = trimmed.lastIndexOf("#");
  if (hashIdx !== -1) {
    raw = trimmed.slice(0, hashIdx);
    checksum = trimmed.slice(hashIdx + 1);
    if (checksum.length !== 8) {
      throw new Error(`Invalid checksum length: expected 8 characters, got ${checksum.length}`);
    }
    // Validate checksum
    const expected = computeDescriptorChecksum(raw);
    if (checksum !== expected) {
      throw new Error(`Invalid checksum: expected '${expected}', got '${checksum}'`);
    }
  }

  const state: ParserState = { input: raw, pos: 0, segments: [] };
  const root = parseExpression(state);

  if (state.pos < raw.length) {
    throw new Error(`Unexpected characters after position ${state.pos}: '${raw.slice(state.pos)}'`);
  }

  // Add checksum segment if present
  if (checksum !== null) {
    const checksumStart = hashIdx;
    state.segments.push({
      text: "#",
      start: checksumStart,
      end: checksumStart + 1,
      kind: "separator",
    });
    state.segments.push({
      text: checksum,
      start: checksumStart + 1,
      end: checksumStart + 9,
      kind: "checksum",
    });
  }

  // Sort segments by start position
  state.segments.sort((a, b) => a.start - b.start);

  return { root, raw, checksum, segments: state.segments };
}

// ── Descriptor Expansion ──

function findRangeKey(node: DescriptorNode): KeyExpression | null {
  for (const key of node.keys) {
    if (key.isRange) return key;
  }
  for (const child of node.children) {
    const found = findRangeKey(child);
    if (found) return found;
  }
  return null;
}

function findAllKeys(node: DescriptorNode): KeyExpression[] {
  const keys: KeyExpression[] = [...node.keys];
  for (const child of node.children) {
    keys.push(...findAllKeys(child));
  }
  return keys;
}

export function findFirstKey(node: DescriptorNode): KeyExpression | null {
  if (node.keys.length > 0) return node.keys[0];
  for (const child of node.children) {
    const found = findFirstKey(child);
    if (found) return found;
  }
  return null;
}

function getOutermostType(node: DescriptorNode): string {
  if (node.type === "sh" && node.children.length > 0) {
    return "sh-" + node.children[0].type;
  }
  if (node.type === "wsh" && node.children.length > 0) {
    return "wsh-" + node.children[0].type;
  }
  return node.type;
}

function parseSuffix(suffix: string | null): { chain: number | null; hasWildcard: boolean } {
  if (!suffix) return { chain: null, hasWildcard: false };
  const parts = suffix.split("/").filter(Boolean);
  const hasWildcard = parts.includes("*");
  if (parts.length === 2 && hasWildcard) {
    // /N/*
    const chain = parseInt(parts[0], 10);
    return { chain: isNaN(chain) ? null : chain, hasWildcard: true };
  }
  if (parts.length === 1 && hasWildcard) {
    // /*
    return { chain: null, hasWildcard: true };
  }
  return { chain: null, hasWildcard };
}

const COMPRESSED_HEX_RE = /^0[23][0-9a-fA-F]{64}$/;

function isCompressedHexPubkey(key: string): boolean {
  return COMPRESSED_HEX_RE.test(key);
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function resolveHDKey(keyExpr: KeyExpression, cache: Map<string, HDKey>): HDKey {
  let hdkey = cache.get(keyExpr.key);
  if (!hdkey) {
    hdkey = HDKey.fromExtendedKey(keyExpr.key);
    cache.set(keyExpr.key, hdkey);
  }
  return hdkey;
}

function deriveKeyAtIndex(
  keyExpr: KeyExpression,
  index: number,
  cache: Map<string, HDKey>,
): Uint8Array {
  if (isCompressedHexPubkey(keyExpr.key)) {
    if (keyExpr.isRange) {
      throw new Error("Cannot derive child keys from a raw hex public key — use an xpub instead");
    }
    return hexToUint8Array(keyExpr.key);
  }

  const hdkey = resolveHDKey(keyExpr, cache);
  const { chain, hasWildcard } = parseSuffix(keyExpr.derivationSuffix);

  if (!hasWildcard) {
    const pubKey = hdkey.publicKey;
    if (!pubKey) throw new Error("Key has no public key");
    return pubKey;
  }

  let derived: HDKey;
  if (chain !== null) {
    derived = hdkey.deriveChild(chain).deriveChild(index);
  } else {
    derived = hdkey.deriveChild(index);
  }

  const pubKey = derived.publicKey;
  if (!pubKey) throw new Error("Derived key has no public key");
  return pubKey;
}

function generateAddressForType(
  node: DescriptorNode,
  pubKeys: Uint8Array[],
): { address: string; isTaproot: boolean } {
  const composedType = getOutermostType(node);

  switch (composedType) {
    case "pkh":
      return { address: publicKeyToP2PKHAddress(pubKeys[0]), isTaproot: false };

    case "wpkh":
      return { address: publicKeyToP2WPKHAddress(pubKeys[0]), isTaproot: false };

    case "sh-wpkh": {
      // P2SH-P2WPKH: the redeemScript is 0x0014 + hash160(pubkey)
      const h = hash160(pubKeys[0]);
      const witnessProgram = new Uint8Array(22);
      witnessProgram[0] = 0x00; // OP_0
      witnessProgram[1] = 0x14; // push 20 bytes
      witnessProgram.set(h, 2);
      return { address: redeemScriptToP2SHAddress(witnessProgram), isTaproot: false };
    }

    case "wsh-multi":
    case "wsh-sortedmulti": {
      const innerNode = node.children[0];
      const threshold = innerNode.threshold;
      if (threshold === null) throw new Error("Multi descriptor missing threshold");
      const redeemScript = createMultisigRedeemScript(pubKeys, threshold);
      return { address: redeemScriptToP2WSHAddress(redeemScript), isTaproot: false };
    }

    case "tr":
      return { address: "(Taproot — P2TR address generation coming soon)", isTaproot: true };

    default:
      throw new Error(`Unsupported descriptor type for expansion: ${composedType}`);
  }
}

export function expandDescriptor(
  parsed: ParsedDescriptor,
  startIndex: number,
  count: number,
): ExpandedAddress[] {
  const composedType = getOutermostType(parsed.root);
  const allKeys = findAllKeys(parsed.root);
  const rangeKey = findRangeKey(parsed.root);

  if (!rangeKey && allKeys.length === 0) {
    throw new Error("No keys found in descriptor");
  }

  // Cache parsed HDKey instances to avoid redundant base58check decoding per iteration
  const hdKeyCache = new Map<string, HDKey>();
  const results: ExpandedAddress[] = [];

  for (let i = startIndex; i < startIndex + count; i++) {
    if (composedType === "wsh-multi" || composedType === "wsh-sortedmulti") {
      const innerNode = parsed.root.children[0];
      const derivedPubKeys = innerNode.keys.map((k) =>
        k.isRange ? deriveKeyAtIndex(k, i, hdKeyCache) : deriveFromKey(k, hdKeyCache),
      );
      const { address, isTaproot } = generateAddressForType(parsed.root, derivedPubKeys);
      results.push({
        index: i,
        publicKey: derivedPubKeys[0],
        address,
        scriptType: composedType,
        isTaproot,
      });
    } else {
      const keyExpr = rangeKey ?? allKeys[0];
      const pubKey = keyExpr.isRange
        ? deriveKeyAtIndex(keyExpr, i, hdKeyCache)
        : deriveFromKey(keyExpr, hdKeyCache);
      const { address, isTaproot } = generateAddressForType(parsed.root, [pubKey]);
      results.push({ index: i, publicKey: pubKey, address, scriptType: composedType, isTaproot });
    }
  }

  return results;
}

function deriveFromKey(keyExpr: KeyExpression, cache: Map<string, HDKey>): Uint8Array {
  if (isCompressedHexPubkey(keyExpr.key)) {
    if (keyExpr.isRange) {
      throw new Error("Cannot derive child keys from a raw hex public key — use an xpub instead");
    }
    return hexToUint8Array(keyExpr.key);
  }

  const hdkey = resolveHDKey(keyExpr, cache);
  const pubKey = hdkey.publicKey;
  if (!pubKey) throw new Error("Key has no public key");

  if (keyExpr.derivationSuffix) {
    const parts = keyExpr.derivationSuffix.split("/").filter(Boolean);
    let current = hdkey;
    for (const part of parts) {
      if (part === "*") continue;
      current = current.deriveChild(parseInt(part, 10));
    }
    const derived = current.publicKey;
    if (!derived) throw new Error("Derived key has no public key");
    return derived;
  }

  return pubKey;
}

// ── Descriptor Builder ──

function formatKeyOrigin(origin: KeyOrigin): string {
  let result = `[${origin.fingerprint}`;
  for (let i = 0; i < origin.path.length; i++) {
    result += `/${origin.path[i]}`;
    if (origin.hardenedFlags[i]) result += "'";
  }
  result += "]";
  return result;
}

function formatKeyExpression(key: {
  origin: KeyOrigin | null;
  key: string;
  derivationSuffix: string;
}): string {
  let result = "";
  if (key.origin) result += formatKeyOrigin(key.origin);
  result += key.key;
  if (key.derivationSuffix) result += key.derivationSuffix;
  return result;
}

export function buildDescriptor(config: DescriptorConfig): string {
  let desc: string;

  switch (config.scriptType) {
    case "pkh":
      desc = `pkh(${formatKeyExpression(config.keys[0])})`;
      break;
    case "wpkh":
      desc = `wpkh(${formatKeyExpression(config.keys[0])})`;
      break;
    case "sh-wpkh":
      desc = `sh(wpkh(${formatKeyExpression(config.keys[0])}))`;
      break;
    case "wsh-multi": {
      const keys = config.keys.map(formatKeyExpression).join(",");
      desc = `wsh(multi(${config.threshold},${keys}))`;
      break;
    }
    case "wsh-sortedmulti": {
      const keys = config.keys.map(formatKeyExpression).join(",");
      desc = `wsh(sortedmulti(${config.threshold},${keys}))`;
      break;
    }
    case "tr":
      desc = `tr(${formatKeyExpression(config.keys[0])})`;
      break;
    default:
      throw new Error(`Unsupported script type: ${config.scriptType as string}`);
  }

  const checksum = computeDescriptorChecksum(desc);
  return `${desc}#${checksum}`;
}
