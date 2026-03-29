import { bytesToHex } from "@noble/hashes/utils.js";
import type { Transaction } from "./transaction";

// ── Types ──

export interface PSBTInput {
  prevTxid: Uint8Array;
  prevVout: number;
  witnessUtxoValue: bigint;
  witnessUtxoScript: Uint8Array;
  witnessScript: Uint8Array;
  partialSigs: Map<string, Uint8Array>; // pubkey hex → DER sig + sighash byte
  sighashType: number;
}

export interface PSBTOutput {
  value: bigint;
  scriptPubKey: Uint8Array;
}

export type PSBTStatus = "unsigned" | "partially_signed" | "fully_signed" | "finalized";

export interface PSBT {
  unsignedTx: Transaction;
  inputs: PSBTInput[];
  outputs: PSBTOutput[];
  status: PSBTStatus;
}

// ── Helpers ──

function validateInputIndex(psbt: PSBT, inputIndex: number): void {
  if (!Number.isInteger(inputIndex) || inputIndex < 0 || inputIndex >= psbt.inputs.length) {
    throw new RangeError(
      `Invalid inputIndex for PSBT: ${inputIndex} (PSBT has ${psbt.inputs.length} inputs)`,
    );
  }
}

// ── Functions ──

/**
 * Create an unsigned PSBT from a transaction and witness metadata.
 * Only supports single-input transactions — throws if tx has multiple inputs.
 */
export function createUnsignedPSBT(
  tx: Transaction,
  witnessScript: Uint8Array,
  inputValue: bigint,
  inputScriptPubKey: Uint8Array,
): PSBT {
  if (tx.inputs.length !== 1) {
    throw new Error(
      `createUnsignedPSBT only supports single-input transactions (got ${tx.inputs.length}). ` +
        "For multi-input PSBTs, per-input metadata is required.",
    );
  }
  const inputs: PSBTInput[] = tx.inputs.map((input) => ({
    prevTxid: input.txid,
    prevVout: input.vout,
    witnessUtxoValue: inputValue,
    witnessUtxoScript: inputScriptPubKey,
    witnessScript,
    partialSigs: new Map(),
    sighashType: 0x01, // SIGHASH_ALL
  }));

  const outputs: PSBTOutput[] = tx.outputs.map((output) => ({
    value: output.value,
    scriptPubKey: output.scriptPubKey,
  }));

  return { unsignedTx: tx, inputs, outputs, status: "unsigned" };
}

/** Add a partial signature to the PSBT (immutable — returns a new PSBT). */
export function addPartialSignature(
  psbt: PSBT,
  inputIndex: number,
  pubKey: Uint8Array,
  signature: Uint8Array,
): PSBT {
  validateInputIndex(psbt, inputIndex);
  const newInputs = psbt.inputs.map((input, i) => {
    if (i !== inputIndex) return input;
    const newSigs = new Map(input.partialSigs);
    newSigs.set(bytesToHex(pubKey), signature);
    return { ...input, partialSigs: newSigs };
  });

  const sigCount = newInputs[inputIndex].partialSigs.size;
  let status: PSBTStatus;
  if (sigCount === 0) {
    status = "unsigned";
  } else {
    // We don't know m from the PSBT alone, so mark as partially_signed.
    // The caller checks threshold via countSignatures.
    status = "partially_signed";
  }

  return { ...psbt, inputs: newInputs, status };
}

/** Count how many partial signatures exist for a given input. */
export function countSignatures(psbt: PSBT, inputIndex: number): number {
  validateInputIndex(psbt, inputIndex);
  return psbt.inputs[inputIndex].partialSigs.size;
}

/**
 * Finalize a P2WSH multisig PSBT input and return the completed Transaction.
 *
 * Builds the witness stack: [OP_0 dummy, sig1, sig2, ..., witnessScript]
 * Signatures are ordered by their pubkey's position in the witness script (BIP67).
 */
