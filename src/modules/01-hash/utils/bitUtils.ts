export function countBitDifferences(a: Uint8Array, b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      count += xor & 1;
      xor >>= 1;
    }
  }
  return count;
}
