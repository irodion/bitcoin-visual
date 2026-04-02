import { motion, AnimatePresence } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { PillToggle } from "../../shared/components/PillToggle.tsx";
import {
  TOY_P,
  formatPoint,
  type ECPoint,
  type AffinePoint,
  type AdditionDetail,
} from "../../shared/crypto/toyEC.ts";
import {
  formatReal,
  formatRealPoint,
  type RealPoint,
  type RealAdditionDetail,
} from "../../shared/crypto/realCurve.ts";
import { PointGrid } from "./PointGrid.tsx";
import { RealCurveGrid } from "./RealCurveGrid.tsx";
import type { CurveViewMode } from "./useEllipticCurveState.ts";
import type { RealCurveState } from "./useRealCurveState.ts";

// ── View toggle options ──

const VIEW_OPTIONS = [
  { key: "real" as const, label: "Real Curve" },
  { key: "finite" as const, label: "Finite Field" },
] as const;

// ── Math Breakdown (finite field) ──

function MathBreakdown({
  P,
  Q,
  detail,
  result,
  isDoubling,
}: {
  P: AffinePoint;
  Q: AffinePoint;
  detail: AdditionDetail;
  result: ECPoint;
  isDoubling: boolean;
}) {
  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="panel-cool rounded-input border border-border p-5"
    >
      <h4 className="mb-3 text-sm font-semibold text-text-primary">
        {isDoubling ? "Point Doubling" : "Point Addition"} — Step by Step
      </h4>
      <div className="space-y-2 font-mono text-xs leading-relaxed text-text-secondary md:text-sm">
        {isDoubling ? (
          <p>
            <span className="text-text-muted">slope</span>{" "}
            <span className="text-text-primary">s</span> = (3 · {P.x.toString()}
            <sup>2</sup> + 9) · (2 · {P.y.toString()})<sup>−1</sup> mod {TOY_P.toString()} ={" "}
            <span className="text-accent">{detail.slope.toString()}</span>
          </p>
        ) : (
          <p>
            <span className="text-text-muted">slope</span>{" "}
            <span className="text-text-primary">s</span> = ({Q.y.toString()} − {P.y.toString()}) · (
            {Q.x.toString()} − {P.x.toString()})<sup>−1</sup> mod {TOY_P.toString()} ={" "}
            <span className="text-accent">{detail.slope.toString()}</span>
          </p>
        )}
        <p>
          <span className="text-text-muted">x₃</span> = {detail.slope.toString()}
          <sup>2</sup> − {P.x.toString()} − {Q.x.toString()} mod {TOY_P.toString()} ={" "}
          <span className="text-teal">{detail.x3.toString()}</span>
        </p>
        <p>
          <span className="text-text-muted">y₃</span> = {detail.slope.toString()} · (
          {P.x.toString()} − {detail.x3.toString()}) − {P.y.toString()} mod {TOY_P.toString()} ={" "}
          <span className="text-teal">{detail.y3.toString()}</span>
        </p>
        <p className="border-t border-border pt-2 text-sm font-semibold text-success">
          Result = {formatPoint(result)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Math Breakdown (real curve) ──

function RealMathBreakdown({
  P,
  Q,
  detail,
  isDoubling,
}: {
  P: RealPoint;
  Q: RealPoint;
  detail: RealAdditionDetail;
  isDoubling: boolean;
}) {
  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="panel-cool rounded-input border border-border p-5"
    >
      <h4 className="mb-3 text-sm font-semibold text-text-primary">
        {isDoubling ? "Point Doubling" : "Point Addition"} — over ℝ
      </h4>
      <div className="space-y-2 font-mono text-xs leading-relaxed text-text-secondary md:text-sm">
        {isDoubling ? (
          <p>
            <span className="text-text-muted">slope</span>{" "}
            <span className="text-text-primary">s</span> = (3 · {formatReal(P.x)}² + 9) / (2 ·{" "}
            {formatReal(P.y)}) = <span className="text-accent">{formatReal(detail.slope)}</span>
          </p>
        ) : (
          <p>
            <span className="text-text-muted">slope</span>{" "}
            <span className="text-text-primary">s</span> = ({formatReal(Q.y)} − {formatReal(P.y)}) /
            ({formatReal(Q.x)} − {formatReal(P.x)}) ={" "}
            <span className="text-accent">{formatReal(detail.slope)}</span>
          </p>
        )}
        <p>
          <span className="text-text-muted">x₃</span> = {formatReal(detail.slope)}² −{" "}
          {formatReal(P.x)} − {formatReal(Q.x)} ={" "}
          <span className="text-teal">{formatReal(detail.x3)}</span>
        </p>
        <p>
          <span className="text-text-muted">y₃</span> = {formatReal(detail.slope)} · (
          {formatReal(P.x)} − {formatReal(detail.x3)}) − {formatReal(P.y)} ={" "}
          <span className="text-teal">{formatReal(detail.y3)}</span>
        </p>
        <p className="border-t border-border pt-2 text-sm font-semibold text-success">
          Result = ({formatReal(detail.x3)}, {formatReal(detail.y3)})
        </p>
      </div>

      <div className="mt-4 rounded-callout border border-accent/30 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-text-secondary">
        <span className="font-semibold text-accent">Same algebra, different number system.</span>{" "}
        The formulas — s, x₃ = s² − x₁ − x₂, y₃ = s(x₁ − x₃) − y₁ — are identical over the reals and
        over a finite field. Over ℝ you get geometric intuition (lines intersecting a curve). Over
        F₆₁ you get the modular arithmetic that Bitcoin uses.
      </div>
    </motion.div>
  );
}

// ── Infinity Callout ──

function InfinityCallout() {
  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="panel-cool rounded-input border border-border p-5 text-center"
    >
      <p className="font-mono text-sm text-text-secondary">
        P + (−P) = <span className="font-semibold text-info">Point at Infinity</span>
      </p>
      <p className="mt-1 text-xs text-text-muted">
        The identity element — adding a point to its inverse yields infinity.
      </p>
    </motion.div>
  );
}

