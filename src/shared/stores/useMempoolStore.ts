import { create } from "zustand";

export interface PendingTransaction {
  txid: Uint8Array;
  txidHex: string;
  data: string;
}

interface MempoolState {
  pendingTx: PendingTransaction | null;
  setPendingTx: (tx: PendingTransaction) => void;
  consumePendingTx: () => PendingTransaction | null;
}

export const useMempoolStore = create<MempoolState>()((set, get) => ({
  pendingTx: null,
  setPendingTx: (tx) => set({ pendingTx: tx }),
  consumePendingTx: () => {
    const tx = get().pendingTx;
    if (tx !== null) set({ pendingTx: null });
    return tx;
  },
}));
