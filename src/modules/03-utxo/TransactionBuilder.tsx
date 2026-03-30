import { INPUT, LABEL } from "../../shared/components/styles.ts";
import { satsToBtc, type UTXO } from "./constants.ts";

interface TransactionBuilderProps {
  selectedUtxos: UTXO[];
  recipientAmountBTC: string;
  onRecipientAmountChange: (btc: string) => void;
  totalInputSats: bigint;
  recipientAmountSats: bigint;
  changeAmountSats: bigint;
  feeSats: bigint;
  isValid: boolean;
  isSegWit: boolean;
  error: string | null;
}

export function TransactionBuilder({
  selectedUtxos,
  recipientAmountBTC,
  onRecipientAmountChange,
  totalInputSats,
  recipientAmountSats,
  changeAmountSats,
  feeSats,
  isValid,
  isSegWit,
  error,
}: TransactionBuilderProps) {
  const totalOutputSats =
    recipientAmountSats + (changeAmountSats > 0n ? changeAmountSats : 0n) + feeSats;
  const isBalanced = isValid && totalInputSats === totalOutputSats;

  return (
    <div className="panel-cool rounded-section border border-border p-5 md:p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
        Transaction Builder{" "}
        <span className="ml-1 rounded-badge bg-surface-raised px-2 py-0.5 text-text-muted">
          {isSegWit ? "P2WPKH" : "P2PKH"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Inputs column */}
        <div>
          <label className={LABEL}>Inputs</label>
          {selectedUtxos.length === 0 ? (
            <div className="rounded-input border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
              Select UTXOs above to add inputs
            </div>
          ) : (
            <div className="space-y-2">
              {selectedUtxos.map((utxo) => (
                <div
                  key={utxo.id}
                  className="flex items-center justify-between rounded-inner border border-border bg-surface px-4 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-text-primary">{utxo.label}</span>
                    <span className="ml-2 font-mono text-[10px] text-text-muted">
                      {utxo.txid.slice(0, 8)}&hellip;:{utxo.vout}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-accent">
                    {utxo.valueBTC}
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-2 pt-1 text-sm">
                <span className="text-text-secondary">Total In</span>
                <span className="font-mono font-semibold text-text-primary">
                  {satsToBtc(totalInputSats)} BTC
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Outputs column */}
        <div>
          <label className={LABEL} htmlFor="recipient-amount">
            Outputs
          </label>
          <div className="space-y-2">
            {/* Recipient */}
            <div className="rounded-inner border border-border bg-surface p-3">
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-text-muted">
                Recipient
              </div>
              <input
                id="recipient-amount"
                type="text"
                inputMode="decimal"
                value={recipientAmountBTC}
                onChange={(e) => onRecipientAmountChange(e.target.value)}
                placeholder="0.0"
                className={`${INPUT} text-right`}
                aria-label="Recipient amount in BTC"
              />
            </div>

            {/* Change */}
            {changeAmountSats > 0n && (
              <div className="flex items-center justify-between rounded-inner border border-border bg-surface px-4 py-2.5">
                <span className="text-sm text-text-secondary">Change</span>
                <span className="font-mono text-sm text-teal">
                  {satsToBtc(changeAmountSats)} BTC
                </span>
              </div>
            )}

            {/* Fee */}
            <div className="flex items-center justify-between rounded-inner border border-dashed border-border bg-surface px-4 py-2.5">
              <span className="text-sm text-text-secondary">Fee (fixed)</span>
              <span className="font-mono text-sm text-warning-text">{satsToBtc(feeSats)} BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance bar */}
      {selectedUtxos.length > 0 && recipientAmountSats > 0n && (
        <div className="mt-4 border-t border-border pt-3">
          {error ? (
            <div className="text-center text-sm font-medium text-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-sm" role="status">
              <span className="text-text-secondary">
                Total In:{" "}
                <span className="font-mono font-semibold text-text-primary">
                  {satsToBtc(totalInputSats)}
                </span>
              </span>
              <span className="text-text-muted" aria-hidden="true">
                &rarr;
              </span>
              <span className="text-text-secondary">
                Total Out:{" "}
                <span className="font-mono font-semibold text-text-primary">
                  {satsToBtc(totalOutputSats)}
                </span>
              </span>
              {isBalanced && (
                <span className="text-success" aria-label="Balanced">
                  &#10003;
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
