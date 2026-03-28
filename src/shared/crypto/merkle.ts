import { sha256d } from "./hash";

export interface MerkleProofStep {
  hash: Uint8Array;
  position: "left" | "right";
}

/**
 * Build a full Merkle tree from leaf hashes.
 * Returns array of levels: [leaves, level1, level2, ..., [root]].
 * Bitcoin rule: if odd number of nodes at a level, duplicate the last one.
 */
export function buildMerkleTree(leaves: Uint8Array[]): Uint8Array[][] {
  if (leaves.length === 0) return [[new Uint8Array(32)]];

  const levels: Uint8Array[][] = [leaves];
  let current = leaves;

  while (current.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] ?? current[i]; // duplicate last if odd
      const combined = new Uint8Array(64);
      combined.set(left, 0);
      combined.set(right, 32);
      next.push(sha256d(combined));
    }
    levels.push(next);
    current = next;
  }

  return levels;
}

/**
 * Compute the Merkle root of a list of leaf hashes.
 */
export function computeMerkleRoot(leaves: Uint8Array[]): Uint8Array {
  const tree = buildMerkleTree(leaves);
  return tree[tree.length - 1][0];
}

/**
 * Get the minimum set of sibling hashes needed to prove inclusion of leaves[index].
 * Each step contains the sibling hash and whether it sits on the left or right.
 */
export function getMerkleProof(leaves: Uint8Array[], index: number): MerkleProofStep[] {
  if (leaves.length <= 1) return [];

  const tree = buildMerkleTree(leaves);
  const proof: MerkleProofStep[] = [];
  let idx = index;

  for (let level = 0; level < tree.length - 1; level++) {
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : Math.min(idx + 1, tree[level].length - 1);
    proof.push({
      hash: tree[level][siblingIdx],
      position: isRight ? "left" : "right",
    });
    idx = Math.floor(idx / 2);
  }

  return proof;
}
