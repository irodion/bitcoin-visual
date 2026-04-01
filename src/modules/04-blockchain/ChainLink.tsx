import { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";

const GLOW_FILTER_ID = "chain-dot-glow";

interface ChainConnection {
  fromIndex: number;
  toIndex: number;
  valid: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface BlockChainConnectorsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  blockCount: number;
  chainValidity: boolean[];
}

function PulseDot({
  x1,
  y1,
  x2,
  y2,
  valid,
  index,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  valid: boolean;
  index: number;
}) {
  const color = valid ? "var(--color-accent)" : "var(--color-danger)";
  const lineColor = valid ? "var(--color-text-muted)" : "var(--color-danger)";
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const duration = Math.max(1.2, Math.sqrt(dx * dx + dy * dy) / 40);

  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineColor}
        strokeWidth={1}
        initial={{ opacity: 0 }}
        animate={{ opacity: valid ? 0.15 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {valid && (
        <motion.circle
          r={6}
          fill={color}
          filter={`url(#${GLOW_FILTER_ID})`}
          opacity={0.4}
          initial={{ cx: x1, cy: y1 }}
          animate={{ cx: [x1, x2], cy: [y1, y2] }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        />
      )}

      <motion.circle
        r={3}
        fill={color}
        initial={{ cx: x1, cy: y1 }}
        animate={valid ? { cx: [x1, x2], cy: [y1, y2] } : { cx: mx, cy: my }}
        transition={
          valid
            ? { duration, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }
            : { duration: 0.5 }
        }
      />

      {!valid && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ transformOrigin: `${mx}px ${my}px` }}
        >
          <line
            x1={mx - 4}
            y1={my - 4}
            x2={mx + 4}
            y2={my + 4}
            stroke="var(--color-danger)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <line
            x1={mx + 4}
            y1={my - 4}
            x2={mx - 4}
            y2={my + 4}
            stroke="var(--color-danger)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </motion.g>
      )}
    </g>
  );
}

export const BlockChainConnectors = memo(function BlockChainConnectors({
  containerRef,
  blockCount,
  chainValidity,
}: BlockChainConnectorsProps) {
  const [connections, setConnections] = useState<ChainConnection[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const prevSizeRef = useRef({ width: 0, height: 0 });
  const outerRafRef = useRef(0);
  const innerRafRef = useRef(0);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const prev = prevSizeRef.current;
    if (prev.width !== rect.width || prev.height !== rect.height) {
      prevSizeRef.current = { width: rect.width, height: rect.height };
      setSize({ width: rect.width, height: rect.height });
    }

    const next: ChainConnection[] = [];
    for (let i = 0; i < blockCount - 1; i++) {
      const hashEl = container.querySelector(`[data-chain-hash="${i}"]`);
      const prevEl = container.querySelector(`[data-chain-prev="${i + 1}"]`);
      if (!hashEl || !prevEl) continue;

      const fromBlock = hashEl.closest("[data-block-card]");
      const toBlock = prevEl.closest("[data-block-card]");
      if (!fromBlock || !toBlock) continue;

      const fromRect = fromBlock.getBoundingClientRect();
      const toRect = toBlock.getBoundingClientRect();
      const hashRect = hashEl.getBoundingClientRect();
      const prevRect = prevEl.getBoundingClientRect();

      next.push({
        fromIndex: i,
        toIndex: i + 1,
        valid: chainValidity[i + 1] ?? true,
        x1: fromRect.right - rect.left,
        y1: hashRect.top + hashRect.height / 2 - rect.top,
        x2: toRect.left - rect.left,
        y2: prevRect.top + prevRect.height / 2 - rect.top,
      });
    }
    setConnections(next);
  }, [containerRef, blockCount, chainValidity]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, measure]);

  useEffect(() => {
    outerRafRef.current = requestAnimationFrame(() => {
      innerRafRef.current = requestAnimationFrame(measure);
    });
    return () => {
      cancelAnimationFrame(outerRafRef.current);
      cancelAnimationFrame(innerRafRef.current);
    };
  }, [measure]);

  if (connections.length === 0 || size.width === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={size.width}
      height={size.height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id={GLOW_FILTER_ID} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      {connections.map((conn, i) => (
        <PulseDot
          key={`${conn.fromIndex}-${conn.toIndex}`}
          x1={conn.x1}
          y1={conn.y1}
          x2={conn.x2}
          y2={conn.y2}
          valid={conn.valid}
          index={i}
        />
      ))}
    </svg>
  );
});
