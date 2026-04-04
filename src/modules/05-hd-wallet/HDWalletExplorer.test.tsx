import { describe, it, expect } from "vite-plus/test";
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
    const matches = screen.getAllByText("HD Wallet Tree");
    expect(matches.length).toBeGreaterThanOrEqual(1);
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

    const pills = document.querySelectorAll(
      '[class*="rounded-pill"][class*="bg-surface-raised"][class*="gap-1"]',
    );
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

  it("renders Explorer and Backup & Recovery tabs", async () => {
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const explorerTab = screen.getByRole("tab", { name: /explorer/i });
    const backupTab = screen.getByRole("tab", { name: /backup/i });
    expect(explorerTab).toBeInTheDocument();
    expect(backupTab).toBeInTheDocument();
  });

  it("Explorer tab is active by default", async () => {
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const explorerTab = screen.getByRole("tab", { name: /explorer/i });
    expect(explorerTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });

  it("switching to Backup tab shows Start Demo", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const backupTab = screen.getByRole("tab", { name: /backup/i });
    await user.click(backupTab);

    expect(await screen.findByText("Start Demo")).toBeInTheDocument();
  });

  it("Backup demo: full create → destroy → restore cycle", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    // Switch to backup tab
    await user.click(screen.getByRole("tab", { name: /backup/i }));
    const startBtn = await screen.findByText("Start Demo");
    await user.click(startBtn);

    // Wait for addresses to appear (PBKDF2 derivation)
    await waitFor(
      () => {
        expect(screen.getAllByText(/^bc1q/).length).toBeGreaterThanOrEqual(3);
      },
      { timeout: 10000 },
    );

    // Confirm save
    await user.click(screen.getByText("I've saved my seed phrase"));

    // Destroy
    await user.click(await screen.findByText("Simulate Device Loss"));

    // Should show destroyed state
    expect(await screen.findByText(/your device is gone/i)).toBeInTheDocument();

    // Recover
    await user.click(await screen.findByText("Recover Wallet"));

    // Should reach success
    await waitFor(
      () => {
        expect(screen.getByText("Wallet Restored")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // All 3 address pairs should match
    const matchBadges = screen.getAllByText("Match");
    expect(matchBadges.length).toBe(3);

    // Reset back to idle
    await user.click(screen.getByText("Try Again"));
    expect(await screen.findByText("Start Demo")).toBeInTheDocument();
  });

  it("Code Review tab renders and is clickable", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    const codeReviewTab = screen.getByRole("tab", { name: /code review/i });
    expect(codeReviewTab).toBeInTheDocument();

    await user.click(codeReviewTab);

    expect(await screen.findByText("Review: child key derivation")).toBeInTheDocument();
  });

  it("Code Review tab shows all three options", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: /code review/i }));

    expect(await screen.findByText("Version A")).toBeInTheDocument();
    expect(screen.getByText("Version B")).toBeInTheDocument();
    expect(screen.getByText("Version C")).toBeInTheDocument();
  });

  it("Code Review tab updates theory panel", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: /code review/i }));

    await waitFor(() => {
      const headings = screen.getAllByText("Derivation Security");
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Backup demo: Simulate Device Loss disabled before confirming save", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HDWalletExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: /backup/i }));
    await user.click(await screen.findByText("Start Demo"));

    // Wait for addresses
    await waitFor(
      () => {
        expect(screen.getAllByText(/^bc1q/).length).toBeGreaterThanOrEqual(3);
      },
      { timeout: 10000 },
    );

    // Destroy button should not be visible yet (user hasn't confirmed save)
    expect(screen.queryByText("Simulate Device Loss")).not.toBeInTheDocument();
    expect(screen.getByText("I've saved my seed phrase")).toBeInTheDocument();
  });
});
