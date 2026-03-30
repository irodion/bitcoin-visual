import { describe, it, expect } from "vite-plus/test";
import {
  TOY_P,
  TOY_ORDER,
  TOY_BASE,
  mod,
  modPow,
  modInverse,
  isOnCurve,
  pointNegate,
  pointEquals,
  pointDouble,
  pointAdd,
  pointAddDetail,
  scalarMultiply,
  scalarMultiplyWithSteps,
  allCurvePoints,
  formatPoint,
} from "./toyEC";

// ── Field Arithmetic ──

describe("mod", () => {
  it("returns positive for negative input", () => {
    expect(mod(-3n, 61n)).toBe(58n);
  });

  it("reduces values larger than p", () => {
    expect(mod(70n, 61n)).toBe(9n);
  });

  it("returns 0 for multiples of p", () => {
    expect(mod(122n, 61n)).toBe(0n);
  });
});

describe("modPow", () => {
  it("computes 2^10 mod 61", () => {
    expect(modPow(2n, 10n, 61n)).toBe(mod(1024n, 61n));
  });

  it("returns 1 for exponent 0", () => {
    expect(modPow(42n, 0n, 61n)).toBe(1n);
  });
});

describe("modInverse", () => {
  it("satisfies a * a^{-1} ≡ 1 (mod p) for several values", () => {
    for (const a of [2n, 7n, 13n, 30n, 60n]) {
      const inv = modInverse(a, TOY_P);
      expect(mod(a * inv, TOY_P)).toBe(1n);
    }
  });

  it("throws for 0", () => {
    expect(() => modInverse(0n, TOY_P)).toThrow();
  });
});

// ── Curve Validation ──

describe("isOnCurve", () => {
  it("returns true for the base point", () => {
    expect(isOnCurve(TOY_BASE)).toBe(true);
  });

  it("returns true for the point at infinity", () => {
    expect(isOnCurve("infinity")).toBe(true);
  });

  it("returns false for an off-curve point", () => {
    expect(isOnCurve({ x: 0n, y: 0n })).toBe(false);
  });
});

// ── Point Enumeration ──

describe("allCurvePoints", () => {
  it("returns exactly 72 affine points", () => {
    expect(allCurvePoints()).toHaveLength(72);
  });

  it("all points satisfy the curve equation", () => {
    for (const pt of allCurvePoints()) {
      expect(isOnCurve(pt)).toBe(true);
    }
  });

  it("includes the base point", () => {
    const points = allCurvePoints();
    expect(points.some((p) => p.x === TOY_BASE.x && p.y === TOY_BASE.y)).toBe(true);
  });

  it("returns the same array on repeated calls (memoized)", () => {
    expect(allCurvePoints()).toBe(allCurvePoints());
  });
});

// ── Point Operations ──

describe("pointNegate", () => {
  it("negates (x, y) to (x, p - y)", () => {
    const neg = pointNegate(TOY_BASE);
    expect(neg).toEqual({ x: 5n, y: mod(-7n, TOY_P) });
  });

  it("negating infinity returns infinity", () => {
    expect(pointNegate("infinity")).toBe("infinity");
  });

  it("double negation returns original", () => {
    const neg = pointNegate(pointNegate(TOY_BASE));
    expect(pointEquals(neg, TOY_BASE)).toBe(true);
  });
});

describe("pointEquals", () => {
  it("equal points match", () => {
    expect(pointEquals(TOY_BASE, { x: 5n, y: 7n })).toBe(true);
  });

  it("different points don't match", () => {
    expect(pointEquals(TOY_BASE, { x: 5n, y: 54n })).toBe(false);
  });

  it("infinity equals infinity", () => {
    expect(pointEquals("infinity", "infinity")).toBe(true);
  });

  it("infinity does not equal an affine point", () => {
    expect(pointEquals("infinity", TOY_BASE)).toBe(false);
  });
});

describe("pointAdd", () => {
  it("P + infinity = P", () => {
    expect(pointEquals(pointAdd(TOY_BASE, "infinity"), TOY_BASE)).toBe(true);
  });

  it("infinity + P = P", () => {
    expect(pointEquals(pointAdd("infinity", TOY_BASE), TOY_BASE)).toBe(true);
  });

  it("P + (-P) = infinity", () => {
    const neg = pointNegate(TOY_BASE);
    expect(pointAdd(TOY_BASE, neg)).toBe("infinity");
  });

  it("is commutative: P + Q = Q + P", () => {
    const points = allCurvePoints();
    const P = points[0];
    const Q = points[5];
    const R1 = pointAdd(P, Q);
    const R2 = pointAdd(Q, P);
    expect(pointEquals(R1, R2)).toBe(true);
  });

  it("is associative: (P + Q) + R = P + (Q + R)", () => {
    const points = allCurvePoints();
    const [P, Q, R] = [points[0], points[3], points[7]];
    const lhs = pointAdd(pointAdd(P, Q), R);
    const rhs = pointAdd(P, pointAdd(Q, R));
    expect(pointEquals(lhs, rhs)).toBe(true);
  });

  it("produces a point on the curve", () => {
    const points = allCurvePoints();
    const result = pointAdd(points[2], points[10]);
    expect(isOnCurve(result)).toBe(true);
  });
});

