import { BTN_PRIMARY, BTN_GHOST, TEXTAREA, INPUT, LABEL } from "../../shared/components/styles.ts";
import { WordPillGrid } from "./WordPillGrid.tsx";

interface MnemonicPanelProps {
  mnemonicText: string;
  setMnemonicText: (t: string) => void;
  passphrase: string;
  setPassphrase: (p: string) => void;
  wordCount: 12 | 24;
  setWordCount: (wc: 12 | 24) => void;
  generateNewMnemonic: () => void;
  isValidMnemonic: boolean;
  words: Array<{ word: string; index: number }>;
}

export function MnemonicPanel({
  mnemonicText,
  setMnemonicText,
  passphrase,
  setPassphrase,
  wordCount,
  setWordCount,
  generateNewMnemonic,
  isValidMnemonic,
  words,
}: MnemonicPanelProps) {
  return (
    <div className="panel-cool rounded-section border border-border p-6">
      <h3 className="mb-1 text-lg font-bold text-text-primary">Mnemonic Phrase</h3>
      <p className="mb-4 text-sm text-text-muted">
        Generate a BIP39 mnemonic or paste your own to explore key derivation
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setWordCount(12)}
          className={wordCount === 12 ? BTN_PRIMARY : BTN_GHOST}
        >
          12 words
        </button>
        <button
          type="button"
          onClick={() => setWordCount(24)}
          className={wordCount === 24 ? BTN_PRIMARY : BTN_GHOST}
        >
          24 words
        </button>
        <button type="button" onClick={generateNewMnemonic} className={BTN_PRIMARY}>
          Generate
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="mnemonic-input" className={LABEL}>
          Or paste a mnemonic phrase
        </label>
        <textarea
          id="mnemonic-input"
          value={mnemonicText}
          onChange={(e) => setMnemonicText(e.target.value)}
          placeholder="Enter mnemonic words separated by spaces..."
          rows={3}
          spellCheck={false}
          autoComplete="off"
          className={TEXTAREA}
        />
      </div>

      {words.length > 0 && (
        <>
          <WordPillGrid words={words} showWordlistIndex className="mb-3" />

          <div className="flex items-center gap-2">
            {isValidMnemonic ? (
              <span className="flex items-center gap-1.5 text-sm text-success">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Checksum valid
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-danger">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Invalid mnemonic
              </span>
            )}
          </div>
        </>
      )}

      <div className="mt-4">
        <label htmlFor="passphrase-input" className={LABEL}>
          Optional passphrase (BIP39)
        </label>
        <input
          id="passphrase-input"
          type="text"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Leave empty for no passphrase"
          spellCheck={false}
          autoComplete="off"
          className={INPUT}
        />
      </div>
    </div>
  );
}
