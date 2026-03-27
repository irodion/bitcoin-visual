import { HDKey, HARDENED_OFFSET } from "@scure/bip32";

export { HARDENED_OFFSET };

export function seedToMasterKey(seed: Uint8Array): HDKey {
  return HDKey.fromMasterSeed(seed);
}

export function deriveChild(parent: HDKey, index: number, hardened = false): HDKey {
  return parent.deriveChild(hardened ? index + HARDENED_OFFSET : index);
}

export function hdKeyToXPub(key: HDKey): string {
  return key.publicExtendedKey;
}

export function hdKeyToXPrv(key: HDKey): string {
  return key.privateExtendedKey;
}
