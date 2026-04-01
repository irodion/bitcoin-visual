import type { MerkleProofStep } from "../../shared/crypto/merkle.ts";

export interface TreeEdge {
  parentLevel: number;
  parentIndex: number;
  childLevel: number;
  childIndex: number;
}

export type ProofEdgeRole = "target" | "sibling";

export interface ProofEdgeInfo {
  stepNumber: number;
  role: ProofEdgeRole;
}

/** Compound key for a tree edge: "parentLevel-parentIndex-childLevel-childIndex" */
export function edgeKey(
  parentLevel: number,
  parentIndex: number,
  childLevel: number,
  childIndex: number,
): string {
  return `${parentLevel}-${parentIndex}-${childLevel}-${childIndex}`;
}

/** Compound key for a tree node: "level-index" */
export function nodeKey(level: number, index: number): string {
  return `${level}-${index}`;
}

/**
 * Build all parent→child edges from a (possibly padded) merkle tree.
 * Levels are indexed [leaves, level1, ..., [root]].
 */
export function buildTreeEdges(treeLevels: Uint8Array[][]): TreeEdge[] {
  const edges: TreeEdge[] = [];
  for (let level = 1; level < treeLevels.length; level++) {
    const childLevel = level - 1;
    for (let parentIdx = 0; parentIdx < treeLevels[level].length; parentIdx++) {
      const leftChild = parentIdx * 2;
      const rightChild = parentIdx * 2 + 1;
      if (leftChild < treeLevels[childLevel].length) {
        edges.push({
          parentLevel: level,
          parentIndex: parentIdx,
          childLevel,
          childIndex: leftChild,
        });
      }
      if (rightChild < treeLevels[childLevel].length) {
        edges.push({
          parentLevel: level,
          parentIndex: parentIdx,
          childLevel,
          childIndex: rightChild,
        });
      }
    }
  }
  return edges;
}

/**
 * Map proof-path edges to step numbers and roles.
 * `paddedLevels` must include ghost duplicate nodes so sibling indices resolve correctly.
 */
export function buildProofEdgeMap(
  paddedLevels: Uint8Array[][],
  merkleProof: MerkleProofStep[],
  selectedTxIndex: number,
): Map<string, ProofEdgeInfo> {
  const map = new Map<string, ProofEdgeInfo>();
  let nodeIdx = selectedTxIndex;

  for (let i = 0; i < merkleProof.length; i++) {
    const childLevel = i;
    const parentLevel = i + 1;
    const parentIdx = Math.floor(nodeIdx / 2);

    // XOR toggles even↔odd; clamp to padded level bounds for ghost duplicates
    const siblingIdx = Math.min(nodeIdx ^ 1, paddedLevels[childLevel].length - 1);

    map.set(edgeKey(parentLevel, parentIdx, childLevel, nodeIdx), {
      stepNumber: i,
      role: "target",
    });

    map.set(edgeKey(parentLevel, parentIdx, childLevel, siblingIdx), {
      stepNumber: i,
      role: "sibling",
    });

    nodeIdx = parentIdx;
  }

  return map;
}
