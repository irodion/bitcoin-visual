import { memo } from "react";
import { motion } from "framer-motion";

type EdgeType = "outbound" | "inbound" | "attacker" | "anchor";

const EDGE_COLORS: Record<EdgeType, string> = {
  outbound: "var(--color-accent)",
  inbound: "var(--color-text-muted)",
  attacker: "var(--color-danger)",
  anchor: "var(--color-teal)",
};

interface NetworkEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  type: EdgeType;
  animated?: boolean;
}

export const NetworkEdge = memo(function NetworkEdge({
  x1,
  y1,
  x2,
  y2,
  active,
  type,
  animated = false,
}: NetworkEdgeProps) {
  const color = EDGE_COLORS[type];
  const isDashed = type === "anchor";
  const baseOpacity = active ? 0.5 : 0.12;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const duration = Math.max(0.8, Math.sqrt(dx * dx + dy * dy) / 60);

  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={active ? 1.5 : 0.8}
        strokeDasharray={isDashed ? "6 4" : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: baseOpacity }}
        transition={{ duration: 0.3 }}
      />
      {animated && active && (
        <>
          <motion.circle
            r={4}
            fill={color}
            opacity={0.3}
            initial={{ cx: x1, cy: y1 }}
            animate={{ cx: [x1, x2], cy: [y1, y2] }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            r={2.5}
            fill={color}
            initial={{ cx: x1, cy: y1 }}
            animate={{ cx: [x1, x2], cy: [y1, y2] }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </g>
  );
});
