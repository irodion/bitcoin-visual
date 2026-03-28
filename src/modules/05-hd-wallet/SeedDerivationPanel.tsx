import { HexBox, ValueFlowArrow } from "../../shared/components/index.ts";

interface SeedDerivationPanelProps {
  seedHex: string | null;
  isDerivingSeed: boolean;
  masterPrivateKey: Uint8Array | null;
  masterChainCode: Uint8Array | null;
  generationKey: number;
}

export function SeedDerivationPanel({
  seedHex,
  isDerivingSeed,
  masterPrivateKey,
  masterChainCode,
  generationKey,
}: SeedDerivationPanelProps) {
  return (
    <div className="space-y-2">
      <div className="panel-cool rounded-[24px] border border-border p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            1
          </span>
          <span className="text-sm font-semibold text-text-primary">Seed (512 bits)</span>
          <span className="rounded-badge bg-[#171E2C] px-2.5 py-1 font-mono text-[11px] text-text-secondary">
            PBKDF2
          </span>
        </div>
        {isDerivingSeed ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <span className="ml-2 text-sm text-text-secondary">
              Deriving seed (PBKDF2, 2048 rounds)...
            </span>
          </div>
        ) : seedHex ? (
          <HexBox value={seedHex} label="Seed" variant="info" truncate maxLength={64} />
        ) : (
          <p className="py-3 text-center text-sm italic text-text-secondary/30">
            Waiting for valid mnemonic...
          </p>
        )}
      </div>

      {seedHex && (
        <>
          <ValueFlowArrow
            label="HMAC-SHA-512"
            description="Key = 'Bitcoin seed'. Splits 64-byte output: left 32 bytes = master private key, right 32 bytes = chain code"
            animationKey={generationKey}
          />

          <div className="panel-cool rounded-[24px] border border-border p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                2
              </span>
              <span className="text-sm font-semibold text-text-primary">Master Key</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {masterPrivateKey && (
                <HexBox value={masterPrivateKey} label="Master Private Key" variant="danger" />
              )}
              {masterChainCode && (
                <HexBox value={masterChainCode} label="Master Chain Code" variant="info" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
