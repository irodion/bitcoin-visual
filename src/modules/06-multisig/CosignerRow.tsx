import { HexBox } from "../../shared/components/index.ts";
import { BTN_PRIMARY } from "../../shared/components/styles.ts";
import type { Cosigner } from "./useMultisigState.ts";

type HexVariant = "default" | "danger" | "info" | "success" | "warm";

const COSIGNER_VARIANTS: HexVariant[] = ["default", "info", "warm"];
const COSIGNER_DOTS = ["bg-accent", "bg-teal", "bg-info"];

interface CosignerRowProps {
  cosigner: Cosigner;
  index: number;
  onGenerate: (index: number) => void;
}

export function CosignerRow({ cosigner, index, onGenerate }: CosignerRowProps) {
  const dotClass = COSIGNER_DOTS[index] ?? "bg-accent";
  const variant = COSIGNER_VARIANTS[index] ?? "default";

  return (
    <div className="panel-cool rounded-input border border-border p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
        <span className="text-sm font-bold text-text-primary">
          Cosigner {cosigner.id} — {cosigner.label}
        </span>
      </div>

      {cosigner.publicKey ? (
        <HexBox
          value={cosigner.publicKey}
          label="Compressed public key (33 bytes)"
          variant={variant}
        />
      ) : (
        <button type="button" className={BTN_PRIMARY} onClick={() => onGenerate(index)}>
          Generate Key
        </button>
      )}
    </div>
  );
}
