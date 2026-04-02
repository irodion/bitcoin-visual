import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  parseDescriptor,
  expandDescriptor,
  buildDescriptor,
  findFirstKey,
  generateMnemonic,
  mnemonicToSeed,
  seedToMasterKey,
  deriveChild,
  hdKeyToXPub,
} from "../../shared/crypto/index.ts";
import type {
  ParsedDescriptor,
  ExpandedAddress,
  DescriptorConfig,
  KeyOrigin,
} from "../../shared/crypto/index.ts";
import { getPresets } from "./presets.ts";

export type DescriptorTabKey = "anatomy" | "derive" | "builder";

export interface DescriptorState {
  activeTab: DescriptorTabKey;
  setActiveTab: (tab: DescriptorTabKey) => void;

  // Anatomy
  descriptorInput: string;
  handleDescriptorInput: (s: string) => void;
  parsed: ParsedDescriptor | null;
  parseError: string | null;
  selectedSegmentIndex: number | null;
  setSelectedSegmentIndex: (i: number | null) => void;
  selectPreset: (index: number) => void;

  // Derive
  addressCount: number;
  setAddressCount: (n: number) => void;
  expandedAddresses: ExpandedAddress[];
  expandError: string | null;
  comparisonAddresses: Array<{ scriptType: string; label: string; address: string }> | null;

  // Builder
  builderScriptType: DescriptorConfig["scriptType"];
  setBuilderScriptType: (t: DescriptorConfig["scriptType"]) => void;
  isMulti: boolean;
  builderKeys: DescriptorConfig["keys"];
  addBuilderKey: () => void;
  removeBuilderKey: (index: number) => void;
  updateBuilderKey: (index: number, key: string) => void;
  builderThreshold: number;
  setBuilderThreshold: (m: number) => void;
  builderChain: 0 | 1;
  setBuilderChain: (c: 0 | 1) => void;
  generateKeyMaterial: () => void;
  isGeneratingKey: boolean;
  builtDescriptor: string | null;
  builtDescriptorError: string | null;
}

const EMPTY_KEY_ENTRY = { origin: null as KeyOrigin | null, key: "", derivationSuffix: "/0/*" };

