import { describe, it, expect } from "vite-plus/test";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { seedToMasterKey, deriveChild, hdKeyToXPub, hdKeyToXPrv, HARDENED_OFFSET } from "./bip32";

// BIP32 Test Vector 1
const TV1_SEED = hexToBytes("000102030405060708090a0b0c0d0e0f");
const TV1_MASTER_XPUB =
  "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
const TV1_MASTER_XPRV =
  "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi";

describe("seedToMasterKey", () => {
  it("produces master key with depth 0", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(master.depth).toBe(0);
  });

  it("has a 32-byte private key", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(master.privateKey).toHaveLength(32);
  });

  it("has a 33-byte public key", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(master.publicKey).toHaveLength(33);
  });
});

describe("hdKeyToXPub / hdKeyToXPrv", () => {
  it("matches BIP32 test vector 1 master xpub", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(hdKeyToXPub(master)).toBe(TV1_MASTER_XPUB);
  });

  it("matches BIP32 test vector 1 master xprv", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(hdKeyToXPrv(master)).toBe(TV1_MASTER_XPRV);
  });

  it("xpub starts with 'xpub'", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(hdKeyToXPub(master)).toMatch(/^xpub/);
  });

  it("xprv starts with 'xprv'", () => {
    const master = seedToMasterKey(TV1_SEED);
    expect(hdKeyToXPrv(master)).toMatch(/^xprv/);
  });
});

describe("deriveChild", () => {
  it("hardened and non-hardened derivation produce different keys", () => {
    const master = seedToMasterKey(TV1_SEED);
    const hardened = deriveChild(master, 0, true);
    const normal = deriveChild(master, 0, false);
    expect(bytesToHex(hardened.publicKey!)).not.toBe(bytesToHex(normal.publicKey!));
  });

  it("hardened child has correct index", () => {
    const master = seedToMasterKey(TV1_SEED);
    const child = deriveChild(master, 0, true);
    expect(child.index).toBe(HARDENED_OFFSET);
  });

  it("non-hardened child has correct index", () => {
    const master = seedToMasterKey(TV1_SEED);
    const child = deriveChild(master, 5, false);
    expect(child.index).toBe(5);
  });

  it("matches BIP32 test vector 1 chain m/0'", () => {
    const master = seedToMasterKey(TV1_SEED);
    const child = deriveChild(master, 0, true);
    expect(hdKeyToXPub(child)).toBe(
      "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw",
    );
    expect(hdKeyToXPrv(child)).toBe(
      "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
    );
  });

  it("matches BIP32 test vector 1 chain m/0'/1", () => {
    const master = seedToMasterKey(TV1_SEED);
    const c0h = deriveChild(master, 0, true);
    const c1 = deriveChild(c0h, 1, false);
    expect(hdKeyToXPub(c1)).toBe(
      "xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ",
    );
  });
});

describe("HARDENED_OFFSET", () => {
  it("equals 0x80000000", () => {
    expect(HARDENED_OFFSET).toBe(0x80000000);
  });
});
