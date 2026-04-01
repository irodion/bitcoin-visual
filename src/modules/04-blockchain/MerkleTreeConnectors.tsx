import { useEffect, useLayoutEffect, useRef, useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import type { TreeEdge, ProofEdgeInfo } from "./merkleLayout.ts";
import { edgeKey, nodeKey } from "./merkleLayout.ts";

interface NodePosition {
  cx: number;
  top: number;
  bottom: number;
}

interface MerkleTreeConnectorsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  nodeRefs: React.RefObject<Map<string, HTMLElement>>;
  treeEdges: TreeEdge[];
  proofEdgeMap: Map<string, ProofEdgeInfo>;
  /** null = show all steps, number = show steps 0..maxVisibleStep */
  maxVisibleStep: number | null;
  hasActiveProof: boolean;
  levelCount: number;
}

export const MerkleTreeConnectors = memo(function MerkleTreeConnectors({
  containerRef,
  nodeRefs,
  treeEdges,
  proofEdgeMap,
  maxVisibleStep,
  hasActiveProof,
  levelCount,
}: MerkleTreeConnectorsProps) {
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const prevSizeRef = useRef({ width: 0, height: 0 });
  const outerRafRef = useRef(0);
  const innerRafRef = useRef(0);

  const measure = useCallback(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Skip state update if container size hasn't changed
    const prev = prevSizeRef.current;
    if (prev.width !== rect.width || prev.height !== rect.height) {
      prevSizeRef.current = { width: rect.width, height: rect.height };
      setSize({ width: rect.width, height: rect.height });
    }

    const next = new Map<string, NodePosition>();
    const refs = nodeRefs.current;
    for (const [key, el] of refs) {
      const r = el.getBoundingClientRect();
      next.set(key, {
        cx: r.left + r.width / 2 - rect.left,
        top: r.top - rect.top,
        bottom: r.top + r.height - rect.top,
      });
    }
    setPositions(next);
  }, [containerRef, nodeRefs]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, measure, treeEdges, levelCount]);

  // Re-measure after paint to catch positions missed during entry animation
  useEffect(() => {
    outerRafRef.current = requestAnimationFrame(() => {
      innerRafRef.current = requestAnimationFrame(measure);
    });
    return () => {
      cancelAnimationFrame(outerRafRef.current);
      cancelAnimationFrame(innerRafRef.current);
    };
  }, [measure, treeEdges, levelCount]);

  if (positions.size === 0 || size.width === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={size.width}
      height={size.height}
      style={{ overflow: "visible" }}
    >
      {treeEdges.map((edge) => {
        const parentPos = positions.get(nodeKey(edge.parentLevel, edge.parentIndex));
        const childPos = positions.get(nodeKey(edge.childLevel, edge.childIndex));
        if (!parentPos || !childPos) return null;

        const key = edgeKey(edge.parentLevel, edge.parentIndex, edge.childLevel, edge.childIndex);
        const proofInfo = proofEdgeMap.get(key);
        const isProofEdge = proofInfo != null;
        const isVisible =
          !isProofEdge || maxVisibleStep === null || proofInfo.stepNumber <= maxVisibleStep;

        let opacity: number;
        if (hasActiveProof) {
          opacity = isProofEdge && isVisible ? 1 : 0.06;
        } else {
          opacity = 1;
        }

        const isHighlighted = isProofEdge && isVisible;
        const isTarget = isHighlighted && proofInfo.role === "target";
        const edgeColor = isHighlighted
          ? isTarget
            ? "var(--color-accent)"
            : "var(--color-teal)"
          : "var(--color-text-muted)";
        const strokeWidth = isHighlighted ? 2 : 1;

        const x1 = parentPos.cx;
        const y1 = parentPos.bottom;
        const x2 = childPos.cx;
        const y2 = childPos.top;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={key}>
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={edgeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isHighlighted ? "none" : "4 3"}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ duration: 0.3 }}
            />
            {isHighlighted && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                style={{ transformOrigin: `${mx}px ${my}px` }}
              >
                <circle
                  cx={mx}
                  cy={my}
                  r={11}
                  fill={isTarget ? "var(--color-accent)" : "var(--color-surface-raised)"}
                  stroke={isTarget ? "none" : "var(--color-teal)"}
                  strokeWidth={isTarget ? 0 : 1.5}
                />
                <text
                  x={mx}
                  y={my}
                  dy="0.35em"
                  textAnchor="middle"
                  fill={isTarget ? "#fff" : "var(--color-teal)"}
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  {proofInfo.stepNumber + 1}
                </text>
              </motion.g>
            )}
          </g>
        );
      })}
    </svg>
  );
});
