/**
 * Toy elliptic curve over F_61: y² = x³ + 9x + 1
 * Base point P = (5, 7), group order = 73 (72 affine points + point at infinity)
 *
 * Pure TypeScript, zero dependencies. Used for educational visualization only.
 */

// ── Constants ──

export const TOY_P = 61n;
export const TOY_A = 9n;
export const TOY_B = 1n;
export const TOY_ORDER = 73n;
export const TOY_BASE: AffinePoint = { x: 5n, y: 7n };

// ── Types ──

export interface AffinePoint {
  x: bigint;
  y: bigint;
}

export type ECPoint = AffinePoint | "infinity";

export interface ScalarStep {
  bit: 0 | 1;
  bitIndex: number;
  doubled: ECPoint;
  added: ECPoint | null;
  accumulator: ECPoint;
}

export interface AdditionDetail {
  slope: bigint;
  x3: bigint;
  y3: bigint;
}

// ── Field Arithmetic ──

/** Always-positive modular reduction */
export function mod(a: bigint, p: bigint): bigint {
  return ((a % p) + p) % p;
}

/** Modular exponentiation via square-and-multiply */
export function modPow(base: bigint, exp: bigint, p: bigint): bigint {
  let result = 1n;
  let b = mod(base, p);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mod(result * b, p);
    b = mod(b * b, p);
    e >>= 1n;
  }
  return result;
}

/** Modular multiplicative inverse using Fermat's little theorem: a^(p-2) mod p */
export function modInverse(a: bigint, p: bigint): bigint {
  const inv = modPow(a, p - 2n, p);
  if (mod(a * inv, p) !== 1n) {
    throw new Error(`No inverse for ${a} mod ${p}`);
  }
  return inv;
}

// ── Curve Operations ──

/** Check whether a point lies on y² = x³ + ax + b (mod p) */
export function isOnCurve(point: ECPoint): boolean {
  if (point === "infinity") return true;
  const { x, y } = point;
  const lhs = mod(y * y, TOY_P);
  const rhs = mod(x * x * x + TOY_A * x + TOY_B, TOY_P);
  return lhs === rhs;
}

/** Negate a point: (x, y) → (x, p − y) */
export function pointNegate(P: ECPoint): ECPoint {
  if (P === "infinity") return "infinity";
  return { x: P.x, y: mod(-P.y, TOY_P) };
}

/** Compare two EC points for equality */
export function pointEquals(P: ECPoint, Q: ECPoint): boolean {
  if (P === "infinity" && Q === "infinity") return true;
  if (P === "infinity" || Q === "infinity") return false;
  return P.x === Q.x && P.y === Q.y;
}

/** Double a point: tangent-based formula */
export function pointDouble(P: ECPoint): ECPoint {
  if (P === "infinity") return "infinity";
  if (P.y === 0n) return "infinity";

  const s = mod((3n * P.x * P.x + TOY_A) * modInverse(2n * P.y, TOY_P), TOY_P);
  const x3 = mod(s * s - 2n * P.x, TOY_P);
  const y3 = mod(s * (P.x - x3) - P.y, TOY_P);
  return { x: x3, y: y3 };
}

/** Add two distinct points (delegates to pointDouble when P = Q) */
export function pointAdd(P: ECPoint, Q: ECPoint): ECPoint {
  if (P === "infinity") return Q;
  if (Q === "infinity") return P;
  if (P.x === Q.x && P.y === Q.y) return pointDouble(P);
  if (P.x === Q.x) return "infinity"; // P + (-P)

  const s = mod((Q.y - P.y) * modInverse(Q.x - P.x, TOY_P), TOY_P);
  const x3 = mod(s * s - P.x - Q.x, TOY_P);
  const y3 = mod(s * (P.x - x3) - P.y, TOY_P);
  return { x: x3, y: y3 };
}

/** Return intermediate math values for point addition (for display) */
export function pointAddDetail(P: ECPoint, Q: ECPoint): AdditionDetail | null {
  if (P === "infinity" || Q === "infinity") return null;
  if (P.x === Q.x && P.y !== Q.y) return null; // inverse

  let slope: bigint;
  if (P.x === Q.x && P.y === Q.y) {
    if (P.y === 0n) return null;
    slope = mod((3n * P.x * P.x + TOY_A) * modInverse(2n * P.y, TOY_P), TOY_P);
  } else {
    slope = mod((Q.y - P.y) * modInverse(Q.x - P.x, TOY_P), TOY_P);
  }

  const x3 = mod(slope * slope - P.x - Q.x, TOY_P);
  const y3 = mod(slope * (P.x - x3) - P.y, TOY_P);
  return { slope, x3, y3 };
}

/** Scalar multiplication via double-and-add */
export function scalarMultiply(k: bigint, P: ECPoint): ECPoint {
  if (k === 0n || P === "infinity") return "infinity";

  let n = mod(k, TOY_ORDER);
  if (n === 0n) return "infinity";

  let result: ECPoint = "infinity";
  let current: ECPoint = P;

  while (n > 0n) {
    if (n & 1n) result = pointAdd(result, current);
    current = pointDouble(current);
    n >>= 1n;
  }

  return result;
}

/** Scalar multiplication with traced steps for visualization (MSB-first) */
export function scalarMultiplyWithSteps(k: bigint, P: ECPoint): ScalarStep[] {
  if (k <= 0n || P === "infinity") return [];

  const n = mod(k, TOY_ORDER);
  if (n === 0n) return [];

  // Get binary representation (MSB first, excluding leading bit)
  const bits: (0 | 1)[] = [];
  let temp = n;
  while (temp > 0n) {
    bits.unshift(temp & 1n ? 1 : 0);
    temp >>= 1n;
  }

  // MSB-first double-and-add: start with the MSB (always 1), then process remaining bits
  const steps: ScalarStep[] = [];
  let accumulator: ECPoint = P; // Initialize with P (the leading 1-bit)

  for (let i = 1; i < bits.length; i++) {
    const doubled = pointDouble(accumulator);
    let added: ECPoint | null = null;
    let acc: ECPoint;

    if (bits[i] === 1) {
      added = pointAdd(doubled, P);
      acc = added;
    } else {
      acc = doubled;
    }

    steps.push({
      bit: bits[i],
      bitIndex: i,
      doubled,
      added,
      accumulator: acc,
    });

    accumulator = acc;
  }

  return steps;
}

// ── Point Enumeration ──

let _allPoints: AffinePoint[] | null = null;

/** Enumerate all affine points on the toy curve (memoized) */
export function allCurvePoints(): AffinePoint[] {
  if (_allPoints) return _allPoints;

  const points: AffinePoint[] = [];
  for (let x = 0n; x < TOY_P; x++) {
    const rhs = mod(x * x * x + TOY_A * x + TOY_B, TOY_P);
    for (let y = 0n; y < TOY_P; y++) {
      if (mod(y * y, TOY_P) === rhs) {
        points.push({ x, y });
      }
    }
  }

  _allPoints = points;
  return points;
}

/** Format a point for display */
export function formatPoint(P: ECPoint): string {
  if (P === "infinity") return "\u221E (point at infinity)";
  return `(${P.x}, ${P.y})`;
}
