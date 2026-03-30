import { useState, useMemo, useCallback } from "react";
import {
  TOY_BASE,
  pointAdd,
  pointDouble,
  pointAddDetail,
  scalarMultiply,
  scalarMultiplyWithSteps,
  type ECPoint,
  type AffinePoint,
  type ScalarStep,
  type AdditionDetail,
} from "../../shared/crypto/toyEC.ts";

export type ECSection = "addition" | "scalar" | "scaleup";

export interface EllipticCurveState {
  // Section navigation
  activeSection: ECSection;
  setActiveSection: (s: ECSection) => void;

  // Point addition
  pointP: AffinePoint | null;
  pointQ: AffinePoint | null;
  setPointP: (p: AffinePoint | null) => void;
  setPointQ: (p: AffinePoint | null) => void;
  doublingMode: boolean;
  setDoublingMode: (v: boolean) => void;
  additionResult: ECPoint | null;
  additionDetail: AdditionDetail | null;

  // Scalar multiplication
  scalar: number;
  setScalar: (k: number) => void;
  scalarSteps: ScalarStep[];
  scalarResult: ECPoint;
  currentStepIndex: number;
  autoPlay: boolean;
  setAutoPlay: (v: boolean) => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetSteps: () => void;
}

export function useEllipticCurveState(): EllipticCurveState {
  const [activeSection, setActiveSection] = useState<ECSection>("addition");

  // Point addition
  const [pointP, setPointP] = useState<AffinePoint | null>(null);
  const [pointQ, setPointQ] = useState<AffinePoint | null>(null);
  const [doublingMode, setDoublingMode] = useState(false);

  const additionResult = useMemo<ECPoint | null>(() => {
    if (!pointP) return null;
    if (doublingMode) return pointDouble(pointP);
    if (!pointQ) return null;
    return pointAdd(pointP, pointQ);
  }, [pointP, pointQ, doublingMode]);

  const additionDetail = useMemo<AdditionDetail | null>(() => {
    if (!pointP) return null;
    if (doublingMode) return pointAddDetail(pointP, pointP);
    if (!pointQ) return null;
    return pointAddDetail(pointP, pointQ);
  }, [pointP, pointQ, doublingMode]);

  // Scalar multiplication
  const [scalar, setScalar] = useState(7);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);

  const scalarSteps = useMemo(() => scalarMultiplyWithSteps(BigInt(scalar), TOY_BASE), [scalar]);

  const scalarResult = useMemo(() => scalarMultiply(BigInt(scalar), TOY_BASE), [scalar]);

  const stepForward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, scalarSteps.length - 1));
  }, [scalarSteps.length]);

  const stepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, -1));
  }, []);

  const resetSteps = useCallback(() => {
    setCurrentStepIndex(-1);
    setAutoPlay(false);
  }, []);

  return {
    activeSection,
    setActiveSection,
    pointP,
    pointQ,
    setPointP,
    setPointQ,
    doublingMode,
    setDoublingMode,
    additionResult,
    additionDetail,
    scalar,
    setScalar,
    scalarSteps,
    scalarResult,
    currentStepIndex,
    autoPlay,
    setAutoPlay,
    stepForward,
    stepBackward,
    resetSteps,
  };
}
