import type { ReactNode } from "react";

interface PageBackgroundProps {
  children: ReactNode;
  glowSize?: number;
  amberOpacity?: number;
  tealOpacity?: number;
}

export function PageBackground({
  children,
  glowSize = 600,
  amberOpacity = 0.2,
  tealOpacity = 0.14,
}: PageBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-dot-grid">
      <div
        className="pointer-events-none absolute -right-[200px] -top-[200px]"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, rgba(247,147,26,${amberOpacity}) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[200px] -left-[200px]"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, rgba(54,207,201,${tealOpacity}) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
