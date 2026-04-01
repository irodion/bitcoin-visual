export interface BrainWalletEntry {
  passphrase: string;
  address: string;
  note: string;
}

/**
 * Historically swept brain wallet passphrases (public blockchain data).
 * Each address is derived from: SHA-256(passphrase) -> privkey -> compressed pubkey -> P2PKH address.
 */
export const BRAIN_WALLET_HALL_OF_SHAME: readonly BrainWalletEntry[] = [
  {
    passphrase: "password",
    address: "16qVRutZ7rZuPx7NMtapvZorWYjyaME2Ue",
    note: "Swept instantly",
  },
  {
    passphrase: "correct horse battery staple",
    address: "1C7zdTfnkzmr13HfA2vNm5SJYRK6nEKyq8",
    note: "Famous xkcd phrase, swept 2013",
  },
  { passphrase: "bitcoin", address: "18VkRiDhFu2Z17AvtpU3vL2LbTXDzCvDVo", note: "Swept 2011" },
  { passphrase: "satoshi", address: "1xm4vFerV3pSgvBFkyzLgT1Ew3HQYrS1V", note: "Swept 2012" },
  { passphrase: "hello", address: "1MmqjDhakEfJd9r5BoDhPApCpA75Em17GA", note: "Swept instantly" },
  { passphrase: "abc", address: "1PoQRMsXyQFSqCCRek7tt7umfRkJG9TY8x", note: "Swept instantly" },
  { passphrase: "1234", address: "1F3c4AdEUxwWEo64k15LyftN8n7eZkckjU", note: "Swept instantly" },
  { passphrase: "test", address: "19eA3hUfKRt7aZymavdQFXg5EZ6KCVKxr8", note: "Swept instantly" },
  { passphrase: "god", address: "16J33t7wKm9dzDWbdGiuHaGzHFLbbzfAto", note: "Swept instantly" },
  { passphrase: "love", address: "1Cgs1VLk5rtKZYERJB1gyV5Gx35mX8eAHX", note: "Swept instantly" },
  { passphrase: "secret", address: "1CYGAH11BRDtTfX13SDSjBvrxJpmugRwSm", note: "Swept instantly" },
  { passphrase: "money", address: "1DCJ5tZ3Y8Fqg9Ygxqqb6AmUM43H7nuThC", note: "Swept instantly" },
  { passphrase: "master", address: "19ZpBaCXiE5oB8hKEnTJxDe3eYQz5zfh1T", note: "Swept instantly" },
  { passphrase: "letmein", address: "13RSG1zQ9VKbqbfdqLx8HsM7bsv4iSfsY5", note: "Swept instantly" },
  { passphrase: "qwerty", address: "1699oAd32emhfShPDFVs5UY8vJNe2u42Fz", note: "Swept instantly" },
  { passphrase: "admin", address: "1MoMDz92cjN7EPxYE7ouUyLm9cod8PGcTD", note: "Swept instantly" },
  {
    passphrase: "passphrase",
    address: "1L7XnPP7L1LXV4TB5sqyKj4YZjUCHPr4z6",
    note: "Swept instantly",
  },
  { passphrase: "blockchain", address: "1Bv8QzG61KrzKGjc2gCHuyc2p4rbnjxNPN", note: "Swept 2014" },
  { passphrase: "brainwallet", address: "1JgwwRW1ZuE4joFcQpEWyBayojhVfpA8Cp", note: "Swept 2013" },
  { passphrase: "hunter2", address: "16gjiBTKieg9mf62LnBnposd3kHsfdhqjk", note: "Swept instantly" },
] as const;

export const BRAIN_WALLET_PHRASES = new Set(
  BRAIN_WALLET_HALL_OF_SHAME.map((e) => e.passphrase.toLowerCase()),
);