// ── Point Selector Badge ──

function PointBadge({
  label,
  text,
  color,
  onClear,
}: {
  label: string;
  text: string | null;
  color: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs font-semibold text-text-primary">{label}:</span>
      {text ? (
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-text-secondary">{text}</span>
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-text-muted transition-colors hover:text-danger"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        </span>
      ) : (
        <span className="text-xs italic text-text-muted">click on curve</span>
      )}
    </div>
  );
}

function formatAffine(p: AffinePoint | null): string | null {
  return p ? `(${p.x.toString()}, ${p.y.toString()})` : null;
}

function formatRealPt(p: RealPoint | null): string | null {
  return p ? `(${formatReal(p.x)}, ${formatReal(p.y)})` : null;
}

// ── Main Component ──

export interface PointAdditionDemoProps {
  viewMode: CurveViewMode;
  setViewMode: (v: CurveViewMode) => void;

  // Finite field state
  pointP: AffinePoint | null;
  pointQ: AffinePoint | null;
  setPointP: (p: AffinePoint | null) => void;
  setPointQ: (p: AffinePoint | null) => void;
  doublingMode: boolean;
  setDoublingMode: (v: boolean) => void;
  additionResult: ECPoint | null;
  additionDetail: AdditionDetail | null;

  // Real curve state (single object)
  realCurve: RealCurveState;
}

