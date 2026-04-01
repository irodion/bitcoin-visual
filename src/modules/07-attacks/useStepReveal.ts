import { useState, useCallback } from "react";

export interface StepReveal {
  stepByStep: boolean;
  revealedStep: number;
  toggleStepByStep: () => void;
  revealNext: () => void;
  resetReveal: (isStepByStep: boolean) => void;
}

export function useStepReveal(): StepReveal {
  const [stepByStep, setStepByStep] = useState(false);
  const [revealedStep, setRevealedStep] = useState(Infinity);

  const toggleStepByStep = useCallback(() => {
    setStepByStep((prev) => {
      const next = !prev;
      setRevealedStep(next ? 0 : Infinity);
      return next;
    });
  }, []);

  const revealNext = useCallback(() => {
    setRevealedStep((prev) => prev + 1);
  }, []);

  const resetReveal = useCallback((isStepByStep: boolean) => {
    setRevealedStep(isStepByStep ? 0 : Infinity);
  }, []);

  return { stepByStep, revealedStep, toggleStepByStep, revealNext, resetReveal };
}
