import { bytesToHex } from "@noble/hashes/utils.js";
import { BTN_GHOST } from "../../../shared/components/styles.ts";

const PRESETS: Array<{ label: string; value: string | null; tooltip: string }> = [
  {
    label: "Genesis Block",
    value: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks",
    tooltip: "Satoshi embedded this headline in the Genesis block coinbase",
  },
  {
    label: "Whitepaper",
    value: "Bitcoin: A Peer-to-Peer Electronic Cash System",
    tooltip: "Title of Satoshi Nakamoto's 2008 whitepaper",
  },
  {
    label: "Empty String",
    value: "",
    tooltip: "SHA-256 of empty input: e3b0c44298fc…",
  },
  {
    label: "Random Hex",
    value: null,
    tooltip: "16 random bytes as hex",
  },
];

interface PresetInputsProps {
  onSelect: (value: string) => void;
}

export function PresetInputs({ onSelect }: PresetInputsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          title={preset.tooltip}
          aria-label={`${preset.label}: ${preset.tooltip}`}
          onClick={() => {
            if (preset.value === null) {
              const bytes = crypto.getRandomValues(new Uint8Array(16));
              onSelect(bytesToHex(bytes));
            } else {
              onSelect(preset.value);
            }
          }}
          className={BTN_GHOST}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
