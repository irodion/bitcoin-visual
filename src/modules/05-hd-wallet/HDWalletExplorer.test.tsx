import { describe, it, expect } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HDWalletExplorer from "./HDWalletExplorer.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// BIP39 test vector: 12-word "abandon" mnemonic with empty passphrase
const TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const TEST_SEED_PREFIX = "5eb00bbddcf069084889a8ab9155568165f5c453";
// Known P2WPKH address at m/84'/0'/0'/0/0 (BIP84 native SegWit)
const EXPECTED_FIRST_ADDRESS = "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu";

describe("HDWalletExplorer", () => {
  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });
    expect(screen.getByText("HD Wallet Tree")).toBeInTheDocument();
  });

  it("renders theory content", async () => {
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });
    const hdHeadings = screen.getAllByText("HD Wallets");
    expect(hdHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it("AC1: Generate produces 12 word pills", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    await user.click(screen.getByText("Generate"));

    const pills = document.querySelectorAll('[class*="rounded-pill"][class*="bg-surface-raised"]');
    expect(pills.length).toBe(12);
  });

  it("AC2: Paste test mnemonic shows Checksum valid", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    expect(screen.getByText("Checksum valid")).toBeInTheDocument();
  });

  it("AC3: Invalid mnemonic shows Invalid mnemonic", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(
      textarea,
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
    );

    expect(screen.getByText("Invalid mnemonic")).toBeInTheDocument();
  });

  it("AC4: Seed derivation shows result after PBKDF2", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText(/Seed \(512 bits\)/)).toBeInTheDocument();
    });
  });

  it("AC5: Known test vector produces correct seed prefix", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      const seedText = document.body.textContent;
      expect(seedText).toContain(TEST_SEED_PREFIX);
    });
  });

  it("AC6: Master key and chain code displayed", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText("Master Key")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Master Private Key/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Master Chain Code/i).length).toBeGreaterThanOrEqual(1);
  });

  it("AC7: Default BIP84 path segments visible", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText("Derivation Path")).toBeInTheDocument();
    });
    const pathMatches = screen.getAllByText("m/84'/0'/0'/0/0");
    expect(pathMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("AC8: Key tree shows 10 addresses (5 external + 5 change)", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText("Key Tree")).toBeInTheDocument();
    });

    const addresses = screen.getAllByText(/^bc1q/);
    expect(addresses.length).toBe(10);
  });

  it("AC9: Known test mnemonic produces correct first address at m/84'/0'/0'/0/0", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText(EXPECTED_FIRST_ADDRESS)).toBeInTheDocument();
    });

    const pathEntries = screen.getAllByText("m/84'/0'/0'/0/0");
    expect(pathEntries.length).toBeGreaterThanOrEqual(1);
  });

  it("AC10: Private keys hidden by default", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      expect(screen.getByText("Key Tree")).toBeInTheDocument();
    });

    expect(screen.getByText("Reveal Private Keys")).toBeInTheDocument();
    const privateKeyLabels = screen.queryAllByText("Private Key");
    expect(privateKeyLabels.length).toBe(0);
  });

  it("AC11: SecurityCallout present for xpub warning", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const textarea = screen.getByLabelText(/paste a mnemonic/i);
    await user.type(textarea, TEST_MNEMONIC);

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const xpubWarning = alerts.find((a) => a.textContent?.includes("xpub"));
      expect(xpubWarning).toBeTruthy();
    });
  });

  it("AC12: Generating twice produces different mnemonics", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    await user.click(screen.getByText("Generate"));
    const textarea = screen.getByLabelText(/paste a mnemonic/i) as HTMLTextAreaElement;
    const firstValue = textarea.value;

    await user.click(screen.getByText("Generate"));
    const secondValue = textarea.value;

    expect(firstValue).not.toBe(secondValue);
  });
});
