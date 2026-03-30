import { motion } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import {
  TOY_P,
  formatPoint,
  type ECPoint,
  type AffinePoint,
  type AdditionDetail,
} from "../../shared/crypto/toyEC.ts";
import { PointGrid } from "./PointGrid.tsx";

// ── Math Breakdown ──

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
            <span className="text-text-primary">s</span> = (3 &middot; {P.x.toString()}
            <sup>2</sup> + 9) &middot; (2 &middot; {P.y.toString()})<sup>&minus;1</sup> mod{" "}
            {TOY_P.toString()} = <span className="text-accent">{detail.slope.toString()}</span>
          </p>
        ) : (
          <p>
            <span className="text-text-muted">slope</span>{" "}
            <span className="text-text-primary">s</span> = ({Q.y.toString()} &minus;{" "}
            {P.y.toString()}) &middot; ({Q.x.toString()} &minus; {P.x.toString()})
            <sup>&minus;1</sup> mod {TOY_P.toString()} ={" "}
            <span className="text-accent">{detail.slope.toString()}</span>
          </p>
        )}
        <p>
          <span className="text-text-muted">x₃</span> = {detail.slope.toString()}
          <sup>2</sup> &minus; {P.x.toString()} &minus; {Q.x.toString()} mod {TOY_P.toString()} ={" "}
          <span className="text-teal">{detail.x3.toString()}</span>
        </p>
        <p>
          <span className="text-text-muted">y₃</span> = {detail.slope.toString()} &middot; (
          {P.x.toString()} &minus; {detail.x3.toString()}) &minus; {P.y.toString()} mod{" "}
          {TOY_P.toString()} = <span className="text-teal">{detail.y3.toString()}</span>
        </p>
        <p className="border-t border-border pt-2 text-sm font-semibold text-success">
          Result = {formatPoint(result)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Point Selector Badge ──

function PointBadge({
  label,
  point,
  color,
  onClear,
}: {
  label: string;
  point: AffinePoint | null;
  color: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs font-semibold text-text-primary">{label}:</span>
      {point ? (
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-text-secondary">
            ({point.x.toString()}, {point.y.toString()})
          </span>
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-text-muted transition-colors hover:text-danger"
            aria-label={`Clear ${label}`}
          >
            &times;
          </button>
        </span>
      ) : (
        <span className="text-xs italic text-text-muted">click on grid</span>
      )}
    </div>
  );
}

// ── Main Component ──

interface PointAdditionDemoProps {
  pointP: AffinePoint | null;
  pointQ: AffinePoint | null;
  setPointP: (p: AffinePoint | null) => void;
  setPointQ: (p: AffinePoint | null) => void;
  doublingMode: boolean;
  setDoublingMode: (v: boolean) => void;
  additionResult: ECPoint | null;
  additionDetail: AdditionDetail | null;
}

export function PointAdditionDemo({
  pointP,
  pointQ,
  setPointP,
  setPointQ,
  doublingMode,
  setDoublingMode,
  additionResult,
  additionDetail,
}: PointAdditionDemoProps) {
  const selectionMode = !pointP ? "selectP" : !doublingMode && !pointQ ? "selectQ" : "none";

  function handlePointClick(pt: AffinePoint) {
    if (!pointP) {
      setPointP(pt);
    } else if (!doublingMode && !pointQ) {
      setPointQ(pt);
    }
  }

  function handleToggleDoubling(checked: boolean) {
    setDoublingMode(checked);
    if (checked) setPointQ(null);
  }

  const effectiveQ = doublingMode ? pointP : pointQ;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <PointBadge label="P" point={pointP} color="bg-accent" onClear={() => setPointP(null)} />
        {!doublingMode && (
          <PointBadge label="Q" point={pointQ} color="bg-teal" onClear={() => setPointQ(null)} />
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

      {/* Doubling toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={doublingMode}
          onChange={(e) => handleToggleDoubling(e.target.checked)}
          className="accent-accent"
        />
        Point Doubling mode (P + P)
      </label>

      {/* Grid */}
      <PointGrid
        selectedP={pointP}
        selectedQ={effectiveQ}
        resultPoint={additionResult}
        onPointClick={handlePointClick}
        selectionMode={selectionMode as "selectP" | "selectQ" | "none"}
      />

      {/* Math breakdown */}
      {pointP && effectiveQ && additionDetail && additionResult && (
        <MathBreakdown
          P={pointP}
          Q={effectiveQ}
          detail={additionDetail}
          result={additionResult}
          isDoubling={doublingMode}
        />
      )}

      {/* Infinity result */}
      {pointP && effectiveQ && additionResult === "infinity" && !additionDetail && (
        <motion.div
          variants={STEP_VARIANTS}
          initial="hidden"
          animate="visible"
          className="panel-cool rounded-input border border-border p-5 text-center"
        >
          <p className="font-mono text-sm text-text-secondary">
            P + (&minus;P) = <span className="font-semibold text-info">Point at Infinity</span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            The identity element of the group — adding a point to its inverse yields infinity.
          </p>
        </motion.div>
      )}
    </div>
  );
}
