import { base58check, bech32 } from "@scure/base";
import { sha256, hash160 } from "./hash";
import type { Network } from "./types";

const b58c = base58check(sha256);

export function base58CheckEncode(payload: Uint8Array): string {
  return b58c.encode(payload);
}

export function base58CheckDecode(str: string): Uint8Array {
  return b58c.decode(str);
}

export function publicKeyToP2PKHAddress(pubKey: Uint8Array, network: Network = "mainnet"): string {
  const h = hash160(pubKey);
  const version = network === "mainnet" ? 0x00 : 0x6f;
  const payload = new Uint8Array(21);
  payload[0] = version;
  payload.set(h, 1);
  return base58CheckEncode(payload);
}

export function publicKeyToP2WPKHAddress(pubKey: Uint8Array, network: Network = "mainnet"): string {
  // BIP141: P2WPKH is only defined for compressed (33-byte) public keys
  if (pubKey.length !== 33) {
    throw new Error(`P2WPKH requires a compressed public key (33 bytes), got ${pubKey.length}`);
  }
  const h = hash160(pubKey);
  const prefix = network === "mainnet" ? "bc" : "tb";
  const words = [0, ...bech32.toWords(h)];
  return bech32.encode(prefix, words);
}
