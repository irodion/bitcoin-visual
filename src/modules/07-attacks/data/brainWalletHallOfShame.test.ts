import { describe, it, expect } from "vite-plus/test";
import { sha256 } from "../../../shared/crypto/hash.ts";
import { privateKeyToPublicKey, isValidPrivateKey } from "../../../shared/crypto/keys.ts";
import { publicKeyToP2PKHAddress } from "../../../shared/crypto/address.ts";
import { BRAIN_WALLET_HALL_OF_SHAME } from "./brainWalletHallOfShame.ts";

const encoder = new TextEncoder();

describe("brainWalletHallOfShame data", () => {
  it("each address matches SHA-256 derivation of the passphrase", () => {
    for (const entry of BRAIN_WALLET_HALL_OF_SHAME) {
      const privKey = sha256(encoder.encode(entry.passphrase));
      expect(isValidPrivateKey(privKey)).toBe(true);
      const pubKey = privateKeyToPublicKey(privKey, true);
      const address = publicKeyToP2PKHAddress(pubKey, "mainnet");
      expect(address).toBe(entry.address);
    }
  });
});
