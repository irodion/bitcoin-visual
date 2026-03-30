import { motion } from "framer-motion";
import type { SecurityModel, GraphNode, GraphEdge } from "./securityModelsData.ts";

// ── Node type icons (16×16 SVG paths) ──

const NODE_ICONS: Record<GraphNode["type"], string> = {
  user: "M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 9a5 5 0 0 1 10 0H3Z",
  key: "M12.5 3a2.5 2.5 0 0 0-4.96.44L2 9l1.5 1.5L5 9l1.5 1.5L8 9l.54-.56a2.5 2.5 0 0 0 3.96-5.44ZM11 4.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z",
  device:
    "M5 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H5Zm3 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  oracle:
    "M8 2C4.7 2 2 4.6 2 6.5S4.7 11 8 11s6-2.6 6-4.5S11.3 2 8 2Zm0 7.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Zm0-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM2 12v1c0 1.7 2.7 3 6 3s6-1.3 6-3v-1c-1.5 1.2-3.6 2-6 2s-4.5-.8-6-2Z",
  custodian: "M8 1L1 5v1h14V5L8 1ZM3 8v4h2V8H3Zm4 0v4h2V8H7Zm4 0v4h2V8h-2ZM1 14v1h14v-1H1Z",
  arbitrator: "M8 1L2 5h2v5H2l6 5 6-5h-2V5h2L8 1ZM6 5v5h4V5H6Z",
};

const EDGE_COLORS: Record<GraphEdge["type"], string> = {
  control: "var(--color-accent)",
  cosign: "var(--color-teal)",
  policy: "var(--color-info)",
};

const NODE_WIDTH = 90;
const NODE_HEIGHT = 54;

// ── Sub-components ──

function NodeIcon({ type }: { type: GraphNode["type"] }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d={NODE_ICONS[type]} />
    </svg>
  );
}

function GraphNodeElement({ node, index }: { node: GraphNode; index: number }) {
  const cx = node.x;
  const cy = node.y;
  const rx = NODE_WIDTH / 2;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      {/* Vulnerability pulse */}
      {node.vulnerable && (
        <motion.rect
          x={cx - rx - 4}
          y={cy - NODE_HEIGHT / 2 - 4}
          width={NODE_WIDTH + 8}
          height={NODE_HEIGHT + 8}
          rx={16}
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Node background */}
      <rect
        x={cx - rx}
        y={cy - NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={12}
        fill="var(--color-surface)"
        stroke={node.vulnerable ? "var(--color-danger)" : "var(--color-border-secondary)"}
        strokeWidth={1.2}
      />

      {/* Icon */}
      <g
        transform={`translate(${cx - 8}, ${cy - 18})`}
        style={{ color: "var(--color-text-secondary)" }}
      >
        <NodeIcon type={node.type} />
      </g>

      {/* Label */}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="var(--color-text-primary)"
        fontSize={10}
        fontFamily="var(--font-sans)"
        fontWeight={500}
      >
        {node.label}
      </text>
    </motion.g>
  );
}

function GraphEdgeElement({
  edge,
  nodes,
  index,
  markerId,
}: {
  edge: GraphEdge;
  nodes: GraphNode[];
  index: number;
  markerId: string;
}) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const color = EDGE_COLORS[edge.type];
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;

  // Shorten line to avoid overlapping node rects
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const pad = 30;
  const x1 = from.x + (dx / len) * pad;
  const y1 = from.y + (dy / len) * pad;
  const x2 = to.x - (dx / len) * pad;
  const y2 = to.y - (dy / len) * pad;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
    >
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.7}
        markerEnd={`url(#${markerId}-${edge.type})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 + index * 0.08 }}
      />
      {edge.label && (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize={9}
          fontFamily="var(--font-sans)"
          fontWeight={400}
        >
          {edge.label}
        </text>
      )}
    </motion.g>
  );
}

// ── Main Component ──

interface ModelGraphProps {
  model: SecurityModel;
}

export function ModelGraph({ model }: ModelGraphProps) {
  const markerId = `arrow-${model.id}`;

  return (
    <div className="mx-auto w-full max-w-lg">
      <svg
        viewBox="0 0 400 280"
        className="w-full"
        role="img"
        aria-label={`${model.title} model: ${model.subtitle}. ${model.quorum} quorum with ${model.nodes.length} participants.`}
      >
        <defs>
          {(["control", "cosign", "policy"] as const).map((type) => (
            <marker
              key={type}
              id={`${markerId}-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" fill={EDGE_COLORS[type]} />
            </marker>
          ))}
        </defs>

        {/* Edges (render below nodes) */}
        {model.edges.map((edge, i) => (
          <GraphEdgeElement
            key={`${edge.from}-${edge.to}`}
            edge={edge}
            nodes={model.nodes}
            index={i}
            markerId={markerId}
          />
        ))}

        {/* Nodes */}
        {model.nodes.map((node, i) => (
          <GraphNodeElement key={node.id} node={node} index={i} />
        ))}
      </svg>
    </div>
  );
}
