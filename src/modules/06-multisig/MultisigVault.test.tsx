import { describe, it, expect } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MultisigVault from "./MultisigVault.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("MultisigVault", () => {
  it("AC1: renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });
    const matches = screen.getAllByText("Multisig Vault");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("AC2: renders theory content", async () => {
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });
    const headings = screen.getAllByText("Multisig");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("AC3: tab switching between Vault Setup and Sign & Broadcast", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    // Vault Setup tab should be active by default (Generate All button visible)
    expect(screen.getByText("Generate All")).toBeInTheDocument();

    // Switch to Sign tab
    await user.click(screen.getByText("Sign & Broadcast"));

    // Should show guard message since keys not generated
    // Text is split by <strong> so we search across full textContent
    await waitFor(() => {
      const matches = screen.getAllByText((_content, element) => {
        return element?.textContent?.includes("generate all 3 cosigner keys") ?? false;
      });
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("AC4: Generate button creates a cosigner key", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    const buttons = screen.getAllByText("Generate Key");
    expect(buttons.length).toBe(3);

    await user.click(buttons[0]);

    // After generating, one fewer Generate Key button
    const remaining = screen.getAllByText("Generate Key");
    expect(remaining.length).toBe(2);

    // Public key hex should appear
    expect(screen.getByText("Compressed public key (33 bytes)")).toBeInTheDocument();
  });

  it("AC5: Generate All creates all 3 cosigner keys", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Generate All"));

    // All 3 public keys should appear
    const labels = screen.getAllByText("Compressed public key (33 bytes)");
    expect(labels.length).toBe(3);

    // No more Generate Key buttons
    expect(screen.queryByText("Generate Key")).not.toBeInTheDocument();
  });

  it("AC6: after all keys generated, redeem script and addresses appear", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Generate All"));

    // Redeem script label should appear (contains byte count)
    expect(screen.getByText(/Redeem Script.*105 bytes/)).toBeInTheDocument();

    // P2SH and P2WSH address labels
    expect(screen.getByText("P2SH Address")).toBeInTheDocument();
    expect(screen.getByText("P2WSH Address")).toBeInTheDocument();
  });

  it("AC7: security callout about redeem script backup is present", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Generate All"));

    expect(screen.getByText(/Back up your redeem script/)).toBeInTheDocument();
  });

  it("AC8: Sign tab guards when keys are missing", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Sign & Broadcast"));

    // Text split by <strong> — search across full textContent
    await waitFor(() => {
      const matches = screen.getAllByText((_content, element) => {
        return element?.textContent?.includes("generate all 3 cosigner keys") ?? false;
      });
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("AC9: full PSBT flow — create, sign, finalize, produces TXID", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    // Generate all keys
    await user.click(screen.getByText("Generate All"));

    // Switch to Sign tab
    await user.click(screen.getByText("Sign & Broadcast"));

    // Wait for tab content to appear (AnimatePresence transition)
    await waitFor(() => {
      expect(screen.getByText("Create PSBT")).toBeInTheDocument();
    });

    // Step 1: Create PSBT
    await user.click(screen.getByText("Create PSBT"));
    expect(screen.getByText(/PSBT State/)).toBeInTheDocument();

    // Step 2: Sign as Cosigner 1
    await user.click(screen.getByText("Sign as Cosigner 1"));
    // Signature tracker should update
    const tracker1 = screen.getAllByText(/Cosigner 1/);
    expect(tracker1.length).toBeGreaterThanOrEqual(1);

    // Step 3: Sign as Cosigner 2
    await user.click(screen.getByText("Sign as Cosigner 2"));
    // Threshold met message (may appear in multiple trackers)
    const thresholdMessages = screen.getAllByText(/Threshold met/);
    expect(thresholdMessages.length).toBeGreaterThanOrEqual(1);

    // Step 4: Finalize
    await user.click(screen.getByText("Finalize PSBT"));
    expect(screen.getByText(/Signed Transaction/)).toBeInTheDocument();
    expect(screen.getByText(/TXID/)).toBeInTheDocument();

    // Simulate broadcast
    await user.click(screen.getByText("Broadcast & Mine"));
    expect(screen.getByText(/broadcast to the network/)).toBeInTheDocument();
  });

  // ── Security Models tab tests ──

  it("AC10: renders Security Models tab with Model A", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Security Models"));

    await waitFor(() => {
      expect(screen.getByText("Model A: Single Key")).toBeInTheDocument();
    });
  });

  it("AC11: model navigation with Next / Previous", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Security Models"));
    await waitFor(() => {
      expect(screen.getByText("Model A: Single Key")).toBeInTheDocument();
    });

    // Navigate forward
    await user.click(screen.getByText("Next →"));
    await waitFor(() => {
      expect(screen.getByText("Model B: Single-User Multisig")).toBeInTheDocument();
    });

    // Navigate back
    await user.click(screen.getByText("← Previous"));
    await waitFor(() => {
      expect(screen.getByText("Model A: Single Key")).toBeInTheDocument();
    });
  });

  it("AC12: model stepper direct click jumps to correct model", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Security Models"));
    await waitFor(() => {
      expect(screen.getByText("Model A: Single Key")).toBeInTheDocument();
    });

    // Click stepper circle for Model D
    await user.click(screen.getByRole("tab", { name: /Model D/i }));
    await waitFor(() => {
      expect(screen.getByText("Model D: Trustless Escrow")).toBeInTheDocument();
    });
  });

  it("AC13: tradeoff annotations visible", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Security Models"));
    await waitFor(() => {
      expect(screen.getByText(/Single point of failure/)).toBeInTheDocument();
    });
  });

  it("Code Review tab renders and is clickable", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    const codeReviewTab = screen.getByRole("tab", { name: /code review/i });
    expect(codeReviewTab).toBeInTheDocument();

    await user.click(codeReviewTab);

    expect(await screen.findByText("Review: 2-of-3 spend validation")).toBeInTheDocument();
  });

  it("Code Review tab shows all three options", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByRole("tab", { name: /code review/i }));

    expect(await screen.findByText("Version A")).toBeInTheDocument();
    expect(screen.getByText("Version B")).toBeInTheDocument();
    expect(screen.getByText("Version C")).toBeInTheDocument();
  });

  it("Code Review tab updates theory panel", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByRole("tab", { name: /code review/i }));

    await waitFor(() => {
      const headings = screen.getAllByText("Script Enforcement");
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("AC14: all 6 models render without crash", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<MultisigVault />);
    });

    await user.click(screen.getByText("Security Models"));
    await waitFor(() => {
      expect(screen.getByText("Model A: Single Key")).toBeInTheDocument();
    });

    const titles = [
      "Model B: Single-User Multisig",
      "Model C: Two-Party Multisig",
      "Model D: Trustless Escrow",
      "Model E: User + Policy Oracle",
      "Model F: Enterprise Custody",
    ];

    for (const title of titles) {
      await user.click(screen.getByText("Next →"));
      await waitFor(() => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    }
  });
});
