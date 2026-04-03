import { memo, useState } from "react";
import { motion } from "framer-motion";
import type { NodeState } from "./networkConstants.ts";

const STATE_COLORS: Record<NodeState, string> = {
  uninformed: "var(--color-text-muted)",
  informed: "var(--color-accent)",
  source: "var(--color-teal)",
  honest: "var(--color-teal)",
  attacker: "var(--color-danger)",
  victim: "var(--color-accent)",
};

const STATE_OPACITY: Record<NodeState, number> = {
  uninformed: 0.3,
  informed: 1,
  source: 1,
  honest: 1,
  attacker: 1,
  victim: 1,
};

interface NetworkNodeProps {
  id: string;
  label: string;
  cx: number;
  cy: number;
  state: NodeState;
  size?: number;
  onClick?: () => void;
  /** Override the state-derived color (e.g., for hop-distance heat map) */
  colorOverride?: string;
  /** Override the state-derived opacity */
  opacityOverride?: number;
}

export const NetworkNode = memo(function NetworkNode({
  id,
  label,
  cx,
  cy,
  state,
  size = 14,
  onClick,
  colorOverride,
  opacityOverride,
}: NetworkNodeProps) {
  const color = colorOverride ?? STATE_COLORS[state];
  const opacity = opacityOverride ?? STATE_OPACITY[state];
  const showGlow = state === "informed" || state === "source" || state === "victim";
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <g
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Node ${label} — click to broadcast` : `Node ${label}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      onFocus={onClick ? () => setFocused(true) : undefined}
      onBlur={onClick ? () => setFocused(false) : undefined}
      style={{ cursor: onClick ? "pointer" : "default", outline: "none" }}
      data-testid={`network-node-${id}`}
    >
      {/* Keyboard focus ring */}
      {focused && onClick && (
        <circle
          cx={cx}
          cy={cy}
          r={size + 6}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}
      {showGlow && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={size + 4}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <motion.circle
        cx={cx}
        cy={cy}
        r={size}
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0.3 }}
        animate={{ opacity, fill: color, stroke: color }}
        transition={{ duration: 0.3 }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-text-primary)"
        fontSize={10}
        fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
});
