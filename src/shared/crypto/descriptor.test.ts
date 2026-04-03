import { describe, it, expect } from "vite-plus/test";
import { hexToBytes } from "@noble/hashes/utils.js";
import {
  computeDescriptorChecksum,
  validateDescriptorChecksum,
  parseDescriptor,
  expandDescriptor,
  buildDescriptor,
} from "./descriptor";
import type { DescriptorConfig } from "./descriptor";
import { seedToMasterKey, deriveChild, hdKeyToXPub } from "./bip32";
import { publicKeyToP2PKHAddress, publicKeyToP2WPKHAddress } from "./address";

// BIP32 Test Vector 1 — derive xpubs for test descriptors
const TV1_SEED = hexToBytes("000102030405060708090a0b0c0d0e0f");

function deriveXpubAtPath(
  seed: Uint8Array,
  path: Array<{ index: number; hardened: boolean }>,
): string {
  let key = seedToMasterKey(seed);
  for (const step of path) {
    key = deriveChild(key, step.index, step.hardened);
  }
  return hdKeyToXPub(key);
}

// Derive account-level xpubs from TV1 for use in test descriptors
const XPUB_44 = deriveXpubAtPath(TV1_SEED, [
  { index: 44, hardened: true },
  { index: 0, hardened: true },
  { index: 0, hardened: true },
]);

const XPUB_84 = deriveXpubAtPath(TV1_SEED, [
  { index: 84, hardened: true },
  { index: 0, hardened: true },
  { index: 0, hardened: true },
]);

const XPUB_49 = deriveXpubAtPath(TV1_SEED, [
  { index: 49, hardened: true },
  { index: 0, hardened: true },
  { index: 0, hardened: true },
]);

// ── Checksum Tests ──

describe("computeDescriptorChecksum", () => {
  it("computes checksum for a simple pkh descriptor", () => {
    const desc = `pkh(${XPUB_44}/0/*)`;
    const checksum = computeDescriptorChecksum(desc);
    expect(checksum).toHaveLength(8);
    // Verify all chars are in the bech32 charset
    for (const ch of checksum) {
      expect("qpzry9x8gf2tvdw0s3jn54khce6mua7l").toContain(ch);
    }
  });

  it("computes deterministic checksums", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const c1 = computeDescriptorChecksum(desc);
    const c2 = computeDescriptorChecksum(desc);
    expect(c1).toBe(c2);
  });

  it("different descriptors produce different checksums", () => {
    const c1 = computeDescriptorChecksum(`pkh(${XPUB_44}/0/*)`);
    const c2 = computeDescriptorChecksum(`wpkh(${XPUB_84}/0/*)`);
    expect(c1).not.toBe(c2);
  });

  it("throws on invalid characters", () => {
    expect(() => computeDescriptorChecksum("pkh(🔑)")).toThrow("Invalid character");
  });

  it("checksum is self-consistent: compute then validate round-trips", () => {
    const desc = `wpkh([d34db33f/84'/0'/0']${XPUB_84}/0/*)`;
    const checksum = computeDescriptorChecksum(desc);
    expect(validateDescriptorChecksum(`${desc}#${checksum}`)).toBe(true);
    // Mutate one character in the descriptor body
    const mutated = desc.slice(0, 5) + "X" + desc.slice(6);
    expect(validateDescriptorChecksum(`${mutated}#${checksum}`)).toBe(false);
  });
});

describe("validateDescriptorChecksum", () => {
  it("returns true for valid checksum", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const checksum = computeDescriptorChecksum(desc);
    expect(validateDescriptorChecksum(`${desc}#${checksum}`)).toBe(true);
  });

  it("returns false for mutated checksum", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const checksum = computeDescriptorChecksum(desc);
    const mutated = checksum.slice(0, 7) + (checksum[7] === "q" ? "p" : "q");
    expect(validateDescriptorChecksum(`${desc}#${mutated}`)).toBe(false);
  });

  it("returns false for missing checksum", () => {
    expect(validateDescriptorChecksum(`wpkh(${XPUB_84}/0/*)`)).toBe(false);
  });

  it("returns false for truncated checksum", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const checksum = computeDescriptorChecksum(desc);
    expect(validateDescriptorChecksum(`${desc}#${checksum.slice(0, 4)}`)).toBe(false);
  });
});

// ── Parser Tests ──

