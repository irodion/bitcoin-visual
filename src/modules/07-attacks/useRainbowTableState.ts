import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "../../shared/crypto/index.ts";
import { RAINBOW_TABLE } from "./data/rainbowTable.ts";

const encoder = new TextEncoder();

function generateSalt(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function hashString(input: string): string {
  return bytesToHex(sha256(encoder.encode(input)));
}

export interface RainbowTableState {
  targetSource: "dropdown" | "custom";
  selectedIndex: number;
  customPassword: string;
  saltEnabled: boolean;
  salt: string;
  displayHash: string;
  unsaltedCustomHash: string;
  saltedCustomHash: string;

  cracking: boolean;
  scanIndex: number;
  scanComplete: boolean;
  crackedPassword: string | null;
  crackTimeMs: number | null;
  entriesChecked: number;

  setTargetSource: (s: "dropdown" | "custom") => void;
  setSelectedIndex: (i: number) => void;
  setCustomPassword: (p: string) => void;
  toggleSalt: () => void;
  regenerateSalt: () => void;
  crack: () => void;
  resetCrack: () => void;
}

export function useRainbowTableState(): RainbowTableState {
  const [targetSource, setTargetSource] = useState<"dropdown" | "custom">("dropdown");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customPassword, setCustomPassword] = useState("");
  const [saltEnabled, setSaltEnabled] = useState(false);
  const [salt, setSalt] = useState(generateSalt);

  const [cracking, setCracking] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const [scanComplete, setScanComplete] = useState(false);
  const [crackedPassword, setCrackedPassword] = useState<string | null>(null);
  const [crackTimeMs, setCrackTimeMs] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const targetHashRef = useRef("");

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const unsaltedCustomHash = useMemo(
    () => (customPassword ? hashString(customPassword) : ""),
    [customPassword],
  );

  const saltedCustomHash = useMemo(
    () => (customPassword ? hashString(customPassword + salt) : ""),
    [customPassword, salt],
  );

  const displayHash = useMemo(() => {
    if (targetSource === "custom") {
      if (!customPassword) return "";
      return saltEnabled ? hashString(customPassword + salt) : hashString(customPassword);
    }
    const entry = RAINBOW_TABLE[selectedIndex];
    if (!entry) return "";
    if (saltEnabled) {
      return hashString(entry.password + salt);
    }
    return entry.sha256;
  }, [targetSource, selectedIndex, customPassword, saltEnabled, salt]);

  const entriesChecked = scanIndex < 0 ? 0 : Math.min(scanIndex + 1, RAINBOW_TABLE.length);

  const resetCrack = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCracking(false);
    setScanIndex(-1);
    setScanComplete(false);
    setCrackedPassword(null);
    setCrackTimeMs(null);
  }, []);

  const crack = useCallback(() => {
    resetCrack();
    if (!displayHash) return;

    setCracking(true);
    setScanIndex(-1);
    startTimeRef.current = performance.now();
    targetHashRef.current = displayHash;
    let idx = -1;

    const id = setInterval(() => {
      idx++;
      if (idx >= RAINBOW_TABLE.length) {
        clearInterval(id);
        intervalRef.current = null;
        setScanIndex(RAINBOW_TABLE.length - 1);
        setCracking(false);
        setScanComplete(true);
        setCrackTimeMs(Math.round(performance.now() - startTimeRef.current));
        return;
      }

      setScanIndex(idx);

      if (RAINBOW_TABLE[idx].sha256 === targetHashRef.current) {
        clearInterval(id);
        intervalRef.current = null;
        setCracking(false);
        setScanComplete(true);
        setCrackedPassword(RAINBOW_TABLE[idx].password);
        setCrackTimeMs(Math.round(performance.now() - startTimeRef.current));
      }
    }, 50);
    intervalRef.current = id;
  }, [displayHash, resetCrack]);

  const toggleSalt = useCallback(() => {
    setSaltEnabled((prev) => !prev);
    resetCrack();
  }, [resetCrack]);

  const regenerateSalt = useCallback(() => {
    setSalt(generateSalt());
    resetCrack();
  }, [resetCrack]);

  const handleSetTargetSource = useCallback(
    (s: "dropdown" | "custom") => {
      setTargetSource(s);
      resetCrack();
    },
    [resetCrack],
  );

  const handleSetSelectedIndex = useCallback(
    (i: number) => {
      setSelectedIndex(i);
      resetCrack();
    },
    [resetCrack],
  );

  const handleSetCustomPassword = useCallback(
    (p: string) => {
      setCustomPassword(p);
      resetCrack();
    },
    [resetCrack],
  );

  return {
    targetSource,
    selectedIndex,
    customPassword,
    saltEnabled,
    salt,
    displayHash,
    unsaltedCustomHash,
    saltedCustomHash,
    cracking,
    scanIndex,
    scanComplete,
    crackedPassword,
    crackTimeMs,
    entriesChecked,
    setTargetSource: handleSetTargetSource,
    setSelectedIndex: handleSetSelectedIndex,
    setCustomPassword: handleSetCustomPassword,
    toggleSalt,
    regenerateSalt,
    crack,
    resetCrack,
  };
}
