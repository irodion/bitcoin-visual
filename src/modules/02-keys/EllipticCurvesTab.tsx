import { AnimatePresence, motion } from "framer-motion";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { useEllipticCurveState, type ECSection } from "./useEllipticCurveState.ts";
import { PointAdditionDemo } from "./PointAdditionDemo.tsx";
import { ScalarMultStepper } from "./ScalarMultStepper.tsx";
import { ScaleItUpPanel } from "./ScaleItUpPanel.tsx";

const SECTIONS: { key: ECSection; label: string }[] = [
  { key: "addition", label: "Point Addition" },
  { key: "scalar", label: "Scalar Multiply" },
  { key: "scaleup", label: "Scale It Up" },
];

interface EllipticCurvesTabProps {
  entropyHex: string;
}

export function EllipticCurvesTab({ entropyHex }: EllipticCurvesTabProps) {
  const state = useEllipticCurveState();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Section pill nav */}
      <div className="flex justify-center">
        <div
          className="flex rounded-pill border border-border bg-surface-raised p-0.5"
          role="tablist"
          aria-label="Elliptic curve sections"
        >
          {SECTIONS.map((section) => {
            const isSelected = state.activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => state.setActiveSection(section.key)}
                className={`cursor-pointer rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-accent text-text-on-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        {state.activeSection === "addition" && (
          <motion.div
            key="addition"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PointAdditionDemo
              pointP={state.pointP}
              pointQ={state.pointQ}
              setPointP={state.setPointP}
              setPointQ={state.setPointQ}
              doublingMode={state.doublingMode}
              setDoublingMode={state.setDoublingMode}
              additionResult={state.additionResult}
              additionDetail={state.additionDetail}
            />
          </motion.div>
        )}

        {state.activeSection === "scalar" && (
          <motion.div
            key="scalar"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <ScalarMultStepper
              scalar={state.scalar}
              setScalar={state.setScalar}
              scalarSteps={state.scalarSteps}
              scalarResult={state.scalarResult}
              currentStepIndex={state.currentStepIndex}
              autoPlay={state.autoPlay}
              setAutoPlay={state.setAutoPlay}
              stepForward={state.stepForward}
              stepBackward={state.stepBackward}
              resetSteps={state.resetSteps}
            />
          </motion.div>
        )}

        {state.activeSection === "scaleup" && (
          <motion.div
            key="scaleup"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <ScaleItUpPanel entropyHex={entropyHex} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
