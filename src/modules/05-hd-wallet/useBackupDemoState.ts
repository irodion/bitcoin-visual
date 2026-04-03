import { useState, useEffect, useCallback, useRef } from "react";
import type { HDState } from "./useHDState.ts";

export type DemoPhase = "idle" | "created" | "destroyed" | "restoring" | "success";

export interface BackupDemoState {
  phase: DemoPhase;
  savedMnemonic: string | null;
  savedAddresses: string[];
  userConfirmedSave: boolean;
  restoredAddresses: string[];
  addressesMatch: boolean;

  startDemo: () => void;
  confirmSaved: () => void;
  destroyWallet: () => void;
  pasteAndRestore: () => void;
  resetDemo: () => void;
}

export function useBackupDemoState(hdState: HDState): BackupDemoState {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [savedMnemonic, setSavedMnemonic] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [userConfirmedSave, setUserConfirmedSave] = useState(false);
  const [restoredAddresses, setRestoredAddresses] = useState<string[]>([]);

  // Track whether we're waiting for derivation to snapshot addresses
  const pendingSnapshot = useRef<"create" | "restore" | null>(null);

  const startDemo = useCallback(() => {
    setPhase("created");
    setSavedMnemonic(null);
    setSavedAddresses([]);
    setUserConfirmedSave(false);
    setRestoredAddresses([]);
    pendingSnapshot.current = "create";
    hdState.generateNewMnemonic();
  }, [hdState]);

  const confirmSaved = useCallback(() => {
    setUserConfirmedSave(true);
  }, []);

  const destroyWallet = useCallback(() => {
    setPhase("destroyed");
    hdState.setMnemonicText("");
  }, [hdState]);

  const pasteAndRestore = useCallback(() => {
    if (!savedMnemonic) return;
    setPhase("restoring");
    pendingSnapshot.current = "restore";
    hdState.setMnemonicText(savedMnemonic);
  }, [hdState, savedMnemonic]);

  const resetDemo = useCallback(() => {
    setPhase("idle");
    setSavedMnemonic(null);
    setSavedAddresses([]);
    setUserConfirmedSave(false);
    setRestoredAddresses([]);
    pendingSnapshot.current = null;
    hdState.setMnemonicText("");
  }, [hdState]);

  // Snapshot addresses when derivedTree populates after create or restore
  useEffect(() => {
    if (!hdState.derivedTree || !pendingSnapshot.current) return;

    const addresses = hdState.derivedTree.externalAddresses
      .slice(0, 3)
      .map((entry) => entry.address);

    if (pendingSnapshot.current === "create") {
      setSavedMnemonic(hdState.mnemonicText);
      setSavedAddresses(addresses);
      pendingSnapshot.current = null;
    } else if (pendingSnapshot.current === "restore") {
      setRestoredAddresses(addresses);
      pendingSnapshot.current = null;
      setPhase("success");
    }
  }, [hdState.derivedTree, hdState.mnemonicText]);

  const addressesMatch =
    savedAddresses.length > 0 &&
    savedAddresses.length === restoredAddresses.length &&
    savedAddresses.every((addr, i) => addr === restoredAddresses[i]);

  return {
    phase,
    savedMnemonic,
    savedAddresses,
    userConfirmedSave,
    restoredAddresses,
    addressesMatch,
    startDemo,
    confirmSaved,
    destroyWallet,
    pasteAndRestore,
    resetDemo,
  };
}