describe("parseDescriptor", () => {
  it("parses pkh descriptor", () => {
    const desc = `pkh(${XPUB_44}/0/*)`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.type).toBe("pkh");
    expect(parsed.root.keys).toHaveLength(1);
    expect(parsed.root.keys[0].key).toBe(XPUB_44);
    expect(parsed.root.keys[0].derivationSuffix).toBe("/0/*");
    expect(parsed.root.keys[0].isRange).toBe(true);
    expect(parsed.checksum).toBeNull();
  });

  it("parses wpkh descriptor with key origin", () => {
    const desc = `wpkh([d34db33f/84'/0'/0']${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.type).toBe("wpkh");
    expect(parsed.root.keys[0].origin).not.toBeNull();
    expect(parsed.root.keys[0].origin?.fingerprint).toBe("d34db33f");
    expect(parsed.root.keys[0].origin?.path).toEqual([84, 0, 0]);
    expect(parsed.root.keys[0].origin?.hardenedFlags).toEqual([true, true, true]);
  });

  it("parses key origin with h notation", () => {
    const desc = `wpkh([d34db33f/84h/0h/0h]${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.keys[0].origin?.hardenedFlags).toEqual([true, true, true]);
  });

  it("parses sh(wpkh(...)) nested descriptor", () => {
    const desc = `sh(wpkh(${XPUB_49}/0/*))`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.type).toBe("sh");
    expect(parsed.root.children).toHaveLength(1);
    expect(parsed.root.children[0].type).toBe("wpkh");
    expect(parsed.root.children[0].keys[0].key).toBe(XPUB_49);
  });

  it("parses wsh(sortedmulti(2,...)) descriptor", () => {
    const desc = `wsh(sortedmulti(2,${XPUB_44}/0/*,${XPUB_84}/0/*))`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.type).toBe("wsh");
    expect(parsed.root.children[0].type).toBe("sortedmulti");
    expect(parsed.root.children[0].threshold).toBe(2);
    expect(parsed.root.children[0].keys).toHaveLength(2);
  });

  it("parses tr descriptor", () => {
    const desc = `tr(${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    expect(parsed.root.type).toBe("tr");
    expect(parsed.root.keys[0].key).toBe(XPUB_84);
  });

  it("parses descriptor with valid checksum", () => {
    const raw = `wpkh(${XPUB_84}/0/*)`;
    const checksum = computeDescriptorChecksum(raw);
    const parsed = parseDescriptor(`${raw}#${checksum}`);
    expect(parsed.checksum).toBe(checksum);
  });

  it("throws on invalid checksum", () => {
    const raw = `wpkh(${XPUB_84}/0/*)`;
    expect(() => parseDescriptor(`${raw}#aaaaaaaa`)).toThrow("Invalid checksum");
  });

  it("throws on empty string", () => {
    expect(() => parseDescriptor("")).toThrow("Empty descriptor");
  });

  it("throws on unknown function", () => {
    expect(() => parseDescriptor("unknown(key)")).toThrow("Unknown function");
  });

  it("throws on missing closing paren", () => {
    expect(() => parseDescriptor(`wpkh(${XPUB_84}/0/*`)).toThrow();
  });

  // Segments
  it("produces correct segment kinds for wpkh", () => {
    const desc = `wpkh([d34db33f/84'/0'/0']${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    const kinds = parsed.segments.map((s) => s.kind);
    expect(kinds).toContain("function");
    expect(kinds).toContain("fingerprint");
    expect(kinds).toContain("originPath");
    expect(kinds).toContain("key");
    expect(kinds).toContain("suffix");
  });

  it("all segments reconstruct the original string", () => {
    const desc = `wpkh([d34db33f/84'/0'/0']${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    // Segments should cover the full string (excluding gaps for [ and ] which are in origin segments)
    const covered = new Set<number>();
    for (const seg of parsed.segments) {
      for (let i = seg.start; i < seg.end; i++) {
        covered.add(i);
      }
    }
    // Every character position should be covered
    for (let i = 0; i < desc.length; i++) {
      expect(covered.has(i)).toBe(true);
    }
  });
});

// ── Expansion Tests ──

describe("expandDescriptor", () => {
  it("expands wpkh descriptor to correct P2WPKH addresses", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    const expanded = expandDescriptor(parsed, 0, 3);

    expect(expanded).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(expanded[i].index).toBe(i);
      expect(expanded[i].address).toMatch(/^bc1q/);
      expect(expanded[i].isTaproot).toBe(false);
      expect(expanded[i].publicKey).toHaveLength(33);

      // Verify against independent address computation
      const expectedAddr = publicKeyToP2WPKHAddress(expanded[i].publicKey);
      expect(expanded[i].address).toBe(expectedAddr);
    }
  });

  it("expands pkh descriptor to correct P2PKH addresses", () => {
    const desc = `pkh(${XPUB_44}/0/*)`;
    const parsed = parseDescriptor(desc);
    const expanded = expandDescriptor(parsed, 0, 3);

    expect(expanded).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(expanded[i].address).toMatch(/^1/);
      const expectedAddr = publicKeyToP2PKHAddress(expanded[i].publicKey);
      expect(expanded[i].address).toBe(expectedAddr);
    }
  });

  it("expands sh(wpkh(...)) to P2SH addresses", () => {
    const desc = `sh(wpkh(${XPUB_49}/0/*))`;
    const parsed = parseDescriptor(desc);
    const expanded = expandDescriptor(parsed, 0, 3);

    expect(expanded).toHaveLength(3);
    for (const entry of expanded) {
      expect(entry.address).toMatch(/^3/);
      expect(entry.isTaproot).toBe(false);
    }
  });

  it("marks tr descriptor as taproot placeholder", () => {
    const desc = `tr(${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    const expanded = expandDescriptor(parsed, 0, 2);

    for (const entry of expanded) {
      expect(entry.isTaproot).toBe(true);
    }
  });

  it("different indices produce different addresses", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    const expanded = expandDescriptor(parsed, 0, 5);

    const addresses = new Set(expanded.map((e) => e.address));
    expect(addresses.size).toBe(5);
  });

  it("respects startIndex offset", () => {
    const desc = `wpkh(${XPUB_84}/0/*)`;
    const parsed = parseDescriptor(desc);
    const fromZero = expandDescriptor(parsed, 0, 5);
    const fromTwo = expandDescriptor(parsed, 2, 3);

    expect(fromTwo[0].address).toBe(fromZero[2].address);
    expect(fromTwo[1].address).toBe(fromZero[3].address);
    expect(fromTwo[2].address).toBe(fromZero[4].address);
  });
});

// ── Builder Tests ──

describe("buildDescriptor", () => {
  it("builds a valid wpkh descriptor with checksum", () => {
    const config: DescriptorConfig = {
      scriptType: "wpkh",
      keys: [{ origin: null, key: XPUB_84, derivationSuffix: "/0/*" }],
      threshold: null,
      chain: 0,
    };
    const result = buildDescriptor(config);
    expect(result).toContain("wpkh(");
    expect(result).toContain("#");
    expect(validateDescriptorChecksum(result)).toBe(true);
  });

  it("builds a valid pkh descriptor", () => {
    const config: DescriptorConfig = {
      scriptType: "pkh",
      keys: [{ origin: null, key: XPUB_44, derivationSuffix: "/0/*" }],
      threshold: null,
      chain: 0,
    };
    const result = buildDescriptor(config);
    expect(result).toMatch(/^pkh\(/);
    expect(validateDescriptorChecksum(result)).toBe(true);
  });

  it("builds sh-wpkh with correct nesting", () => {
    const config: DescriptorConfig = {
      scriptType: "sh-wpkh",
      keys: [{ origin: null, key: XPUB_49, derivationSuffix: "/0/*" }],
      threshold: null,
      chain: 0,
    };
    const result = buildDescriptor(config);
    expect(result).toMatch(/^sh\(wpkh\(/);
    expect(validateDescriptorChecksum(result)).toBe(true);
  });

  it("builds wsh-sortedmulti with threshold", () => {
    const config: DescriptorConfig = {
      scriptType: "wsh-sortedmulti",
      keys: [
        { origin: null, key: XPUB_44, derivationSuffix: "/0/*" },
        { origin: null, key: XPUB_84, derivationSuffix: "/0/*" },
      ],
      threshold: 2,
      chain: 0,
    };
    const result = buildDescriptor(config);
    expect(result).toMatch(/^wsh\(sortedmulti\(2,/);
    expect(validateDescriptorChecksum(result)).toBe(true);
  });

  it("includes key origin when provided", () => {
    const config: DescriptorConfig = {
      scriptType: "wpkh",
      keys: [
        {
          origin: { fingerprint: "d34db33f", path: [84, 0, 0], hardenedFlags: [true, true, true] },
          key: XPUB_84,
          derivationSuffix: "/0/*",
        },
      ],
      threshold: null,
      chain: 0,
    };
    const result = buildDescriptor(config);
    expect(result).toContain("[d34db33f/84'/0'/0']");
  });

  it("round-trips: build → parse → verify structure", () => {
    const config: DescriptorConfig = {
      scriptType: "wpkh",
      keys: [
        {
          origin: { fingerprint: "aabbccdd", path: [84, 0, 0], hardenedFlags: [true, true, true] },
          key: XPUB_84,
          derivationSuffix: "/0/*",
        },
      ],
      threshold: null,
      chain: 0,
    };
    const built = buildDescriptor(config);
    const parsed = parseDescriptor(built);

    expect(parsed.root.type).toBe("wpkh");
    expect(parsed.root.keys[0].origin?.fingerprint).toBe("aabbccdd");
    expect(parsed.root.keys[0].key).toBe(XPUB_84);
    expect(parsed.root.keys[0].derivationSuffix).toBe("/0/*");
    expect(parsed.checksum).not.toBeNull();
  });
});
