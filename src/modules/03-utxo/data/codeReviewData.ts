import type { CodeReviewChallengeData } from "../../../shared/components/CodeReviewChallenge.tsx";

const REFERENCE_INPUT = new TextEncoder().encode("0.8 BTC UTXO -> 0.5 BTC send + 0.001 BTC fee");

export const UTXO_CODE_REVIEW: CodeReviewChallengeData = {
  moduleKey: "utxo",
  title: "Review: send transaction assembly",
  prompt:
    "A teammate implemented transaction assembly for a wallet send flow. The requirement: spend one 0.8 BTC UTXO, send 0.5 BTC to the recipient, pay 0.001 BTC fee, return the remainder as change. Which version is correct?",
  referenceInput: REFERENCE_INPUT,
  options: [
    {
      key: "A",
      label: "Version A",
      code: `void buildSendTx(byte[] utxo_id, int vout) {
  // Input: take only what we need from the UTXO
  addInput(utxo_id, vout, 50_100_000);

  // Output: recipient gets 0.5 BTC
  addOutput(recipientAddr, 50_000_000);

  // Remaining 0.299 BTC stays in the UTXO
  // Fee: 50_100_000 - 50_000_000 = 100k sats
}`,
    },
    {
      key: "B",
      label: "Version B",
      code: `void buildSendTx(byte[] utxo_id, int vout) {
  // Input: consume the full 0.8 BTC UTXO
  addInput(utxo_id, vout);

  // Output 1: recipient gets 0.5 BTC
  addOutput(recipientAddr, 50_000_000);

  // Output 2: change back to sender
  // 80_000_000 - 50_000_000 - 100_000 = 29_900_000
  addOutput(changeAddr, 29_900_000);

  // Fee is implicit: 80M - 50M - 29.9M = 100k sats
}`,
    },
    {
      key: "C",
      label: "Version C",
      code: `void buildSendTx(byte[] utxo_id, int vout) {
  // Input: consume the full 0.8 BTC UTXO
  addInput(utxo_id, vout);

  // Output 1: recipient gets 0.5 BTC
  addOutput(recipientAddr, 50_000_000);

  // Output 2: change back to sender
  addOutput(changeAddr, 30_000_000);

  // Total outputs = 0.5 + 0.3 = 0.8 BTC
}`,
    },
  ],
  correctKey: "B",
  reveal: {
    summary:
      "Bitcoin does not debit balances. It destroys old outputs and creates new ones. If you want leftover value back, you must create an explicit change output.",
    details:
      'Version A passes an amount to addInput — but Bitcoin inputs consume the entire UTXO. There is no "partial spend." The 0.299 BTC left "inside" the UTXO is actually destroyed, making the true fee 0.3 BTC instead of 0.001. Version C creates outputs totaling exactly 0.8 BTC (0.5 + 0.3), leaving zero for the miner fee. A real node would reject this or the miner gets nothing. The correct change amount is 0.299 BTC (input minus recipient minus fee).',
    dangerNote:
      "Version A reflects account-balance thinking — the most common mental model error for developers coming from Ethereum or traditional banking. Version C looks almost right but forgets that fee = inputs − outputs, so every satoshi must be explicitly accounted for.",
  },
};
