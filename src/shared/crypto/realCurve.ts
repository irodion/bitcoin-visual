/**
 * Real-number elliptic curve math for y² = x³ + 9x + 1 over ℝ.
 * Used for geometric visualization of point addition.
 */

// ── Types ──

export interface RealPoint {
  x: number;
  y: number;
}

export type RealECPoint = RealPoint | "infinity";

export interface RealAdditionDetail {
  slope: number;
  x3: number;
  y3: number;
  /** The raw third intersection before reflection (for drawing construction). */
  thirdIntersection: RealPoint;
}

// ── Constants ──

const A = 9;
const B = 1;
const EPS = 1e-9;

/** Minimum x where the curve exists: real root of x³ + 9x + 1 = 0. */
export const CURVE_X_MIN = (() => {
  // Newton's method: f(x) = x³ + 9x + 1, f'(x) = 3x² + 9
  let x = -0.1;
  for (let i = 0; i < 20; i++) {
    const f = x * x * x + A * x + B;
    const fp = 3 * x * x + A;
    x -= f / fp;
  }
  return x;
})();

// ── Curve evaluation ──

/** Evaluate x³ + 9x + 1. */
function curveRhs(x: number): number {
  return x * x * x + A * x + B;
}

/**
 * Upper-branch y value at x: √(x³ + 9x + 1).
 * Returns null if x is left of the curve (rhs < 0).
 */
export function curveY(x: number): number | null {
  const rhs = curveRhs(x);
  if (rhs < 0) return null;
  return Math.sqrt(rhs);
}

// ── Sampling ──

/**
 * Sample points along the upper branch for polyline rendering.
 * Uses adaptive density near the cusp where the curve is steep.
 */
export function sampleCurve(xMin: number, xMax: number, numSamples: number): RealPoint[] {
  const effectiveMin = Math.max(xMin, CURVE_X_MIN);
  if (effectiveMin >= xMax) return [];

  const points: RealPoint[] = [];
  const range = xMax - effectiveMin;

  for (let i = 0; i <= numSamples; i++) {
    // Use sqrt parameterization for denser sampling near the cusp
    const t = i / numSamples;
    const x = effectiveMin + range * t * t; // quadratic spacing: denser at start
    const y = curveY(x);
    if (y !== null) {
      points.push({ x, y });
    }
  }

  return points;
}

// ── Snap to curve ──

/**
 * Find the point on the curve nearest to a click in math coordinates.
 * Picks upper or lower branch based on sign of clickY.
 */
export function snapToCurve(clickX: number, clickY: number, xMin: number, xMax: number): RealPoint {
  // Clamp x to valid curve range
  const lo = Math.max(xMin, CURVE_X_MIN);
  const hi = xMax;

  const branch = clickY >= 0 ? 1 : -1;

  function dist(x: number): number {
    const y = curveY(x);
    if (y === null) return Infinity;
    const dy = branch * y - clickY;
    return (x - clickX) * (x - clickX) + dy * dy;
  }

  // Ternary search on [lo, hi]
  let a = lo;
  let b = hi;
  for (let i = 0; i < 60; i++) {
    const m1 = a + (b - a) / 3;
    const m2 = b - (b - a) / 3;
    if (dist(m1) < dist(m2)) {
      b = m2;
    } else {
      a = m1;
    }
  }
  const bestX = (a + b) / 2;

  const yVal = curveY(bestX) ?? 0;
  return { x: bestX, y: branch * yVal };
}

// ── Point addition over ℝ ──

/**
 * Add two distinct points on the real curve.
 * Returns null if result is point at infinity.
 */
export function realPointAdd(P: RealPoint, Q: RealPoint): RealAdditionDetail | null {
  // Check for vertical line (P + (-P) = ∞)
  if (Math.abs(P.x - Q.x) < EPS) {
    return null; // infinity
  }

  const slope = (Q.y - P.y) / (Q.x - P.x);
  const x3 = slope * slope - P.x - Q.x;
  const yAtIntersection = slope * (x3 - P.x) + P.y;
  const y3 = -yAtIntersection; // reflect over x-axis

  return {
    slope,
    x3,
    y3,
    thirdIntersection: { x: x3, y: yAtIntersection },
  };
}

/**
 * Double a point on the real curve (tangent line).
 * Returns null if y = 0 (vertical tangent → infinity).
 */
export function realPointDouble(P: RealPoint): RealAdditionDetail | null {
  if (Math.abs(P.y) < EPS) {
    return null; // vertical tangent → infinity
  }

  const slope = (3 * P.x * P.x + A) / (2 * P.y);
  const x3 = slope * slope - 2 * P.x;
  const yAtIntersection = slope * (x3 - P.x) + P.y;
  const y3 = -yAtIntersection;

  return {
    slope,
    x3,
    y3,
    thirdIntersection: { x: x3, y: yAtIntersection },
  };
}

// ── Line clipping ──

/**
 * Clip a line defined by a point and slope to a rectangular viewport.
 * Returns two endpoints for rendering, or null if the line doesn't intersect the viewport.
 */
export function clipLine(
  px: number,
  py: number,
  slope: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): [RealPoint, RealPoint] | null {
  // y = slope * (x - px) + py
  // Collect intersection points with viewport edges
  const intersections: RealPoint[] = [];

  // Left edge: x = xMin
  const yAtLeft = slope * (xMin - px) + py;
  if (yAtLeft >= yMin && yAtLeft <= yMax) {
    intersections.push({ x: xMin, y: yAtLeft });
  }

  // Right edge: x = xMax
  const yAtRight = slope * (xMax - px) + py;
  if (yAtRight >= yMin && yAtRight <= yMax) {
    intersections.push({ x: xMax, y: yAtRight });
  }

  // Bottom edge: y = yMin
  if (Math.abs(slope) > EPS) {
    const xAtBottom = (yMin - py) / slope + px;
    if (xAtBottom >= xMin && xAtBottom <= xMax) {
      intersections.push({ x: xAtBottom, y: yMin });
    }
  }

  // Top edge: y = yMax
  if (Math.abs(slope) > EPS) {
    const xAtTop = (yMax - py) / slope + px;
    if (xAtTop >= xMin && xAtTop <= xMax) {
      intersections.push({ x: xAtTop, y: yMax });
    }
  }

  if (intersections.length < 2) return null;

  // Return the two most distant points
  let maxDist = 0;
  let a = intersections[0];
  let b = intersections[1];
  for (let i = 0; i < intersections.length; i++) {
    for (let j = i + 1; j < intersections.length; j++) {
      const dx = intersections[i].x - intersections[j].x;
      const dy = intersections[i].y - intersections[j].y;
      const d = dx * dx + dy * dy;
      if (d > maxDist) {
        maxDist = d;
        a = intersections[i];
        b = intersections[j];
      }
    }
  }

  return [a, b];
}

/**
 * Clip a vertical line (x = constX) to viewport.
 */
export function clipVerticalLine(
  constX: number,
  yMin: number,
  yMax: number,
): [RealPoint, RealPoint] {
  return [
    { x: constX, y: yMin },
    { x: constX, y: yMax },
  ];
}

// ── Formatting ──

export function formatReal(n: number): string {
  return n.toFixed(2);
}

export function formatRealPoint(p: RealECPoint): string {
  if (p === "infinity") return "∞";
  return `(${formatReal(p.x)}, ${formatReal(p.y)})`;
}
