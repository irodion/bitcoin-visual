import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import type { HDKey } from "@scure/bip32";
import {
  generateMnemonic,
  mnemonicToSeed,
  validateMnemonic,
  seedToMasterKey,
  deriveChild,
  hdKeyToXPub,
  hdKeyToXPrv,
  publicKeyToP2WPKHAddress,
} from "../../shared/crypto/index.ts";

export interface PathSegment {
  index: number;
  hardened: boolean;
}

export interface AddressEntry {
  index: number;
  path: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  address: string;
}

export interface DerivedTree {
  pathNodes: Array<{ path: string; depth: number; isHardened: boolean }>;
  accountXpub: string;
  accountXprv: string;
  externalAddresses: AddressEntry[];
  changeAddresses: AddressEntry[];
}

export interface HDState {
  mnemonicText: string;
  setMnemonicText: (t: string) => void;
  passphrase: string;
  setPassphrase: (p: string) => void;
  wordCount: 12 | 24;
  setWordCount: (wc: 12 | 24) => void;
  generateNewMnemonic: () => void;
  generationKey: number;

  isValidMnemonic: boolean;
  words: Array<{ word: string; index: number }>;

  seed: Uint8Array | null;
  seedHex: string | null;
  isDerivingSeed: boolean;

  masterPrivateKey: Uint8Array | null;
  masterChainCode: Uint8Array | null;

  pathSegments: PathSegment[];
  updatePathSegment: (i: number, update: Partial<PathSegment>) => void;
  selectedSegmentIndex: number | null;
  setSelectedSegmentIndex: (i: number | null) => void;
  fullPathString: string;

  derivedTree: DerivedTree | null;

  privateKeysRevealed: boolean;
  setPrivateKeysRevealed: (r: boolean) => void;
}

const DEFAULT_PATH: PathSegment[] = [
  { index: 84, hardened: true },
  { index: 0, hardened: true },
  { index: 0, hardened: true },
  { index: 0, hardened: false },
  { index: 0, hardened: false },
];

const SEED_DEBOUNCE_MS = 300;

const wordMap = new Map(wordlist.map((w, i) => [w, i]));

function buildPathString(segments: PathSegment[]): string {
  return "m/" + segments.map((s) => `${s.index}${s.hardened ? "'" : ""}`).join("/");
}

function deriveAddresses(
  chainKey: HDKey,
  chainIndex: number,
  basePath: string,
  startIndex: number,
  count: number,
): AddressEntry[] {
  const entries: AddressEntry[] = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const child = deriveChild(chainKey, idx);
    if (!child.publicKey || !child.privateKey) {
      throw new Error(`deriveChild returned null key at index ${idx}`);
    }
    entries.push({
      index: idx,
      path: `${basePath}/${chainIndex}/${idx}`,
      publicKey: child.publicKey,
      privateKey: child.privateKey,
      address: publicKeyToP2WPKHAddress(child.publicKey),
    });
  }
  return entries;
}

