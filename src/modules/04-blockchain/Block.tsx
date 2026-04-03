import { HexBox } from "../../shared/components/index.ts";
import { BTN_PRIMARY, BTN_GHOST, INPUT } from "../../shared/components/styles.ts";
import type { BlockData, BlockValidity } from "./constants.ts";

interface BlockProps {
  block: BlockData;
  validity: BlockValidity;
  isSelected: boolean;
  isMining: boolean;
  miningNonce: number;
  miningHashRate: number;
  onEditTransactionData: (txIndex: number, newData: string) => void;
  onEditNonce: (nonce: number) => void;
  onAddTransaction: () => void;
  onRemoveTransaction: (txIndex: number) => void;
  onMine: () => void;
  onStopMine: () => void;
  onSelect: () => void;
}

export function Block({
  block,
  validity,
  isSelected,
  isMining,
  miningNonce,
  miningHashRate,
  onEditTransactionData,
  onEditNonce,
  onAddTransaction,
  onRemoveTransaction,
  onMine,
  onStopMine,
  onSelect,
}: BlockProps) {
  const validBorder = "border-success/40 shadow-(--shadow-glow-success)";
  const invalidBorder = "border-danger/60 shadow-(--shadow-glow-danger)";
  const selectedRing = isSelected ? "ring-2 ring-accent/30" : "";

  return (
    <div
      data-block-card
      className={`flex w-[320px] shrink-0 flex-col gap-3 rounded-card border bg-surface-raised p-5 transition-all duration-500 ${
        validity.isValid ? validBorder : invalidBorder
      } ${selectedRing}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onSelect}
        className="flex cursor-pointer items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            {block.index}
          </span>
          <span className="text-sm font-bold text-text-primary">
            Block #{block.index}
            {block.index === 0 && (
              <span className="ml-1.5 text-[10px] font-medium text-text-secondary">(Genesis)</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {validity.isValid ? (
            <span className="rounded-badge bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              Valid
            </span>
          ) : (
            <span className="rounded-badge bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
              ❌ Invalid
            </span>
          )}
        </div>
      </button>

      {/* Previous Hash */}
      <div data-chain-prev={block.index} data-testid={`chain-prev-${block.index}`}>
        <HexBox
          value={block.prevHash}
          label="Previous Hash"
          variant="info"
          truncate
          maxLength={16}
        />
      </div>

      {/* Transactions */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Transactions ({block.transactions.length})
        </span>
        {block.transactions.map((tx, i) => (
          <div key={tx.id} className="flex items-center gap-1.5">
            <input
              type="text"
              value={tx.data}
              onChange={(e) => onEditTransactionData(i, e.target.value)}
              disabled={tx.locked}
              aria-label={`Transaction ${i} data`}
              className={`min-w-0 flex-1 rounded-sm border px-2.5 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none ${
                tx.locked ? "border-accent/30 bg-accent/5 opacity-80" : "border-border bg-surface"
              }`}
            />
            {block.transactions.length > 1 && !tx.locked && (
              <button
                type="button"
                onClick={() => onRemoveTransaction(i)}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove transaction ${i}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAddTransaction}
          className={`${BTN_GHOST} mt-1 !px-3 !py-1 !text-xs`}
        >
          + Add TX
        </button>
      </div>

      {/* Merkle Root */}
      <HexBox
        value={block.merkleRoot}
        label="Merkle Root"
        variant="success"
        truncate
        maxLength={16}
      />

      {/* Nonce */}
      <div>
        <label
          htmlFor={`nonce-${block.index}`}
          className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-text-secondary"
        >
          Nonce
        </label>
        <input
          id={`nonce-${block.index}`}
          type="number"
          value={isMining ? miningNonce : block.nonce}
          onChange={(e) => onEditNonce(Number(e.target.value) || 0)}
          disabled={isMining}
          className={`${INPUT} !rounded-inner !py-2 !text-sm`}
        />
      </div>

      {/* Block Hash */}
      <div data-chain-hash={block.index} data-testid={`chain-hash-${block.index}`}>
        <HexBox
          value={block.hash}
          label="Block Hash"
          variant={validity.isValid ? "success" : "danger"}
          truncate
          maxLength={16}
        />
      </div>

      {/* Invalidity reason */}
      {!validity.isValid && (
        <p role="alert" className="text-xs font-medium text-danger">
          {!validity.hashValid && "Hash doesn't meet difficulty target"}
          {validity.hashValid && !validity.chainValid && "Previous hash mismatch"}
        </p>
      )}

      {/* Merkle tree CTA */}
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-inner border px-3 py-2 text-xs font-semibold transition-colors ${
          isSelected
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-accent"
        }`}
      >
        <span
          className={`transition-transform ${isSelected ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▼
        </span>
        {isSelected ? "Hide Merkle Tree" : "View Merkle Tree"}
      </button>

      {/* Mining controls */}
      {!validity.isValid &&
        (isMining ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              Mining… Nonce: {miningNonce.toLocaleString()}
              {miningHashRate > 0 && (
                <span className="ml-auto font-mono">{miningHashRate.toLocaleString()} H/s</span>
              )}
            </div>
            <button type="button" onClick={onStopMine} className={`${BTN_GHOST} w-full !text-xs`}>
              Stop Mining
            </button>
          </div>
        ) : (
          <button type="button" onClick={onMine} className={`${BTN_PRIMARY} w-full`}>
            Mine Block
          </button>
        ))}
    </div>
  );
}
