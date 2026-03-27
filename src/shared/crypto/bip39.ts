import {
  generateMnemonic as _generateMnemonic,
  mnemonicToSeed as _mnemonicToSeed,
  validateMnemonic as _validateMnemonic,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

export function generateMnemonic(wordCount: 12 | 24 = 12): string {
  return _generateMnemonic(wordlist, wordCount === 24 ? 256 : 128);
}

export function mnemonicToSeed(mnemonic: string, passphrase = ""): Promise<Uint8Array> {
  return _mnemonicToSeed(mnemonic, passphrase);
}

export function validateMnemonic(mnemonic: string): boolean {
  return _validateMnemonic(mnemonic, wordlist);
}
