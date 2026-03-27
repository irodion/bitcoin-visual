import { bech32 } from "@scure/base";
import { sha256, hash160 } from "./hash";
import { base58CheckEncode } from "./address";
import type { Network } from "./types";

const OP_CHECKMULTISIG = 0xae;

export function createMultisigRedeemScript(pubKeys: Uint8Array[], m: number): Uint8Array {
  const n = pubKeys.length;
  if (m < 1 || m > n) {
    throw new Error(`Invalid m=${m}: must be between 1 and n=${n}`);
  }
  if (n > 16) {
    throw new Error(`Too many pubkeys: ${n} (max 16)`);
  }

  // BIP67: sort pubkeys lexicographically
  const sorted = [...pubKeys].sort((a, b) => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  });

  // Calculate total script length
  // OP_M + (1 pushdata byte + pubkey bytes) per key + OP_N + OP_CHECKMULTISIG
  let size = 1; // OP_M
  for (const pk of sorted) {
    size += 1 + pk.length; // length byte + pubkey
  }
  size += 1; // OP_N
  size += 1; // OP_CHECKMULTISIG

  const script = new Uint8Array(size);
  let offset = 0;

  script[offset++] = 0x50 + m; // OP_M
  for (const pk of sorted) {
    script[offset++] = pk.length; // push data length
    script.set(pk, offset);
    offset += pk.length;
  }
  script[offset++] = 0x50 + n; // OP_N
  script[offset++] = OP_CHECKMULTISIG;

  return script;
}

export function redeemScriptToP2SHAddress(
  redeemScript: Uint8Array,
  network: Network = "mainnet",
): string {
  const h = hash160(redeemScript);
  const version = network === "mainnet" ? 0x05 : 0xc4;
  const payload = new Uint8Array(21);
  payload[0] = version;
  payload.set(h, 1);
  return base58CheckEncode(payload);
}

export function redeemScriptToP2WSHAddress(
  redeemScript: Uint8Array,
  network: Network = "mainnet",
): string {
  const h = sha256(redeemScript); // P2WSH uses SHA-256, not HASH160
  const prefix = network === "mainnet" ? "bc" : "tb";
  const words = [0, ...bech32.toWords(h)];
  return bech32.encode(prefix, words);
}