export function finalizePSBTMultisig(psbt: PSBT, inputIndex: number, m: number): Transaction {
  validateInputIndex(psbt, inputIndex);
  const input = psbt.inputs[inputIndex];
  const sigCount = input.partialSigs.size;
  if (sigCount < m) {
    throw new Error(`Not enough signatures: have ${sigCount}, need ${m}`);
  }

  // Extract sorted pubkeys from the witness script to determine signature order.
  // Witness script format: OP_M <len> <pk1> <len> <pk2> ... <len> <pkN> OP_N OP_CHECKMULTISIG
  const pubkeysInScript = extractPubkeysFromScript(input.witnessScript);

  // Order signatures by their pubkey position in the script
  const orderedSigs: Uint8Array[] = [];
  for (const pk of pubkeysInScript) {
    const pkHex = bytesToHex(pk);
    const sig = input.partialSigs.get(pkHex);
    if (sig) {
      orderedSigs.push(sig);
      if (orderedSigs.length >= m) break;
    }
  }

  if (orderedSigs.length < m) {
    throw new Error(`Could not find ${m} matching signatures in script`);
  }

  // Build witness stack: [dummy (OP_0), sig1, sig2, ..., witnessScript]
  const witness: Uint8Array[] = [
    new Uint8Array(0), // OP_0 dummy for CHECKMULTISIG off-by-one bug
    ...orderedSigs,
    input.witnessScript,
  ];

  // Clone the transaction and attach witness
  const newInputs = psbt.unsignedTx.inputs.map((txInput, i) => {
    if (i !== inputIndex) return txInput;
    return { ...txInput, witness };
  });

  return {
    version: psbt.unsignedTx.version,
    inputs: newInputs,
    outputs: psbt.unsignedTx.outputs,
    locktime: psbt.unsignedTx.locktime,
  };
}

/**
 * Extract compressed pubkeys from a multisig redeem script.
 * Script format: OP_M <33> <pk1> <33> <pk2> ... OP_N OP_CHECKMULTISIG
 */
export function extractPubkeysFromScript(script: Uint8Array): Uint8Array[] {
  const pubkeys: Uint8Array[] = [];
  let offset = 1; // skip OP_M
  while (offset < script.length - 2) {
    const len = script[offset];
    if (len !== 33 && len !== 65) break; // not a pubkey push
    offset += 1;
    pubkeys.push(script.slice(offset, offset + len));
    offset += len;
  }
  return pubkeys;
}

/** Produce a human-readable structured display of the PSBT state. */
export function serializePSBTDisplay(psbt: PSBT): string {
  const lines: string[] = [];
  lines.push(`[PSBT — status: ${psbt.status}]`);
  lines.push("");

  // Unsigned TX summary
  const tx = psbt.unsignedTx;
  lines.push(`version: ${tx.version}`);
  lines.push(`inputs: ${tx.inputs.length}`);
  for (let i = 0; i < tx.inputs.length; i++) {
    const inp = tx.inputs[i];
    lines.push(`  input[${i}]: ${bytesToHex(inp.txid).slice(0, 16)}...:${inp.vout}`);
  }
  lines.push(`outputs: ${tx.outputs.length}`);
  for (let i = 0; i < tx.outputs.length; i++) {
    const out = tx.outputs[i];
    lines.push(
      `  output[${i}]: ${out.value} sats → ${bytesToHex(out.scriptPubKey).slice(0, 20)}...`,
    );
  }
  lines.push(`locktime: ${tx.locktime}`);
  lines.push("");

  // PSBT input metadata
  for (let i = 0; i < psbt.inputs.length; i++) {
    const input = psbt.inputs[i];
    lines.push(`[Input ${i} metadata]`);
    lines.push(`  witnessScript: ${bytesToHex(input.witnessScript).slice(0, 32)}...`);
    lines.push(`  witnessUtxoValue: ${input.witnessUtxoValue} sats`);
    lines.push(`  sighashType: 0x${input.sighashType.toString(16).padStart(2, "0")}`);
    lines.push(`  partialSigs: ${input.partialSigs.size}`);
    for (const [pkHex, sig] of input.partialSigs) {
      lines.push(`    ${pkHex.slice(0, 16)}... → ${bytesToHex(sig).slice(0, 24)}...`);
    }
  }

  return lines.join("\n");
}
