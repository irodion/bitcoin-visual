import { describe, it, expect } from "vite-plus/test";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256d } from "./hash";
import { buildMerkleTree, computeMerkleRoot, getMerkleProof } from "./merkle";

function leaf(s: string): Uint8Array {
  return sha256d(new TextEncoder().encode(s));
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(64);
  out.set(a, 0);
  out.set(b, 32);
  return out;
}

describe("buildMerkleTree", () => {
  it("returns 32 zero bytes for empty leaves", () => {
    const tree = buildMerkleTree([]);
    expect(tree).toHaveLength(1);
    expect(tree[0][0]).toEqual(new Uint8Array(32));
  });

  it("single leaf — root equals that leaf", () => {
    const l = leaf("tx0");
    const tree = buildMerkleTree([l]);
    expect(tree).toHaveLength(1);
    expect(bytesToHex(tree[0][0])).toBe(bytesToHex(l));
  });

  it("two leaves — root is sha256d(leaf0 || leaf1)", () => {
    const l0 = leaf("tx0");
    const l1 = leaf("tx1");
    const expected = sha256d(concat(l0, l1));
    const tree = buildMerkleTree([l0, l1]);
    expect(tree).toHaveLength(2);
    expect(bytesToHex(tree[1][0])).toBe(bytesToHex(expected));
  });

  it("three leaves (odd) — duplicates last leaf", () => {
    const l0 = leaf("tx0");
    const l1 = leaf("tx1");
    const l2 = leaf("tx2");
    const tree = buildMerkleTree([l0, l1, l2]);
    // Level 0: 3 leaves, Level 1: 2 nodes, Level 2: 1 root
    expect(tree).toHaveLength(3);
    expect(tree[0]).toHaveLength(3);
    expect(tree[1]).toHaveLength(2);
    expect(tree[2]).toHaveLength(1);

    // Level 1[1] should be sha256d(l2 || l2) (duplicate)
    const expectedRight = sha256d(concat(l2, l2));
    expect(bytesToHex(tree[1][1])).toBe(bytesToHex(expectedRight));
  });

  it("four leaves — correct structure", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")];
    const tree = buildMerkleTree(leaves);
    expect(tree).toHaveLength(3);
    expect(tree[0]).toHaveLength(4);
    expect(tree[1]).toHaveLength(2);
    expect(tree[2]).toHaveLength(1);

    const h01 = sha256d(concat(leaves[0], leaves[1]));
    const h23 = sha256d(concat(leaves[2], leaves[3]));
    const root = sha256d(concat(h01, h23));
    expect(bytesToHex(tree[2][0])).toBe(bytesToHex(root));
  });
});

describe("computeMerkleRoot", () => {
  it("matches buildMerkleTree root", () => {
    const leaves = [leaf("a"), leaf("b"), leaf("c")];
    const tree = buildMerkleTree(leaves);
    const root = computeMerkleRoot(leaves);
    expect(bytesToHex(root)).toBe(bytesToHex(tree[tree.length - 1][0]));
  });
});

describe("getMerkleProof", () => {
  it("returns empty proof for single leaf", () => {
    expect(getMerkleProof([leaf("tx0")], 0)).toHaveLength(0);
  });

  it("returns 1 step for 2 leaves", () => {
    const leaves = [leaf("tx0"), leaf("tx1")];
    const proof = getMerkleProof(leaves, 0);
    expect(proof).toHaveLength(1);
    expect(proof[0].position).toBe("right");
    expect(bytesToHex(proof[0].hash)).toBe(bytesToHex(leaves[1]));
  });

  it("returns log2-ceiling steps for 4 leaves", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")];
    expect(getMerkleProof(leaves, 0)).toHaveLength(2);
    expect(getMerkleProof(leaves, 2)).toHaveLength(2);
  });

  it("returns 2 steps for 3 leaves", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2")];
    expect(getMerkleProof(leaves, 0)).toHaveLength(2);
    expect(getMerkleProof(leaves, 2)).toHaveLength(2);
  });

  it("proof verification — recompute root from leaf + proof", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")];
    const index = 2;
    const proof = getMerkleProof(leaves, index);
    const root = computeMerkleRoot(leaves);

    // Walk the proof to recompute root
    let current = leaves[index];
    for (const step of proof) {
      const combined = new Uint8Array(64);
      if (step.position === "left") {
        combined.set(step.hash, 0);
        combined.set(current, 32);
      } else {
        combined.set(current, 0);
        combined.set(step.hash, 32);
      }
      current = sha256d(combined);
    }

    expect(bytesToHex(current)).toBe(bytesToHex(root));
  });

  it("proof verification works for every leaf index", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3"), leaf("tx4")];
    const root = computeMerkleRoot(leaves);

    for (let i = 0; i < leaves.length; i++) {
      const proof = getMerkleProof(leaves, i);
      let current = leaves[i];
      for (const step of proof) {
        const combined = new Uint8Array(64);
        if (step.position === "left") {
          combined.set(step.hash, 0);
          combined.set(current, 32);
        } else {
          combined.set(current, 0);
          combined.set(step.hash, 32);
        }
        current = sha256d(combined);
      }
      expect(bytesToHex(current)).toBe(bytesToHex(root));
    }
  });
});
