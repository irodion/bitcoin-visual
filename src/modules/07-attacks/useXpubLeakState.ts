import { useState, useCallback, useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { concatBytes } from "@noble/hashes/utils.js";
import { HDKey } from "@scure/bip32";
import {
  privateKeyToPublicKey,
  publicKeyToP2WPKHAddress,
  xpubChildPrivToParentPriv,
  deriveAllSiblings,
} from "../../shared/crypto/index.ts";
import type { XPub } from "../../shared/crypto/index.ts";
import { useStepReveal } from "./useStepReveal.ts";

export interface SiblingEntry {
  index: number;
  privKeyHex: string;
  address: string;
}

export interface XpubLeakState {
  seedHex: string;
  derivationMode: "normal" | "hardened" | "compare";
  childIndex: number;
  stepByStep: boolean;
  revealedStep: number;
  attacked: boolean;

  xpub: XPub | null;
  xpubPubHex: string;
  chainCodeHex: string;
  childPrivKeyHex: string;
  derivationPath: string;

  recoveredParentPrivHex: string | null;
  siblings: SiblingEntry[];
  attackError: string | null;
  hmacILHex: string | null;

  compareNormal: { recoveredHex: string; siblings: SiblingEntry[] } | null;
  compareHardened: { error: string } | null;

  regenerate: () => void;
  setDerivationMode: (mode: "normal" | "hardened" | "compare") => void;
  runAttack: () => void;
  toggleStepByStep: () => void;
  revealNext: () => void;
}

function generateSeedState() {
  const seed = crypto.getRandomValues(new Uint8Array(16));
  return { seed, seedHex: bytesToHex(seed) };
}

function computeHmacIL(chainCode: Uint8Array, pubKey: Uint8Array, index: number): Uint8Array {
  const indexBytes = new Uint8Array(4);
  new DataView(indexBytes.buffer).setUint32(0, index, false);
  const data = concatBytes(pubKey, indexBytes);
  const I = hmac(sha512, chainCode, data);
  return I.slice(0, 32);
}

function deriveSiblingEntries(
  parentPriv: Uint8Array,
  chainCode: Uint8Array,
  count: number,
): SiblingEntry[] {
  const keys = deriveAllSiblings(parentPriv, chainCode, count);
  return keys.map((priv, i) => {
    const pub = privateKeyToPublicKey(priv);
    return {
      index: i,
      privKeyHex: bytesToHex(priv),
      address: publicKeyToP2WPKHAddress(pub),
    };
  });
}

const HARDENED_FAILURE =
  "HMAC input requires parent private key — not derivable from xpub alone. Attack fails.";

export function useXpubLeakState(): XpubLeakState {
  const [seedState, setSeedState] = useState(generateSeedState);
  const [derivationMode, setDerivationMode] = useState<"normal" | "hardened" | "compare">("normal");
  const reveal = useStepReveal();

  const [recoveredParentPrivHex, setRecoveredParentPrivHex] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<SiblingEntry[]>([]);
  const [attackError, setAttackError] = useState<string | null>(null);
  const [hmacILHex, setHmacILHex] = useState<string | null>(null);

  const [compareNormal, setCompareNormal] = useState<{
    recoveredHex: string;
    siblings: SiblingEntry[];
  } | null>(null);
  const [compareHardened, setCompareHardened] = useState<{ error: string } | null>(null);

  const childIndex = 5;

  const derived = useMemo(() => {
    const master = HDKey.fromMasterSeed(seedState.seed);
    const normalParent = master.deriveChild(0);
    const xpub: XPub = {
      publicKey: normalParent.publicKey!,
      chainCode: normalParent.chainCode!,
    };
    const child = normalParent.deriveChild(childIndex);
    return {
      xpub,
      xpubPubHex: bytesToHex(normalParent.publicKey!),
      chainCodeHex: bytesToHex(normalParent.chainCode!),
      childPrivKey: child.privateKey!,
      childPrivKeyHex: bytesToHex(child.privateKey!),
    };
  }, [seedState.seedHex]);

  const attacked =
    recoveredParentPrivHex !== null || attackError !== null || compareNormal !== null;

  const derivationPath = derivationMode === "hardened" ? `m/0'/${childIndex}` : `m/0/${childIndex}`;

  const regenerate = useCallback(() => {
    setSeedState(generateSeedState());
    setRecoveredParentPrivHex(null);
    setSiblings([]);
    setAttackError(null);
    setHmacILHex(null);
    setCompareNormal(null);
    setCompareHardened(null);
    reveal.resetReveal(reveal.stepByStep);
  }, [reveal]);

  const runAttack = useCallback(() => {
    reveal.resetReveal(reveal.stepByStep);

    if (derivationMode === "normal" || derivationMode === "compare") {
      const il = computeHmacIL(derived.xpub.chainCode, derived.xpub.publicKey, childIndex);
      setHmacILHex(bytesToHex(il));

      const parentPriv = xpubChildPrivToParentPriv(derived.xpub, derived.childPrivKey, childIndex);
      const parentHex = bytesToHex(parentPriv);
      const sibs = deriveSiblingEntries(parentPriv, derived.xpub.chainCode, 8);

      if (derivationMode === "normal") {
        setRecoveredParentPrivHex(parentHex);
        setSiblings(sibs);
        setAttackError(null);
        setCompareNormal(null);
        setCompareHardened(null);
      } else {
        setCompareNormal({ recoveredHex: parentHex, siblings: sibs });
        setCompareHardened({ error: HARDENED_FAILURE });
        setRecoveredParentPrivHex(null);
        setSiblings([]);
        setAttackError(null);
      }
    } else {
      setHmacILHex(null);
      setRecoveredParentPrivHex(null);
      setSiblings([]);
      setCompareNormal(null);
      setCompareHardened(null);
      setAttackError(HARDENED_FAILURE);
    }
  }, [derivationMode, derived, reveal]);

  return {
    seedHex: seedState.seedHex,
    derivationMode,
    childIndex,
    stepByStep: reveal.stepByStep,
    revealedStep: reveal.revealedStep,
    attacked,
    xpub: derived.xpub,
    xpubPubHex: derived.xpubPubHex,
    chainCodeHex: derived.chainCodeHex,
    childPrivKeyHex: derived.childPrivKeyHex,
    derivationPath,
    recoveredParentPrivHex,
    siblings,
    attackError,
    hmacILHex,
    compareNormal,
    compareHardened,
    regenerate,
    setDerivationMode,
    runAttack,
    toggleStepByStep: reveal.toggleStepByStep,
    revealNext: reveal.revealNext,
  };
}
