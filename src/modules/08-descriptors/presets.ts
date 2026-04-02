import { hexToBytes } from "@noble/hashes/utils.js";
import { seedToMasterKey, deriveChild, hdKeyToXPub } from "../../shared/crypto/bip32.ts";
import { computeDescriptorChecksum } from "../../shared/crypto/descriptor.ts";

export interface DescriptorPreset {
  label: string;
  descriptor: string;
  description: string;
}

// Lazy initialization — BIP32 derivation runs only on first access, not at import time
let _presets: DescriptorPreset[] | null = null;

function buildPresets(): DescriptorPreset[] {
  const TV1_SEED = hexToBytes("000102030405060708090a0b0c0d0e0f");

  function deriveAccountXpub(purposePath: number[]): string {
    let key = seedToMasterKey(TV1_SEED);
    for (const idx of purposePath) {
      key = deriveChild(key, idx, true);
    }
    return hdKeyToXPub(key);
  }

  function withChecksum(desc: string): string {
    return `${desc}#${computeDescriptorChecksum(desc)}`;
  }

  const XPUB_44 = deriveAccountXpub([44, 0, 0]);
  const XPUB_49 = deriveAccountXpub([49, 0, 0]);
  const XPUB_84 = deriveAccountXpub([84, 0, 0]);
  const XPUB_86 = deriveAccountXpub([86, 0, 0]);
  const XPUB_48_A = deriveAccountXpub([48, 0, 0]);
  const XPUB_48_B = deriveAccountXpub([48, 0, 1]);
  const XPUB_48_C = deriveAccountXpub([48, 0, 2]);

  return [
    {
      label: "P2PKH (Legacy)",
      descriptor: withChecksum(`pkh([3442193e/44'/0'/0']${XPUB_44}/0/*)`),
      description:
        "Classic pay-to-public-key-hash. Produces 1… addresses. The oldest and most widely compatible format.",
    },
    {
      label: "P2WPKH (Native SegWit)",
      descriptor: withChecksum(`wpkh([3442193e/84'/0'/0']${XPUB_84}/0/*)`),
      description:
        "Native SegWit v0. Produces bc1q… addresses. Lower fees than legacy, recommended for most wallets.",
    },
    {
      label: "P2SH-P2WPKH (Wrapped SegWit)",
      descriptor: withChecksum(`sh(wpkh([3442193e/49'/0'/0']${XPUB_49}/0/*))`),
      description:
        "SegWit wrapped in P2SH for backward compatibility. Produces 3… addresses. The nesting mirrors how the script is evaluated.",
    },
    {
      label: "2-of-3 Multisig",
      descriptor: withChecksum(
        `wsh(sortedmulti(2,[3442193e/48'/0'/0']${XPUB_48_A}/0/*,[3442193e/48'/0'/1']${XPUB_48_B}/0/*,[3442193e/48'/0'/2']${XPUB_48_C}/0/*))`,
      ),
      description:
        "P2WSH 2-of-3 multisig with sorted keys. Any two of three cosigners can spend. Used by custody vaults and institutional wallets.",
    },
    {
      label: "Taproot (Key Path)",
      descriptor: withChecksum(`tr([3442193e/86'/0'/0']${XPUB_86}/0/*)`),
      description:
        "Taproot key-path spend. Produces bc1p… addresses. The most private single-sig format — indistinguishable from multisig on-chain.",
    },
  ];
}

export function getPresets(): DescriptorPreset[] {
  if (!_presets) {
    _presets = buildPresets();
  }
  return _presets;
}
