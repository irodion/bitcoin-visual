/**
 * Check whether a hash meets the required difficulty (leading hex zero nibbles).
 * Used by both the Web Worker and the main thread for validation.
 */
export function checkHashMeetsDifficulty(hash: Uint8Array, difficulty: number): boolean {
  for (let i = 0; i < difficulty; i++) {
    const byteIndex = Math.floor(i / 2);
    const isHighNibble = i % 2 === 0;
    const nibble = isHighNibble ? hash[byteIndex] >> 4 : hash[byteIndex] & 0x0f;
    if (nibble !== 0) return false;
  }
  return true;
}
