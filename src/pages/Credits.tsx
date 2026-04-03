import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageBackground } from "../shared/components/index.ts";

const SECTION = "rounded-card border border-border bg-surface-raised p-6";
const SECTION_TITLE = "mb-3 text-base font-bold text-text-primary";

interface Credit {
  name: string;
  url: string;
  description: string;
}

const INSPIRATIONS: Credit[] = [
  {
    name: "Anders Brownworth — Blockchain Demo",
    url: "https://andersbrownworth.com/blockchain/",
    description:
      "Pioneered the interactive type-and-see-hash-change pattern for Bitcoin education.",
  },
  {
    name: "Sam Rose — samwho.dev/hashing",
    url: "https://samwho.dev/hashing/",
    description: "Reduced hash space visualization that inspired the Birthday Paradox demo.",
  },
  {
    name: "Stepan Snigirev — Visual SHA-256",
    url: "https://stepansnigirev.github.io/visual-sha256/",
    description: "Click-to-derive constant verification that inspired the NUMS panel.",
  },
  {
    name: "Bitcoin Dev Project — hashexplained.com",
    url: "https://hashexplained.com/",
    description: "Animated round-by-round SHA-256 walkthrough.",
  },
  {
    name: "Greg Walker — SHA-256 Animation",
    url: "https://github.com/in3rsha/sha256-animation",
    description: "Terminal-based SHA-256d step-through with Bitcoin support.",
  },
];

const LIBRARIES: Credit[] = [
  {
    name: "@noble/hashes, @noble/curves",
    url: "https://github.com/paulmillr/noble-hashes",
    description: "Audited, pure-JS cryptographic primitives by Paul Miller.",
  },
  {
    name: "@scure/bip32, @scure/bip39",
    url: "https://github.com/paulmillr/scure-bip32",
    description: "Audited BIP-32/39 implementations by Paul Miller.",
  },
];

const REFERENCES: Credit[] = [
  {
    name: "Ferguson & Schneier — Practical Cryptography (2003)",
    url: "https://www.schneier.com/books/practical-cryptography/",
    description: "Origin of the SHA-256d construction used in Bitcoin.",
  },
  {
    name: "LearnMeABitcoin",
    url: "https://learnmeabitcoin.com/",
    description: "Clear technical explanations of Bitcoin internals.",
  },
  {
    name: "Heilman et al. — Eclipse Attacks on Bitcoin's Peer-to-Peer Network (USENIX 2015)",
    url: "https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/heilman",
    description:
      "Foundational research on eclipse attacks and the AddrMan defenses. Informed the Eclipse Attack demo.",
  },
  {
    name: "BIP 152 — Compact Block Relay",
    url: "https://github.com/bitcoin/bips/blob/master/bip-0152.mediawiki",
    description:
      "Protocol for transmitting blocks as short transaction IDs. Informed the Compact Block Relay demo.",
  },
  {
    name: "Bitcoin Optech — Topics",
    url: "https://bitcoinops.org/en/topics/",
    description:
      "Authoritative technical summaries of compact block relay, eclipse attacks, Erlay, and Dandelion.",
  },
  {
    name: "Bitcoin Core — DNS Seed Policy",
    url: "https://github.com/bitcoin/bitcoin/blob/master/doc/dnsseed-policy.md",
    description:
      "Documents the DNS seed bootstrap mechanism and its trust model. Informed the Bootstrap Waterfall demo.",
  },
  {
    name: "Bitcoin Wiki — Satoshi Client Node Discovery",
    url: "https://en.bitcoin.it/wiki/Satoshi_Client_Node_Discovery",
    description:
      "Historical documentation of Bitcoin's peer discovery evolution, including the original IRC bootstrap method.",
  },
  {
    name: "BIP-380 — Output Script Descriptors (Pieter Wuille, Ava Chow)",
    url: "https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki",
    description:
      "Core specification for the descriptor grammar, key expressions, and BCH checksum algorithm. The checksum implementation in Module 7 is a direct port of BIP-380's reference code.",
  },
  {
    name: "Bitcoin Core — Output Descriptors Documentation",
    url: "https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md",
    description:
      "Practical reference for descriptor syntax, supported functions, and usage examples in Bitcoin Core's descriptor wallet.",
  },
  {
    name: "Bitcoin Optech — Output Script Descriptors",
    url: "https://bitcoinops.org/en/topics/output-script-descriptors/",
    description:
      "Technical summary of descriptor adoption, related BIPs (381–386, 389), and miniscript integration.",
  },
  {
    name: "Pieter Wuille — Miniscript Reference",
    url: "https://bitcoin.sipa.be/miniscript/",
    description:
      "Reference implementation and documentation for Miniscript, the policy language that composes with descriptors inside wsh() and tr() expressions.",
  },
];

function CreditList({ items }: { items: Credit[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name} className="text-sm">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            {item.name}
          </a>
          <p className="mt-0.5 text-text-muted">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Credits() {
  return (
    <PageBackground>
      <div className="relative z-10 mx-auto max-w-2xl px-5 py-12 md:px-8 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13l-5-5 5-5" />
            </svg>
            Back to Home
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-text-primary">Credits</h1>
          <p className="mb-8 text-sm text-text-secondary">
            Bitcoin Visual builds on the work of educators, researchers, and open-source authors.
          </p>

          <div className="space-y-5">
            <section className={SECTION}>
              <h2 className={SECTION_TITLE}>Inspirations</h2>
              <CreditList items={INSPIRATIONS} />
            </section>

            <section className={SECTION}>
              <h2 className={SECTION_TITLE}>Cryptography Libraries</h2>
              <CreditList items={LIBRARIES} />
            </section>

            <section className={SECTION}>
              <h2 className={SECTION_TITLE}>References</h2>
              <CreditList items={REFERENCES} />
            </section>
          </div>
        </motion.div>
      </div>
    </PageBackground>
  );
}
