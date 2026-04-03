export { sha256, sha256d, ripemd160, hash160 } from "./hash";
export { generatePrivateKey, privateKeyToPublicKey, isValidPrivateKey } from "./keys";
export {
  publicKeyToP2PKHAddress,
  publicKeyToP2WPKHAddress,
  base58CheckEncode,
  base58CheckDecode,
} from "./address";
export { generateMnemonic, mnemonicToSeed, validateMnemonic } from "./bip39";
export { seedToMasterKey, deriveChild, hdKeyToXPub, hdKeyToXPrv, HARDENED_OFFSET } from "./bip32";
export {
  createMultisigRedeemScript,
  redeemScriptToP2SHAddress,
  redeemScriptToP2WSHAddress,
} from "./multisig";
export {
  serializeTransaction,
  serializeWitnessTransaction,
  buildP2PKHScript,
  buildP2WPKHScript,
  buildP2SHScript,
  buildP2WSHScript,
  buildP2PKHScriptSig,
  computeTxID,
  computeWTxID,
  reverseBytes,
  mapTransactionSegments,
} from "./transaction";
export type { Transaction, TxInput, TxOutput, TxSegment } from "./transaction";
export { signECDSA, signWithSighash, verifyECDSA, verifyECDSAPermissive } from "./signing";
export { computeBIP143Sighash, computeBIP143SighashVerbose, computeLegacySighash } from "./sighash";
export { parseDERSignature, encodeDERSignature, malleateSignatureS } from "./malleability";
export type { SighashDetail } from "./sighash";
export {
  createUnsignedPSBT,
  addPartialSignature,
  finalizePSBTMultisig,
  countSignatures,
  serializePSBTDisplay,
  extractPubkeysFromScript,
} from "./psbt";
export type { PSBT, PSBTInput, PSBTOutput, PSBTStatus } from "./psbt";
export {
  signWithNonce,
  recoverNonceFromTwoSigs,
  recoverPrivKeyFromNonce,
  xpubChildPrivToParentPriv,
  deriveAllSiblings,
  isHardenedIndex,
} from "./attacks";
export type { AttackSignature } from "./attacks";
export { buildMerkleTree, computeMerkleRoot, getMerkleProof } from "./merkle";
export type { MerkleProofStep } from "./merkle";
export {
  parseDescriptor,
  expandDescriptor,
  computeDescriptorChecksum,
  validateDescriptorChecksum,
  buildDescriptor,
  findFirstKey,
} from "./descriptor";
export type {
  ParsedDescriptor,
  DescriptorNode,
  DescriptorSegmentInfo,
  KeyExpression,
  KeyOrigin,
  ExpandedAddress,
  DescriptorConfig,
  ScriptType,
  SegmentKind,
} from "./descriptor";
export type { Network, XPub } from "./types";
