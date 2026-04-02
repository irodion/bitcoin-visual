import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  type RealPoint,
  type RealECPoint,
  type RealAdditionDetail,
  realPointAdd,
  realPointDouble,
} from "../../shared/crypto/realCurve.ts";

/** Number of construction steps: 0=points, 1=line, 2=intersection, 3=reflection, 4=result */
export const MAX_CONSTRUCTION_STEP = 4;
const STEP_DELAY_MS = 600;

export interface RealCurveState {
  pointP: RealPoint | null;
  pointQ: RealPoint | null;
  setPointP: (p: RealPoint | null) => void;
  setPointQ: (p: RealPoint | null) => void;
  doublingMode: boolean;
  setDoublingMode: (v: boolean) => void;
  additionResult: RealECPoint | null;
  additionDetail: RealAdditionDetail | null;
  constructionStep: number;
  advanceStep: () => void;
  resetConstruction: () => void;
  showAllSteps: () => void;
}

export function useRealCurveState(): RealCurveState {
  const [pointP, setPointP] = useState<RealPoint | null>(null);
  const [pointQ, setPointQ] = useState<RealPoint | null>(null);
  const [doublingMode, setDoublingModeRaw] = useState(false);
  const [constructionStep, setConstructionStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function setDoublingMode(v: boolean) {
    setDoublingModeRaw(v);
    if (v) setPointQ(null);
  }

  const effectiveQ = doublingMode ? pointP : pointQ;

  const additionDetail = useMemo<RealAdditionDetail | null>(() => {
    if (!pointP) return null;
    if (doublingMode) return realPointDouble(pointP);
    if (!effectiveQ) return null;
    return realPointAdd(pointP, effectiveQ);
  }, [pointP, effectiveQ, doublingMode]);

  const additionResult = useMemo<RealECPoint | null>(() => {
    if (!pointP) return null;
    if (!doublingMode && !effectiveQ) return null;
    if (!additionDetail) return "infinity";
    return { x: additionDetail.x3, y: additionDetail.y3 };
  }, [pointP, effectiveQ, doublingMode, additionDetail]);

  // Reset construction when points change
  useEffect(() => {
    setConstructionStep(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [pointP, pointQ, doublingMode]);

  // Auto-advance construction steps
  useEffect(() => {
    if (additionResult === null) return;
    if (constructionStep >= MAX_CONSTRUCTION_STEP) return;

    timerRef.current = setTimeout(() => {
      setConstructionStep((s) => Math.min(s + 1, MAX_CONSTRUCTION_STEP));
    }, STEP_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [additionResult, constructionStep]);

  const advanceStep = useCallback(() => {
    setConstructionStep((s) => Math.min(s + 1, MAX_CONSTRUCTION_STEP));
  }, []);

  const resetConstruction = useCallback(() => {
    setConstructionStep(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const showAllSteps = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setConstructionStep(MAX_CONSTRUCTION_STEP);
  }, []);

  return {
    pointP,
    pointQ,
    setPointP,
    setPointQ,
    doublingMode,
    setDoublingMode,
    additionResult,
    additionDetail,
    constructionStep,
    advanceStep,
    resetConstruction,
    showAllSteps,
  };
}
