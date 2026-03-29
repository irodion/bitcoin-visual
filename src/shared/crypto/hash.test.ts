import { describe, it, expect } from "vite-plus/test";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256, sha256d, ripemd160, hash160 } from "./hash";

const enc = new TextEncoder();

describe("sha256", () => {
  it("matches known vector for 'abc'", () => {
    const result = bytesToHex(sha256(enc.encode("abc")));
    expect(result).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("matches known vector for empty input", () => {
    const result = bytesToHex(sha256(new Uint8Array(0)));
    expect(result).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("returns 32 bytes", () => {
    expect(sha256(enc.encode("test"))).toHaveLength(32);
  });
});

describe("sha256d", () => {
  it("equals sha256(sha256(input))", () => {
    const input = enc.encode("hello");
    expect(bytesToHex(sha256d(input))).toBe(bytesToHex(sha256(sha256(input))));
  });

  it("returns 32 bytes", () => {
    expect(sha256d(enc.encode("test"))).toHaveLength(32);
  });
});

describe("ripemd160", () => {
  it("matches known vector for 'abc'", () => {
    const result = bytesToHex(ripemd160(enc.encode("abc")));
    expect(result).toBe("8eb208f7e05d987a9b044a8e98c6b087f15a0bfc");
  });

  it("returns 20 bytes", () => {
    expect(ripemd160(enc.encode("test"))).toHaveLength(20);
  });
});

describe("hash160", () => {
  it("equals ripemd160(sha256(input))", () => {
    const input = enc.encode("hello");
    expect(bytesToHex(hash160(input))).toBe(bytesToHex(ripemd160(sha256(input))));
  });

  it("returns 20 bytes", () => {
    expect(hash160(enc.encode("test"))).toHaveLength(20);
  });

  it("produces different output from plain ripemd160", () => {
    const input = enc.encode("bitcoin");
    expect(bytesToHex(hash160(input))).not.toBe(bytesToHex(ripemd160(input)));
  });
});
