import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  sampleCurve,
  snapToCurve,
  clipLine,
  clipVerticalLine,
  type RealPoint,
  type RealECPoint,
  type RealAdditionDetail,
} from "../../shared/crypto/realCurve.ts";

// ── Layout ──

const SVG_SIZE = 640;
const PADDING = 40;

// Math viewport
const MATH_X_MIN = -1;
const MATH_X_MAX = 8;
const MATH_Y_MIN = -25;
const MATH_Y_MAX = 25;

function toSvgX(x: number): number {
  return PADDING + ((x - MATH_X_MIN) / (MATH_X_MAX - MATH_X_MIN)) * (SVG_SIZE - 2 * PADDING);
}

function toSvgY(y: number): number {
  return (
    SVG_SIZE - PADDING - ((y - MATH_Y_MIN) / (MATH_Y_MAX - MATH_Y_MIN)) * (SVG_SIZE - 2 * PADDING)
  );
}

function toMathX(svgX: number): number {
  return MATH_X_MIN + ((svgX - PADDING) / (SVG_SIZE - 2 * PADDING)) * (MATH_X_MAX - MATH_X_MIN);
}

function toMathY(svgY: number): number {
  return (
    MATH_Y_MIN +
    ((SVG_SIZE - PADDING - svgY) / (SVG_SIZE - 2 * PADDING)) * (MATH_Y_MAX - MATH_Y_MIN)
  );
}

// ── Grid ──

const X_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const Y_TICKS = [-20, -10, 0, 10, 20];