describe("pointDouble", () => {
  it("matches pointAdd(P, P)", () => {
    const d = pointDouble(TOY_BASE);
    const a = pointAdd(TOY_BASE, TOY_BASE);
    expect(pointEquals(d, a)).toBe(true);
  });

  it("doubling infinity returns infinity", () => {
    expect(pointDouble("infinity")).toBe("infinity");
  });

  it("result is on the curve", () => {
    expect(isOnCurve(pointDouble(TOY_BASE))).toBe(true);
  });
});

// ── Scalar Multiplication ──

describe("scalarMultiply", () => {
  it("1 * P = P", () => {
    expect(pointEquals(scalarMultiply(1n, TOY_BASE), TOY_BASE)).toBe(true);
  });

  it("2 * P = pointDouble(P)", () => {
    expect(pointEquals(scalarMultiply(2n, TOY_BASE), pointDouble(TOY_BASE))).toBe(true);
  });

  it("order * P = infinity", () => {
    expect(scalarMultiply(TOY_ORDER, TOY_BASE)).toBe("infinity");
  });

  it("0 * P = infinity", () => {
    expect(scalarMultiply(0n, TOY_BASE)).toBe("infinity");
  });

  it("(k+1)*P = k*P + P", () => {
    const k = 17n;
    const lhs = scalarMultiply(k + 1n, TOY_BASE);
    const rhs = pointAdd(scalarMultiply(k, TOY_BASE), TOY_BASE);
    expect(pointEquals(lhs, rhs)).toBe(true);
  });

  it("k*P is always on the curve for k = 1..72", () => {
    for (let k = 1n; k <= 72n; k++) {
      expect(isOnCurve(scalarMultiply(k, TOY_BASE))).toBe(true);
    }
  });
});

describe("scalarMultiplyWithSteps", () => {
  it("returns empty for k = 0", () => {
    expect(scalarMultiplyWithSteps(0n, TOY_BASE)).toHaveLength(0);
  });

  it("returns empty for k = 1 (only the leading bit, no subsequent steps)", () => {
    expect(scalarMultiplyWithSteps(1n, TOY_BASE)).toHaveLength(0);
  });

  it("final accumulator matches scalarMultiply result", () => {
    for (const k of [2n, 7n, 15n, 42n, 72n]) {
      const steps = scalarMultiplyWithSteps(k, TOY_BASE);
      const lastAcc = steps[steps.length - 1].accumulator;
      expect(pointEquals(lastAcc, scalarMultiply(k, TOY_BASE))).toBe(true);
    }
  });

  it("step count = bit length of k - 1", () => {
    for (const k of [2n, 7n, 15n, 42n, 72n]) {
      const steps = scalarMultiplyWithSteps(k, TOY_BASE);
      const bitLen = k.toString(2).length;
      expect(steps).toHaveLength(bitLen - 1);
    }
  });

  it("each doubled/added result is on the curve", () => {
    const steps = scalarMultiplyWithSteps(42n, TOY_BASE);
    for (const step of steps) {
      expect(isOnCurve(step.doubled)).toBe(true);
      expect(isOnCurve(step.accumulator)).toBe(true);
      if (step.added !== null) expect(isOnCurve(step.added)).toBe(true);
    }
  });
});

// ── Addition Detail ──

describe("pointAddDetail", () => {
  it("returns intermediate values for two distinct points", () => {
    const points = allCurvePoints();
    const detail = pointAddDetail(points[0], points[5]);
    expect(detail).not.toBeNull();
    expect(typeof detail!.slope).toBe("bigint");
    expect(typeof detail!.x3).toBe("bigint");
    expect(typeof detail!.y3).toBe("bigint");
  });

  it("result matches pointAdd", () => {
    const points = allCurvePoints();
    const [P, Q] = [points[0], points[5]];
    const detail = pointAddDetail(P, Q);
    const result = pointAdd(P, Q);
    if (result !== "infinity" && detail) {
      expect(detail.x3).toBe(result.x);
      expect(detail.y3).toBe(result.y);
    }
  });

  it("returns null for infinity inputs", () => {
    expect(pointAddDetail("infinity", TOY_BASE)).toBeNull();
    expect(pointAddDetail(TOY_BASE, "infinity")).toBeNull();
  });

  it("returns null for inverse points", () => {
    const neg = pointNegate(TOY_BASE);
    expect(pointAddDetail(TOY_BASE, neg)).toBeNull();
  });

  it("handles doubling case (P = Q)", () => {
    const detail = pointAddDetail(TOY_BASE, TOY_BASE);
    expect(detail).not.toBeNull();
    const doubled = pointDouble(TOY_BASE);
    if (doubled !== "infinity" && detail) {
      expect(detail.x3).toBe(doubled.x);
      expect(detail.y3).toBe(doubled.y);
    }
  });
});

// ── Formatting ──

describe("formatPoint", () => {
  it("formats an affine point", () => {
    expect(formatPoint(TOY_BASE)).toBe("(5, 7)");
  });

  it("formats infinity", () => {
    expect(formatPoint("infinity")).toContain("infinity");
  });
});
