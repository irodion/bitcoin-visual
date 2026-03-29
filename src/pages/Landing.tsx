import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { PageBackground } from "../shared/components/index.ts";

interface ModuleItem {
  number: number;
  title: string;
  description: string;
  route: string;
  color: string;
  active: boolean;
}

const MODULES: ModuleItem[] = [
  {
    number: 1,
    title: "Hash Playground",
    description: "SHA-256 and SHA-256d — type anything, watch the fingerprint materialize.",
    route: "/hash",
    color: "#F7931A",
    active: true,
  },
  {
    number: 2,
    title: "Keys & Addresses",
    description: "Generate a private key, derive public key, and encode Bitcoin addresses.",
    route: "/keys",
    color: "#36CFC9",
    active: true,
  },
  {
    number: 3,
    title: "UTXO & Transactions",
    description: "Build and inspect raw Bitcoin transactions, input by input.",
    route: "/utxo",
    color: "#7DD3FC",
    active: true,
  },
  {
    number: 4,
    title: "Blockchain & Mining",
    description: "Mine blocks, adjust difficulty, and see how the chain grows.",
    route: "/blockchain",
    color: "#22C55E",
    active: false,
  },
  {
    number: 5,
    title: "HD Wallet Tree",
    description: "BIP-32/39 hierarchical deterministic key derivation visualized.",
    route: "/hd-wallet",
    color: "#FBBF24",
    active: false,
  },
  {
    number: 6,
    title: "Multisig Vault",
    description: "Create 2-of-3 multisig scripts and sign with PSBTs.",
    route: "/multisig",
    color: "#A78BFA",
    active: true,
  },
  {
    number: 7,
    title: "Attack Lab",
    description: "Nonce reuse, xpub leaks, and other real-world crypto pitfalls.",
    route: "/attacks",
    color: "#FF6B6B",
    active: false,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CARD_STYLE = { background: "linear-gradient(180deg, #121A28, #0C1320)" };

export default function Landing() {
  return (
    <PageBackground glowSize={700} amberOpacity={0.22} tealOpacity={0.16}>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center md:mb-16"
        >
          <div className="mb-4 inline-block rounded-pill border border-border-amber bg-warning-bg px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-warning-text">
            Interactive Bitcoin Cryptography
          </div>
          <h1 className="mb-4 text-4xl font-bold text-text-primary md:text-6xl">
            <span className="sr-only">BitcoinVault</span>
            <span aria-hidden="true">
              Bitcoin<span className="text-accent">Vault</span>
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Learn Bitcoin cryptography by doing. Every hash, key, and signature computed live in
            your browser — no backend, no secrets leave your machine.
          </p>
        </motion.div>

        {/* Module grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map((mod) => {
            const cardClasses = `block rounded-card border p-6 transition-all ${
              mod.active
                ? "group border-border shadow-container hover:border-border-strong hover:shadow-[0_18px_48px_rgba(0,0,0,0.36)]"
                : "border-border/50 opacity-50"
            }`;
            const cardContent = (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: `${mod.color}18`, color: mod.color }}
                  >
                    {mod.number}
                  </span>
                  {mod.active ? (
                    <span className="rounded-badge bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="rounded-badge bg-surface-raised px-2.5 py-1 text-[11px] font-bold text-text-muted">
                      COMING SOON
                    </span>
                  )}
                </div>
                <h2 className="mb-1 text-lg font-bold text-text-primary transition-colors group-hover:text-accent">
                  {mod.title}
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">{mod.description}</p>
                {mod.active && (
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Open module
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </div>
                )}
              </>
            );

            return (
              <motion.div key={mod.number} variants={cardVariants}>
                {mod.active ? (
                  <Link to={mod.route} className={cardClasses} style={CARD_STYLE}>
                    {cardContent}
                  </Link>
                ) : (
                  <div className={cardClasses} style={CARD_STYLE} aria-disabled="true">
                    {cardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-text-muted">
          All cryptography runs client-side via{" "}
          <span className="font-mono text-accent">@noble/*</span> libraries. Zero network requests.
        </div>
      </div>
    </PageBackground>
  );
}