export function PointAdditionDemo({
  viewMode,
  setViewMode,
  pointP,
  pointQ,
  setPointP,
  setPointQ,
  doublingMode,
  setDoublingMode,
  additionResult,
  additionDetail,
  realCurve,
}: PointAdditionDemoProps) {
  const isReal = viewMode === "real";

  // Finite field selection
  const finiteSelectionMode = !pointP ? "selectP" : !doublingMode && !pointQ ? "selectQ" : "none";

  function handleFinitePointClick(pt: AffinePoint) {
    if (!pointP) {
      setPointP(pt);
    } else if (!doublingMode && !pointQ) {
      setPointQ(pt);
    }
  }

  function handleFiniteToggleDoubling(checked: boolean) {
    setDoublingMode(checked);
    if (checked) setPointQ(null);
  }

  // Real curve selection
  const realSelectionMode = !realCurve.pointP
    ? "selectP"
    : !realCurve.doublingMode && !realCurve.pointQ
      ? "selectQ"
      : "none";

  function handleRealPointClick(pt: RealPoint) {
    if (!realCurve.pointP) {
      realCurve.setPointP(pt);
    } else if (!realCurve.doublingMode && !realCurve.pointQ) {
      realCurve.setPointQ(pt);
    }
  }

  function handleRealToggleDoubling(checked: boolean) {
    realCurve.setDoublingMode(checked);
  }

  const finiteEffectiveQ = doublingMode ? pointP : pointQ;
  const realEffectiveQ = realCurve.doublingMode ? realCurve.pointP : realCurve.pointQ;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <PillToggle
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
          label="Curve view"
        />
      </div>

      <AnimatePresence mode="wait">
        {isReal ? (
          <motion.div
            key="real"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <PointBadge
                label="P"
                text={formatRealPt(realCurve.pointP)}
                color="bg-accent"
                onClear={() => realCurve.setPointP(null)}
              />
              {!realCurve.doublingMode && (
                <PointBadge
                  label="Q"
                  text={formatRealPt(realCurve.pointQ)}
                  color="bg-teal"
                  onClear={() => realCurve.setPointQ(null)}
                />
              )}
              {realCurve.additionResult && (
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">=</span>
                  <span className="font-mono text-xs font-semibold text-success">
                    {formatRealPoint(realCurve.additionResult)}
                  </span>
                </span>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={realCurve.doublingMode}
                onChange={(e) => handleRealToggleDoubling(e.target.checked)}
                className="accent-accent"
              />
              Point Doubling mode (P + P)
            </label>

            <RealCurveGrid
              pointP={realCurve.pointP}
              pointQ={realEffectiveQ}
              doublingMode={realCurve.doublingMode}
              additionResult={realCurve.additionResult}
              additionDetail={realCurve.additionDetail}
              constructionStep={realCurve.constructionStep}
              onPointClick={handleRealPointClick}
              selectionMode={realSelectionMode as "selectP" | "selectQ" | "none"}
            />

            {realCurve.pointP && realEffectiveQ && realCurve.additionDetail && (
              <RealMathBreakdown
                P={realCurve.pointP}
                Q={realEffectiveQ}
                detail={realCurve.additionDetail}
                isDoubling={realCurve.doublingMode}
              />
            )}

            {realCurve.pointP && realEffectiveQ && realCurve.additionResult === "infinity" && (
              <InfinityCallout />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="finite"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <PointBadge
                label="P"
                text={formatAffine(pointP)}
                color="bg-accent"
                onClear={() => setPointP(null)}
              />
              {!doublingMode && (
                <PointBadge
                  label="Q"
                  text={formatAffine(pointQ)}
                  color="bg-teal"
                  onClear={() => setPointQ(null)}
                />
              )}
              {additionResult && (
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">=</span>
                  <span className="font-mono text-xs font-semibold text-success">
                    {formatPoint(additionResult)}
                  </span>
                </span>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={doublingMode}
                onChange={(e) => handleFiniteToggleDoubling(e.target.checked)}
                className="accent-accent"
              />
              Point Doubling mode (P + P)
            </label>

            <PointGrid
              selectedP={pointP}
              selectedQ={finiteEffectiveQ}
              resultPoint={additionResult}
              onPointClick={handleFinitePointClick}
              selectionMode={finiteSelectionMode as "selectP" | "selectQ" | "none"}
            />

            {pointP && finiteEffectiveQ && additionDetail && additionResult && (
              <MathBreakdown
                P={pointP}
                Q={finiteEffectiveQ}
                detail={additionDetail}
                result={additionResult}
                isDoubling={doublingMode}
              />
            )}

            {pointP && finiteEffectiveQ && additionResult === "infinity" && !additionDetail && (
              <InfinityCallout />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
