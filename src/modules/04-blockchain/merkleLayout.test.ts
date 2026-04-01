import { describe, it, expect } from "vite-plus/test";
import { sha256d } from "../../shared/crypto/hash";
import { buildMerkleTree, getMerkleProof } from "../../shared/crypto/merkle";
import { buildTreeEdges, buildProofEdgeMap, edgeKey } from "./merkleLayout";

function leaf(s: string): Uint8Array {
  return sha256d(new TextEncoder().encode(s));
}

describe("buildTreeEdges", () => {
  it("returns no edges for a single-leaf tree", () => {
    const tree = buildMerkleTree([leaf("tx0")]);
    expect(buildTreeEdges(tree)).toHaveLength(0);
  });

  it("returns 2 edges for a 2-leaf tree", () => {
    const tree = buildMerkleTree([leaf("tx0"), leaf("tx1")]);
    const edges = buildTreeEdges(tree);
    expect(edges).toHaveLength(2);
    // Both edges: parent level 1 index 0 → children at level 0
    expect(edges[0]).toEqual({ parentLevel: 1, parentIndex: 0, childLevel: 0, childIndex: 0 });
    expect(edges[1]).toEqual({ parentLevel: 1, parentIndex: 0, childLevel: 0, childIndex: 1 });
  });

  it("returns 5 edges for a 3-leaf tree (odd duplication)", () => {
    const tree = buildMerkleTree([leaf("tx0"), leaf("tx1"), leaf("tx2")]);
    // Level 0: 3 leaves, Level 1: 2 nodes, Level 2: 1 root
    const edges = buildTreeEdges(tree);
    // Level 1→0: parent 0 has children 0,1; parent 1 has child 2 (only left, right=3 doesn't exist)
    // Level 2→1: parent 0 has children 0,1
    expect(edges).toHaveLength(5);
  });

  it("returns 6 edges for a 4-leaf tree", () => {
    const tree = buildMerkleTree([leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")]);
    // Level 0: 4 leaves, Level 1: 2 nodes, Level 2: 1 root
    const edges = buildTreeEdges(tree);
    // Level 1→0: 4 edges (parent 0→child 0,1; parent 1→child 2,3)
    // Level 2→1: 2 edges (parent 0→child 0,1)
    expect(edges).toHaveLength(6);
  });

  it("edge indices are correct for 4-leaf tree", () => {
    const tree = buildMerkleTree([leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")]);
    const edges = buildTreeEdges(tree);
    const keys = edges.map((e) =>
      edgeKey(e.parentLevel, e.parentIndex, e.childLevel, e.childIndex),
    );
    expect(keys).toContain("1-0-0-0");
    expect(keys).toContain("1-0-0-1");
    expect(keys).toContain("1-1-0-2");
    expect(keys).toContain("1-1-0-3");
    expect(keys).toContain("2-0-1-0");
    expect(keys).toContain("2-0-1-1");
  });
});

describe("buildProofEdgeMap", () => {
  it("returns empty map for a single-leaf tree", () => {
    const leaves = [leaf("tx0")];
    const tree = buildMerkleTree(leaves);
    const proof = getMerkleProof(leaves, 0);
    const map = buildProofEdgeMap(tree, proof, 0);
    expect(map.size).toBe(0);
  });

  it("returns 2 edges for a 2-leaf tree proof", () => {
    const leaves = [leaf("tx0"), leaf("tx1")];
    const tree = buildMerkleTree(leaves);
    const proof = getMerkleProof(leaves, 0);
    const map = buildProofEdgeMap(tree, proof, 0);
    // Step 0: parent(1,0) → target(0,0) and sibling(0,1)
    expect(map.size).toBe(2);
    expect(map.get("1-0-0-0")).toEqual({ stepNumber: 0, role: "target" });
    expect(map.get("1-0-0-1")).toEqual({ stepNumber: 0, role: "sibling" });
  });

  it("returns 4 edges for a 4-leaf tree proof (index 0)", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")];
    const tree = buildMerkleTree(leaves);
    const proof = getMerkleProof(leaves, 0);
    const map = buildProofEdgeMap(tree, proof, 0);
    // Step 0: parent(1,0) → target(0,0) + sibling(0,1)
    // Step 1: parent(2,0) → target(1,0) + sibling(1,1)
    expect(map.size).toBe(4);
    expect(map.get("1-0-0-0")).toEqual({ stepNumber: 0, role: "target" });
    expect(map.get("1-0-0-1")).toEqual({ stepNumber: 0, role: "sibling" });
    expect(map.get("2-0-1-0")).toEqual({ stepNumber: 1, role: "target" });
    expect(map.get("2-0-1-1")).toEqual({ stepNumber: 1, role: "sibling" });
  });

  it("returns 4 edges for a 4-leaf tree proof (index 3)", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2"), leaf("tx3")];
    const tree = buildMerkleTree(leaves);
    const proof = getMerkleProof(leaves, 3);
    const map = buildProofEdgeMap(tree, proof, 3);
    // Step 0: parent(1,1) → target(0,3) + sibling(0,2)
    // Step 1: parent(2,0) → target(1,1) + sibling(1,0)
    expect(map.size).toBe(4);
    expect(map.get("1-1-0-3")).toEqual({ stepNumber: 0, role: "target" });
    expect(map.get("1-1-0-2")).toEqual({ stepNumber: 0, role: "sibling" });
    expect(map.get("2-0-1-1")).toEqual({ stepNumber: 1, role: "target" });
    expect(map.get("2-0-1-0")).toEqual({ stepNumber: 1, role: "sibling" });
  });

  it("handles 3-leaf tree proof (index 2, odd duplication)", () => {
    const leaves = [leaf("tx0"), leaf("tx1"), leaf("tx2")];
    const tree = buildMerkleTree(leaves);
    const proof = getMerkleProof(leaves, 2);
    const map = buildProofEdgeMap(tree, proof, 2);
    // Step 0: parent(1,1) → target(0,2) + sibling is index 2^1=3 clamped to 2 (self)
    // Both target and sibling map to the same key "1-1-0-2", sibling overwrites target
    expect(map.size).toBe(3);
    expect(map.get("1-1-0-2")).toEqual({ stepNumber: 0, role: "sibling" });
    // Step 1: parent(2,0) → target(1,1) + sibling(1,0)
    expect(map.get("2-0-1-1")).toEqual({ stepNumber: 1, role: "target" });
    expect(map.get("2-0-1-0")).toEqual({ stepNumber: 1, role: "sibling" });
  });
});
