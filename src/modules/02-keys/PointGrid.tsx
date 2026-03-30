import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  allCurvePoints,
  pointEquals,
  type ECPoint,
  type AffinePoint,
} from "../../shared/crypto/toyEC.ts";

// ── Layout constants ──

const SVG_SIZE = 640;
const PADDING = 30;
const FIELD = 61;
const CELL = (SVG_SIZE - 2 * PADDING) / (FIELD - 1);

function toSvgX(x: bigint): number {
  return PADDING + Number(x) * CELL;
}

function toSvgY(y: bigint): number {
  return SVG_SIZE - PADDING - Number(y) * CELL;
}

// ── Grid Labels ──

const AXIS_TICKS = [0, 10, 20, 30, 40, 50, 60];

function GridLines() {
  return (
    <g>
      {AXIS_TICKS.map((v) => {
        const px = PADDING + v * CELL;
        const py = SVG_SIZE - PADDING - v * CELL;
        return (
          <g key={v}>
            {/* Vertical grid line */}
            <line
              x1={px}
              y1={PADDING}
              x2={px}
              y2={SVG_SIZE - PADDING}
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
            {/* Horizontal grid line */}
            <line
              x1={PADDING}
              y1={py}
              x2={SVG_SIZE - PADDING}
              y2={py}
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
            {/* X-axis label */}
            <text
              x={px}
              y={SVG_SIZE - 8}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {v}
            </text>
            {/* Y-axis label */}
            <text
              x={8}
              y={py + 4}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── Tooltip ──

function PointTooltip({ point, svgX, svgY }: { point: AffinePoint; svgX: number; svgY: number }) {
  const above = svgY > SVG_SIZE / 2;
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <rect
        x={svgX - 32}
        y={above ? svgY - 28 : svgY + 12}
        width={64}
        height={20}
        rx={6}
        fill="var(--color-surface-raised)"
        stroke="var(--color-border-strong)"
        strokeWidth={0.8}
      />
      <text
        x={svgX}
        y={above ? svgY - 14 : svgY + 26}
        textAnchor="middle"
        fill="var(--color-text-primary)"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fontWeight={500}
      >
        ({point.x.toString()}, {point.y.toString()})
      </text>
    </motion.g>
  );
}

// ── Point Dot ──

interface PointDotProps {
  point: AffinePoint;
  index: number;
  role: "default" | "selectedP" | "selectedQ" | "result" | "trace";
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const ROLE_STYLES = {
  default: { fill: "var(--color-text-muted)", r: 4, opacity: 0.4 },
  selectedP: { fill: "var(--color-accent)", r: 6, opacity: 1 },
  selectedQ: { fill: "var(--color-teal)", r: 6, opacity: 1 },
  result: { fill: "var(--color-success)", r: 6, opacity: 1 },
  trace: { fill: "var(--color-info)", r: 5, opacity: 0.8 },
} as const;

function PointDot({ point, index, role, onClick, onHoverStart, onHoverEnd }: PointDotProps) {
  const style = ROLE_STYLES[role];
  const cx = toSvgX(point.x);
  const cy = toSvgY(point.y);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={style.r}
      fill={style.fill}
      fillOpacity={style.opacity}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: style.opacity,
        scale: 1,
        ...(role === "result" ? { r: [6, 8, 6] } : {}),
      }}
      transition={{
        duration: 0.25,
        delay: role === "default" ? index * 0.002 : 0,
        ...(role === "result" ? { r: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } } : {}),
      }}
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `Point (${point.x}, ${point.y})` : undefined}
    />
  );
}

// ── Main Component ──

export interface PointGridProps {
  selectedP?: ECPoint | null;
  selectedQ?: ECPoint | null;
  resultPoint?: ECPoint | null;
  tracePoints?: ECPoint[];
  onPointClick?: (point: AffinePoint) => void;
  selectionMode?: "selectP" | "selectQ" | "none";
}

export function PointGrid({
  selectedP = null,
  selectedQ = null,
  resultPoint = null,
  tracePoints = [],
  onPointClick,
  selectionMode = "none",
}: PointGridProps) {
  const points = useMemo(() => allCurvePoints(), []);
  const [hoveredPoint, setHoveredPoint] = useState<AffinePoint | null>(null);

  const traceSet = useMemo(() => {
    const set = new Set<string>();
    for (const tp of tracePoints) {
      if (tp !== "infinity") set.add(`${tp.x},${tp.y}`);
    }
    return set;
  }, [tracePoints]);

  function getRole(pt: AffinePoint): PointDotProps["role"] {
    if (resultPoint && resultPoint !== "infinity" && pointEquals(pt, resultPoint)) return "result";
    if (selectedP && selectedP !== "infinity" && pointEquals(pt, selectedP)) return "selectedP";
    if (selectedQ && selectedQ !== "infinity" && pointEquals(pt, selectedQ)) return "selectedQ";
    if (traceSet.has(`${pt.x},${pt.y}`)) return "trace";
    return "default";
  }

  const cursorHint =
    selectionMode === "selectP"
      ? "Click a point to select P"
      : selectionMode === "selectQ"
        ? "Click a point to select Q"
        : null;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {cursorHint && (
        <div className="mb-2 text-center text-xs font-medium text-text-secondary">{cursorHint}</div>
      )}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        role="img"
        aria-label={`Elliptic curve points over F\u2082\u2081: 72 points on y\u00B2 = x\u00B3 + 9x + 1`}
      >
        <GridLines />

        {/* All curve points */}
        {points.map((pt, i) => {
          const role = getRole(pt);
          return (
            <PointDot
              key={`${pt.x}-${pt.y}`}
              point={pt}
              index={i}
              role={role}
              onClick={onPointClick ? () => onPointClick(pt) : undefined}
              onHoverStart={() => setHoveredPoint(pt)}
              onHoverEnd={() => setHoveredPoint(null)}
            />
          );
        })}

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredPoint && (
            <PointTooltip
              key={`tip-${hoveredPoint.x}-${hoveredPoint.y}`}
              point={hoveredPoint}
              svgX={toSvgX(hoveredPoint.x)}
              svgY={toSvgY(hoveredPoint.y)}
            />
          )}
        </AnimatePresence>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
        {selectedP && selectedP !== "infinity" && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />P
          </span>
        )}
        {selectedQ && selectedQ !== "infinity" && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal" />Q
          </span>
        )}
        {resultPoint && resultPoint !== "infinity" && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
            Result
          </span>
        )}
        {tracePoints.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-info" />
            Trace
          </span>
        )}
      </div>
    </div>
  );
}
