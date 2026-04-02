export const BITCOIN_HASHRATE = 6e20; // ~600 EH/s

export function formatScale(value: number): string {
  if (value >= 1e18) return `${(value / 1e18).toFixed(1)} quintillion`;
  if (value >= 1e15) return `${(value / 1e15).toFixed(1)} quadrillion`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} trillion`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} billion`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} million`;
  return value.toLocaleString();
}
