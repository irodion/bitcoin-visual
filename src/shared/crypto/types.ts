export type Network = "mainnet" | "testnet";
export interface XPub {
  publicKey: Uint8Array;
  chainCode: Uint8Array;
}
