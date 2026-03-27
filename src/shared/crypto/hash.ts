import { sha256 as _sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 as _ripemd160 } from "@noble/hashes/legacy.js";

export function sha256(input: Uint8Array): Uint8Array {
  return _sha256(input);
}

export function sha256d(input: Uint8Array): Uint8Array {
  return _sha256(_sha256(input));
}

export function ripemd160(input: Uint8Array): Uint8Array {
  return _ripemd160(input);
}

export function hash160(input: Uint8Array): Uint8Array {
  return _ripemd160(_sha256(input));
}
