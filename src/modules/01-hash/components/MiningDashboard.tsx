import { HexBox } from "../../../shared/components/index.ts";
import { BITCOIN_HASHRATE, formatScale } from "../miningUtils.ts";

interface MiningDashboardProps {
  currentNonce: number;
  hashRate: number;
  currentHash: string;
  isMining: boolean;
  result: {
    nonce: number;
    hash: string;
    totalHashes: number;
    elapsedMs: number;
  } | null;
}

export function MiningDashboard({
  currentNonce,
  hashRate,
  currentHash,
  isMining,
  result,
}: MiningDashboardProps) {
  if (!isMining && !result) return null;

  if (result) {
    const ratio = hashRate > 0 ? BITCOIN_HASHRATE / hashRate : 0;
    return (
      <div className="space-y-4 rounded-input border border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg text-success">✓</span>
          <h3 className="text-base font-bold text-success">Nonce Found!</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
              Winning Nonce
            </div>
            <div className="font-mono text-2xl font-bold text-accent">
              {result.nonce.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
              Hashes Tried
            </div>
            <div className="font-mono text-lg text-text-primary">
              {result.totalHashes.toLocaleString()} in {(result.elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        <HexBox value={result.hash} label="Winning Hash" variant="success" />

        {hashRate > 0 && (
          <div className="rounded-inner border border-border bg-surface p-4 text-sm">
            <p className="text-text-secondary">
              Your browser:{" "}
              <strong className="text-text-primary">{hashRate.toLocaleString()} H/s</strong>
            </p>
            <p className="text-text-secondary">
              Bitcoin network: <strong className="text-text-primary">~600 EH/s</strong> — that is{" "}
              <strong className="text-accent">{formatScale(ratio)}×</strong> faster
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-input border border-border bg-surface-inset p-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Nonce
          </div>
          <div className="font-mono text-xl font-bold text-accent">
            {currentNonce.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Hash Rate
          </div>
          <div className="font-mono text-lg text-text-primary">{hashRate.toLocaleString()} H/s</div>
        </div>
      </div>

      {currentHash && (
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Current Hash
          </div>
          <code className="block break-all font-mono text-sm text-text-muted">{currentHash}</code>
        </div>
      )}
    </div>
  );
}
