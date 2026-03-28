import { UTXOCoin } from "./UTXOCoin.tsx";
import { satsToBtc, type UTXO } from "./constants.ts";

interface UTXOPoolProps {
  utxos: UTXO[];
  selectedIds: Set<string>;
  totalInputSats: bigint;
  onToggle: (id: string) => void;
}

export function UTXOPool({ utxos, selectedIds, totalInputSats, onToggle }: UTXOPoolProps) {
  const selectedCount = selectedIds.size;

  return (
    <div className="panel-cool rounded-[30px] border border-border p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          UTXO Pool
        </div>
        {selectedCount > 0 && (
          <div className="text-sm text-text-secondary" role="status">
            <span className="font-mono font-semibold text-accent">{satsToBtc(totalInputSats)}</span>{" "}
            BTC selected ({selectedCount} UTXO{selectedCount !== 1 ? "s" : ""})
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {utxos.map((utxo) => (
          <UTXOCoin
            key={utxo.id}
            utxo={utxo}
            isSelected={selectedIds.has(utxo.id)}
            onToggle={() => onToggle(utxo.id)}
          />
        ))}
      </div>
    </div>
  );
}