export function useDescriptorState(): DescriptorState {
  const [activeTab, setActiveTab] = useState<DescriptorTabKey>("anatomy");
  const [descriptorInput, setDescriptorInput] = useState("");
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState(5);

  // Builder state
  const [builderScriptType, setBuilderScriptType] =
    useState<DescriptorConfig["scriptType"]>("wpkh");
  const [builderKeys, setBuilderKeys] = useState<DescriptorConfig["keys"]>([
    { ...EMPTY_KEY_ENTRY },
  ]);
  const [builderThreshold, setBuilderThreshold] = useState(2);
  const [builderChain, setBuilderChain] = useState<0 | 1>(0);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const isMulti = builderScriptType === "wsh-multi" || builderScriptType === "wsh-sortedmulti";

  // Async key generation cleanup
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Anatomy: Parse ──

  const { parsed, parseError } = useMemo(() => {
    if (!descriptorInput.trim()) return { parsed: null, parseError: null };
    try {
      return { parsed: parseDescriptor(descriptorInput), parseError: null };
    } catch (err) {
      return { parsed: null, parseError: err instanceof Error ? err.message : String(err) };
    }
  }, [descriptorInput]);

  // Combined setter resets segment selection — no effect/ref needed
  const handleDescriptorInput = useCallback((s: string) => {
    setDescriptorInput(s);
    setSelectedSegmentIndex(null);
  }, []);

  const selectPreset = useCallback((index: number) => {
    const presets = getPresets();
    if (index >= 0 && index < presets.length) {
      setDescriptorInput(presets[index].descriptor);
      setSelectedSegmentIndex(null);
    }
  }, []);

  // ── Derive: Expand (gated on active tab to avoid wasted BIP32 derivation) ──

  const { expandedAddresses, expandError } = useMemo(() => {
    if (activeTab !== "derive" || !parsed) return { expandedAddresses: [], expandError: null };
    try {
      return { expandedAddresses: expandDescriptor(parsed, 0, addressCount), expandError: null };
    } catch (err) {
      return {
        expandedAddresses: [],
        expandError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [parsed, addressCount, activeTab]);

  // Cross-type comparison: same first key wrapped in pkh/wpkh/sh(wpkh)
  const comparisonAddresses = useMemo(() => {
    if (activeTab !== "derive" || !parsed) return null;
    const first = findFirstKey(parsed.root);
    if (!first || !first.key.startsWith("xpub")) return null;

    const suffixPart = first.derivationSuffix ?? "/0/*";
    const types = [
      { scriptType: "pkh" as const, label: "P2PKH (1…)" },
      { scriptType: "wpkh" as const, label: "P2WPKH (bc1q…)" },
      { scriptType: "sh-wpkh" as const, label: "P2SH-P2WPKH (3…)" },
    ];

    try {
      return types.map(({ scriptType, label }) => {
        const config: DescriptorConfig = {
          scriptType,
          keys: [{ origin: null, key: first.key, derivationSuffix: suffixPart }],
          threshold: null,
          chain: 0,
        };
        const desc = buildDescriptor(config);
        const p = parseDescriptor(desc);
        const expanded = expandDescriptor(p, 0, 1);
        if (expanded.length === 0) throw new Error("Expansion returned no addresses");
        return { scriptType, label, address: expanded[0].address };
      });
    } catch {
      return null;
    }
  }, [parsed, activeTab]);

  // ── Builder ──

  const addBuilderKey = useCallback(() => {
    setBuilderKeys((prev) => [...prev, { ...EMPTY_KEY_ENTRY }]);
  }, []);

  const removeBuilderKey = useCallback((index: number) => {
    setBuilderKeys((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateBuilderKey = useCallback((index: number, key: string) => {
    setBuilderKeys((prev) => prev.map((k, i) => (i === index ? { ...k, key } : k)));
  }, []);

  const generateKeyMaterial = useCallback(() => {
    setIsGeneratingKey(true);
    const mnemonic = generateMnemonic();
    void mnemonicToSeed(mnemonic)
      .then((seed) => {
        if (!mountedRef.current) return;
        const master = seedToMasterKey(seed);
        const purposeChild = deriveChild(master, 84, true);
        const coinChild = deriveChild(purposeChild, 0, true);
        const accountChild = deriveChild(coinChild, 0, true);
        const xpub = hdKeyToXPub(accountChild);

        setBuilderKeys((prev) => {
          const updated = [...prev];
          updated[0] = { ...updated[0], key: xpub };
          return updated;
        });
        setIsGeneratingKey(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setIsGeneratingKey(false);
      });
  }, []);

  const { builtDescriptor, builtDescriptorError } = useMemo(() => {
    const hasKeys = builderKeys.some((k) => k.key.length > 0);
    if (!hasKeys) return { builtDescriptor: null, builtDescriptorError: null };

    if (isMulti && builderKeys.filter((k) => k.key.length > 0).length < 2) {
      return { builtDescriptor: null, builtDescriptorError: "Multisig requires at least 2 keys" };
    }

    try {
      const config: DescriptorConfig = {
        scriptType: builderScriptType,
        keys: builderKeys
          .filter((k) => k.key.length > 0)
          .map((k) => ({
            ...k,
            derivationSuffix: `/${builderChain}/*`,
          })),
        threshold: isMulti ? builderThreshold : null,
        chain: builderChain,
      };
      return { builtDescriptor: buildDescriptor(config), builtDescriptorError: null };
    } catch (err) {
      return {
        builtDescriptor: null,
        builtDescriptorError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [builderScriptType, builderKeys, builderThreshold, builderChain, isMulti]);

  return {
    activeTab,
    setActiveTab,
    descriptorInput,
    handleDescriptorInput,
    parsed,
    parseError,
    selectedSegmentIndex,
    setSelectedSegmentIndex,
    selectPreset,
    addressCount,
    setAddressCount,
    expandedAddresses,
    expandError,
    comparisonAddresses,
    builderScriptType,
    setBuilderScriptType,
    isMulti,
    builderKeys,
    addBuilderKey,
    removeBuilderKey,
    updateBuilderKey,
    builderThreshold,
    setBuilderThreshold,
    builderChain,
    setBuilderChain,
    generateKeyMaterial,
    isGeneratingKey,
    builtDescriptor,
    builtDescriptorError,
  };
}