export function useHDState(): HDState {
  const [mnemonicText, setMnemonicText] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [generationKey, setGenerationKey] = useState(0);
  const [pathSegments, setPathSegments] = useState<PathSegment[]>(DEFAULT_PATH);
  const [privateKeysRevealed, setPrivateKeysRevealed] = useState(false);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

  const [seed, setSeed] = useState<Uint8Array | null>(null);
  const [isDerivingSeed, setIsDerivingSeed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isValidMnemonic = useMemo(
    () => mnemonicText.trim() !== "" && validateMnemonic(mnemonicText.trim()),
    [mnemonicText],
  );

  const words = useMemo(() => {
    if (mnemonicText.trim() === "") return [];
    return mnemonicText
      .trim()
      .split(/\s+/)
      .map((word) => ({
        word,
        index: wordMap.get(word) ?? -1,
      }));
  }, [mnemonicText]);

  const generateNewMnemonic = useCallback(() => {
    const mnemonic = generateMnemonic(wordCount);
    setMnemonicText(mnemonic);
    setGenerationKey((k) => k + 1);
  }, [wordCount]);

  const updatePathSegment = useCallback((i: number, update: Partial<PathSegment>) => {
    setPathSegments((prev) => {
      const next = [...prev];
      const merged = { ...next[i], ...update };
      if (i === 3) {
        merged.index = merged.index === 1 ? 1 : 0;
        merged.hardened = false;
      } else if (i === 4) {
        const n = Number(merged.index);
        // Cap so startIndex + 5 addresses stays below hardened offset (0x80000000)
        merged.index = Number.isFinite(n) ? Math.min(Math.max(0, Math.floor(n)), 0x7ffffffb) : 0;
        merged.hardened = false;
      }
      next[i] = merged;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isValidMnemonic) {
      setSeed(null);
      setIsDerivingSeed(false);
      setPrivateKeysRevealed(false);
      return;
    }
    let cancelled = false;
    setSeed(null);
    setIsDerivingSeed(true);
    setPrivateKeysRevealed(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mnemonicToSeed(mnemonicText.trim(), passphrase).then(
        (s) => {
          if (!cancelled) {
            setSeed(s);
            setIsDerivingSeed(false);
          }
        },
        () => {
          if (!cancelled) {
            setSeed(null);
            setIsDerivingSeed(false);
          }
        },
      );
    }, SEED_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [mnemonicText, passphrase, isValidMnemonic]);

  const seedHex = useMemo(() => (seed ? bytesToHex(seed) : null), [seed]);

  const masterKey = useMemo<HDKey | null>(() => (seed ? seedToMasterKey(seed) : null), [seed]);

  const masterPrivateKey = masterKey?.privateKey ?? null;
  const masterChainCode = masterKey?.chainCode ?? null;

  const fullPathString = useMemo(() => buildPathString(pathSegments), [pathSegments]);

  const derivedTree = useMemo<DerivedTree | null>(() => {
    if (!masterKey) return null;

    const pathNodes: DerivedTree["pathNodes"] = [];
    let current = masterKey;
    let currentPath = "m";

    const accountSegments = pathSegments.slice(0, 3);
    for (const seg of accountSegments) {
      current = deriveChild(current, seg.index, seg.hardened);
      currentPath += `/${seg.index}${seg.hardened ? "'" : ""}`;
      pathNodes.push({
        path: currentPath,
        depth: pathNodes.length + 1,
        isHardened: seg.hardened,
      });
    }

    const accountKey = current;
    const accountPath = currentPath;
    const accountXpub = hdKeyToXPub(accountKey);
    const accountXprv = hdKeyToXPrv(accountKey);

    const changeIndex = pathSegments[3]?.index ?? 0;
    const startIndex = pathSegments[4]?.index ?? 0;
    const selectedChain = deriveChild(accountKey, changeIndex);
    const addresses = deriveAddresses(selectedChain, changeIndex, accountPath, startIndex, 5);

    // Also derive the other chain for the full tree view
    const otherIndex = changeIndex === 0 ? 1 : 0;
    const otherChain = deriveChild(accountKey, otherIndex);
    const otherAddresses = deriveAddresses(otherChain, otherIndex, accountPath, startIndex, 5);

    const externalAddresses = changeIndex === 0 ? addresses : otherAddresses;
    const changeAddresses = changeIndex === 0 ? otherAddresses : addresses;

    return {
      pathNodes,
      accountXpub,
      accountXprv,
      externalAddresses,
      changeAddresses,
    };
  }, [masterKey, pathSegments]);

  return {
    mnemonicText,
    setMnemonicText,
    passphrase,
    setPassphrase,
    wordCount,
    setWordCount,
    generateNewMnemonic,
    generationKey,
    isValidMnemonic,
    words,
    seed,
    seedHex,
    isDerivingSeed,
    masterPrivateKey,
    masterChainCode,
    pathSegments,
    updatePathSegment,
    selectedSegmentIndex,
    setSelectedSegmentIndex,
    fullPathString,
    derivedTree,
    privateKeysRevealed,
    setPrivateKeysRevealed,
  };
}
