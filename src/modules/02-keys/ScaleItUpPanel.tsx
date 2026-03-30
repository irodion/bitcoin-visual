import { useMemo } from "react";
import { motion } from "framer-motion";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import { HexBox } from "../../shared/components/index.ts";
import { TOY_P, TOY_A, TOY_B, TOY_ORDER, TOY_BASE } from "../../shared/crypto/toyEC.ts";

// ── secp256k1 constants for display ──

const SECP_P = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F";
const SECP_N = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141";
const SECP_GX = "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798";

function truncateHex(hex: string, chars = 12): string {
  if (hex.length <= chars * 2) return hex;
  return `${hex.slice(0, chars)}...${hex.slice(-chars)}`;
}

// ── Comparison Row ──

function CompareRow({
  label,
  toy,
  real,
  mono = true,
}: {
  label: string;
  toy: string;
  real: string;
  mono?: boolean;
}) {
  return (
    <tr className="border-t border-border/50">
      <td className="py-2 pr-3 text-xs font-semibold text-text-secondary">{label}</td>
      <td className={`py-2 pr-3 text-xs ${mono ? "font-mono" : ""} text-accent`}>{toy}</td>
      <td className={`py-2 text-xs ${mono ? "font-mono" : ""} text-teal`}>{real}</td>
    </tr>
  );
}

// ── Your Key Panel ──

function YourKeyPanel({ entropyHex }: { entropyHex: string }) {
  const keyData = useMemo(() => {
    if (!/^[0-9a-fA-F]{64}$/.test(entropyHex)) return null;
    try {
      const k = BigInt("0x" + entropyHex);
      const point = secp256k1.Point.BASE.multiply(k).toAffine();
      return {
        k: entropyHex.toUpperCase(),
        x: point.x.toString(16).toUpperCase().padStart(64, "0"),
        y: point.y.toString(16).toUpperCase().padStart(64, "0"),
      };
    } catch {
      return null;
    }
  }, [entropyHex]);

  if (!keyData) {
    return (
      <div className="rounded-callout border border-border-amber bg-surface-warm p-4 text-center">
        <p className="text-xs text-warning-body">
          Switch to the <span className="font-semibold text-warning-heading">Key Pipeline</span> tab
          and generate a key to see your real secp256k1 multiplication here.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={STEP_VARIANTS} initial="hidden" animate="visible" className="space-y-3">
      <h4 className="text-sm font-semibold text-text-primary">Your Key on secp256k1</h4>

      <div className="space-y-2">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Private key k
          </div>
          <HexBox value={keyData.k} label="Private key" variant="danger" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Public key x-coordinate (k &times; G).x
          </div>
          <HexBox value={keyData.x} label="Public key x" variant="info" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Public key y-coordinate (k &times; G).y
          </div>
          <HexBox value={keyData.y} label="Public key y" variant="info" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ──

interface ScaleItUpPanelProps {
  entropyHex: string;
}

export function ScaleItUpPanel({ entropyHex }: ScaleItUpPanelProps) {
  return (
    <div className="space-y-6">
      {/* Comparison table */}
      <div className="panel-cool overflow-x-auto rounded-input border border-border p-5">
        <h4 className="mb-3 text-sm font-semibold text-text-primary">Toy Curve vs. secp256k1</h4>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
              <th className="pb-2 pr-3">Parameter</th>
              <th className="pb-2 pr-3">
                F<sub>61</sub> toy curve
              </th>
              <th className="pb-2">secp256k1</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Equation"
              toy={`y\u00B2 = x\u00B3 + ${TOY_A}x + ${TOY_B}`}
              real="y\u00B2 = x\u00B3 + 7"
              mono={false}
            />
            <CompareRow label="Field prime p" toy={TOY_P.toString()} real={truncateHex(SECP_P)} />
            <CompareRow label="Coefficients (a, b)" toy={`${TOY_A}, ${TOY_B}`} real="0, 7" />
            <CompareRow
              label="Generator G"
              toy={`(${TOY_BASE.x}, ${TOY_BASE.y})`}
              real={`(${truncateHex(SECP_GX, 8)}, ...)`}
            />
            <CompareRow
              label="Group order n"
              toy={TOY_ORDER.toString()}
              real={truncateHex(SECP_N)}
            />
            <CompareRow label="Key space" toy="~7 bits" real="~256 bits" />
            <CompareRow
              label="Affine points"
              toy="72"
              real="\u2248 2\u00B2\u2075\u2076"
              mono={false}
            />
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div className="rounded-callout border border-border p-4 text-xs leading-relaxed text-text-secondary">
        <p>
          The toy curve has <span className="font-semibold text-text-primary">72 points</span> — you
          can enumerate all of them and brute-force any private key in microseconds. secp256k1 has
          approximately{" "}
          <span className="font-semibold text-text-primary">
            2<sup>256</sup>
          </span>{" "}
          points — trying every scalar would take longer than the age of the universe.
        </p>
        <p className="mt-2">
          The math is <span className="italic">identical</span>: point addition, doubling, and
          scalar multiplication work the same way. The security comes purely from the size of the
          numbers.
        </p>
      </div>

      {/* Your key */}
      <YourKeyPanel entropyHex={entropyHex} />
    </div>
  );
}