function GridLines() {
  return (
    <g>
      {/* X-axis (y=0) */}
      <line
        x1={PADDING}
        y1={toSvgY(0)}
        x2={SVG_SIZE - PADDING}
        y2={toSvgY(0)}
        stroke="var(--color-text-muted)"
        strokeWidth={1}
        strokeOpacity={0.3}
      />
      {/* Y-axis (x=0) */}
      <line
        x1={toSvgX(0)}
        y1={PADDING}
        x2={toSvgX(0)}
        y2={SVG_SIZE - PADDING}
        stroke="var(--color-text-muted)"
        strokeWidth={1}
        strokeOpacity={0.3}
      />

      {X_TICKS.map((v) => (
        <g key={`x${v}`}>
          <line
            x1={toSvgX(v)}
            y1={PADDING}
            x2={toSvgX(v)}
            y2={SVG_SIZE - PADDING}
            stroke="var(--color-border)"
            strokeWidth={0.5}
          />
          <text
            x={toSvgX(v)}
            y={SVG_SIZE - 10}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}

      {Y_TICKS.map((v) => (
        <g key={`y${v}`}>
          <line
            x1={PADDING}
            y1={toSvgY(v)}
            x2={SVG_SIZE - PADDING}
            y2={toSvgY(v)}
            stroke="var(--color-border)"
            strokeWidth={0.5}
          />
          <text
            x={12}
            y={toSvgY(v) + 4}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

// ── Curve polyline ──

function CurvePolyline() {
  const { upperStr, lowerStr } = useMemo(() => {
    const upper = sampleCurve(MATH_X_MIN, MATH_X_MAX, 500);
    return {
      upperStr: upper.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" "),
      lowerStr: upper.map((p) => `${toSvgX(p.x)},${toSvgY(-p.y)}`).join(" "),
    };
  }, []);

  return (
    <g>
      <motion.polyline
        points={upperStr}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.polyline
        points={lowerStr}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </g>
  );
}

// ── Curve equation label ──

function CurveLabel() {
  return (
    <text
      x={SVG_SIZE - PADDING - 4}
      y={PADDING + 16}
      textAnchor="end"
      fill="var(--color-text-muted)"
      fontSize={12}
      fontFamily="var(--font-mono)"
      opacity={0.6}
    >
      y² = x³ + 9x + 1
    </text>
  );
}

// ── Point marker ──

function PointMarker({
  point,
  label,
  color,
  pulsing,
}: {
  point: RealPoint;
  label: string;
  color: string;
  pulsing?: boolean;
}) {
  const cx = toSvgX(point.x);
  const cy = toSvgY(point.y);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.circle
        cx={cx}
        cy={cy}
        r={7}
        fill={color}
        animate={pulsing ? { r: [7, 9, 7] } : {}}
        transition={pulsing ? { r: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } } : {}}
      />
      <text
        x={cx + 12}
        y={cy - 10}
        fill={color}
        fontSize={13}
        fontWeight={700}
        fontFamily="var(--font-mono)"
      >
        {label}
      </text>
    </motion.g>
  );
}

// ── Construction lines ──

function ConstructionLines({
  P,
  detail,
  step,
  isInfinity,
}: {
  P: RealPoint;
  detail: RealAdditionDetail | null;
  step: number;
  isInfinity: boolean;
}) {
  // Step 1: Draw secant/tangent line
  const lineEndpoints = useMemo(() => {
    if (isInfinity) {
      return clipVerticalLine(P.x, MATH_Y_MIN, MATH_Y_MAX);
    }
    if (!detail) return null;
    return clipLine(P.x, P.y, detail.slope, MATH_X_MIN, MATH_X_MAX, MATH_Y_MIN, MATH_Y_MAX);
  }, [P, detail, isInfinity]);

  return (
    <g>
      {/* Step 1: Secant/tangent line */}
      {step >= 1 && lineEndpoints && (
        <motion.line
          x1={toSvgX(lineEndpoints[0].x)}
          y1={toSvgY(lineEndpoints[0].y)}
          x2={toSvgX(lineEndpoints[1].x)}
          y2={toSvgY(lineEndpoints[1].y)}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          strokeOpacity={0.7}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}

      {detail && (
        <>
          {/* Step 2: Third intersection point (pre-reflection) */}
          {step >= 2 && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <circle
                cx={toSvgX(detail.thirdIntersection.x)}
                cy={toSvgY(detail.thirdIntersection.y)}
                r={6}
                fill="none"
                stroke="var(--color-info)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <text
                x={toSvgX(detail.thirdIntersection.x) + 12}
                y={toSvgY(detail.thirdIntersection.y) - 10}
                fill="var(--color-info)"
                fontSize={12}
                fontWeight={600}
                fontFamily="var(--font-mono)"
              >
                R′
              </text>
            </motion.g>
          )}

          {/* Step 3: Vertical reflection line */}
          {step >= 3 && (
            <motion.line
              x1={toSvgX(detail.thirdIntersection.x)}
              y1={toSvgY(detail.thirdIntersection.y)}
              x2={toSvgX(detail.x3)}
              y2={toSvgY(detail.y3)}
              stroke="var(--color-success)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}

          {/* Step 4: Result point */}
          {step >= 4 && (
            <PointMarker
              point={{ x: detail.x3, y: detail.y3 }}
              label="R"
              color="var(--color-success)"
              pulsing
            />
          )}
        </>
      )}
    </g>
  );
}

// ── Main Component ──

export interface RealCurveGridProps {
  pointP: RealPoint | null;
  pointQ: RealPoint | null;
  doublingMode: boolean;
  additionResult: RealECPoint | null;
  additionDetail: RealAdditionDetail | null;
  constructionStep: number;
  onPointClick: (point: RealPoint) => void;
  selectionMode: "selectP" | "selectQ" | "none";
}

export function RealCurveGrid({
  pointP,
  pointQ,
  doublingMode,
  additionResult,
  additionDetail,
  constructionStep,
  onPointClick,
  selectionMode,
}: RealCurveGridProps) {
  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (selectionMode === "none") return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const mathX = toMathX(svgX);
    const mathY = toMathY(svgY);

    const snapped = snapToCurve(mathX, mathY, MATH_X_MIN, MATH_X_MAX);
    onPointClick(snapped);
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGSVGElement>) {
    if ((e.key === "Enter" || e.key === " ") && selectionMode !== "none") {
      e.preventDefault();
      // Place at a default position for keyboard users
      const defaultPoint = { x: 2, y: Math.sqrt(2 * 2 * 2 + 9 * 2 + 1) };
      onPointClick(defaultPoint);
    }
  }

  const effectiveQ = doublingMode ? pointP : pointQ;
  const isInfinity = additionResult === "infinity";

  const cursorHint =
    selectionMode === "selectP"
      ? "Click on the curve to place P"
      : selectionMode === "selectQ"
        ? "Click on the curve to place Q"
        : null;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {cursorHint && (
        <div className="mb-2 text-center text-xs font-medium text-text-secondary">{cursorHint}</div>
      )}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full"
        style={{ cursor: selectionMode !== "none" ? "crosshair" : "default" }}
        role="img"
        aria-label="Elliptic curve y² = x³ + 9x + 1 over the real numbers"
        onClick={handleSvgClick}
        onKeyDown={handleKeyDown}
        tabIndex={selectionMode !== "none" ? 0 : undefined}
      >
        <GridLines />
        <CurvePolyline />
        <CurveLabel />

        {/* Construction lines (when both points selected) */}
        {pointP && effectiveQ && (
          <ConstructionLines
            P={pointP}
            detail={additionDetail}
            step={constructionStep}
            isInfinity={isInfinity}
          />
        )}

        {/* Selected points */}
        {pointP && <PointMarker point={pointP} label="P" color="var(--color-accent)" />}
        {!doublingMode && pointQ && (
          <PointMarker point={pointQ} label="Q" color="var(--color-teal)" />
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
        {pointP && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />P
          </span>
        )}
        {!doublingMode && pointQ && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal" />Q
          </span>
        )}
        {additionDetail && constructionStep >= 2 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-info bg-transparent" />
            R′ intersection
          </span>
        )}
        {additionDetail && constructionStep >= 4 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />R = P + Q
          </span>
        )}
      </div>
    </div>
  );
}
