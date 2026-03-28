import { hexToBytes } from "@noble/hashes/utils.js";
import { hash160, privateKeyToPublicKey, reverseBytes } from "../../shared/crypto/index.ts";

export interface UTXO {
  id: string;
  txid: string; // 64-char hex, display order (big-endian)
  txidBytes: Uint8Array; // 32 bytes, internal byte order (little-endian)
  vout: number;
  valueSats: bigint;
  valueBTC: string;
  label: string;
  color: string;
  pubKeyHash: Uint8Array;
}

// Deterministic mock keypair for generating realistic scripts
const MOCK_PRIVKEY = hexToBytes("0000000000000000000000000000000000000000000000000000000000000001");
export const MOCK_PUBKEY = privateKeyToPublicKey(MOCK_PRIVKEY);
export const MOCK_PUBKEY_HASH = hash160(MOCK_PUBKEY);

// Recipient uses a different pubkey hash
const RECIPIENT_PRIVKEY = hexToBytes(
  "0000000000000000000000000000000000000000000000000000000000000002",
);
const RECIPIENT_PUBKEY = privateKeyToPublicKey(RECIPIENT_PRIVKEY);
export const RECIPIENT_PUBKEY_HASH = hash160(RECIPIENT_PUBKEY);

// Mock DER signature (71 bytes) for realistic scriptSig display
// This is NOT a real signature — purely for hex inspector visualization
export const MOCK_SIGNATURE = new Uint8Array([
  0x30,
  0x45,
  0x02,
  0x21,
  0x00,
  ...Array.from({ length: 32 }, (_, i) => (i + 0xa0) & 0xff),
  0x02,
  0x20,
  ...Array.from({ length: 32 }, (_, i) => (i + 0xb0) & 0xff),
  0x01, // SIGHASH_ALL
]);

function reverseHexToBytes(hex: string): Uint8Array {
  return reverseBytes(hexToBytes(hex));
}

export const MOCK_UTXOS: UTXO[] = [
  {
    id: "utxo-1",
    txid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    txidBytes: reverseHexToBytes(
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    ),
    vout: 0,
    valueSats: 50_000_000n, // 0.5 BTC
    valueBTC: "0.5",
    label: "Mining reward",
    color: "#F7931A",
    pubKeyHash: MOCK_PUBKEY_HASH,
  },
  {
    id: "utxo-2",
    txid: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    txidBytes: reverseHexToBytes(
      "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    ),
    vout: 1,
    valueSats: 30_000_000n, // 0.3 BTC
    valueBTC: "0.3",
    label: "Payment received",
    color: "#36CFC9",
    pubKeyHash: MOCK_PUBKEY_HASH,
  },
  {
    id: "utxo-3",
    txid: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    txidBytes: reverseHexToBytes(
      "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    ),
    vout: 0,
    valueSats: 10_000_000n, // 0.1 BTC
    valueBTC: "0.1",
    label: "Change output",
    color: "#7DD3FC",
    pubKeyHash: MOCK_PUBKEY_HASH,
  },
  {
    id: "utxo-4",
    txid: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    txidBytes: reverseHexToBytes(
      "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    ),
    vout: 2,
    valueSats: 5_000_000n, // 0.05 BTC
    valueBTC: "0.05",
    label: "Dust consolidation",
    color: "#22C55E",
    pubKeyHash: MOCK_PUBKEY_HASH,
  },
];

export const FEE_SATS = 10_000n; // 0.0001 BTC

export function btcToSats(btc: string): bigint {
  if (btc === "" || btc === ".") return 0n;
  const parts = btc.split(".");
  const whole = parts[0] || "0";
  const frac = (parts[1] || "").padEnd(8, "0").slice(0, 8);
  return BigInt(whole) * 100_000_000n + BigInt(frac);
}

export function satsToBtc(sats: bigint): string {
  const negative = sats < 0n;
  const abs = negative ? -sats : sats;
  const whole = abs / 100_000_000n;
  const frac = abs % 100_000_000n;
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "") || "0";
  return `${negative ? "-" : ""}${whole}.${fracStr}`;
}
