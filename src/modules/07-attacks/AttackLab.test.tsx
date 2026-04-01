import { describe, it, expect } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AttackLab from "./AttackLab.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("AttackLab", () => {
  it("renders module layout with title and disclaimer", async () => {
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });
    const titles = screen.getAllByText("Attack Lab");
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Educational Only/)).toBeInTheDocument();
  });

  it("shows all five attack tabs", async () => {
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });
    expect(screen.getByRole("tab", { name: "Nonce Reuse" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "xpub Leak" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Weak Entropy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rainbow Table" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tx Malleability" })).toBeInTheDocument();
  });

  it("defaults to Nonce Reuse tab", async () => {
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });
    expect(screen.getByRole("tab", { name: "Nonce Reuse" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("auto-generates key pair on mount", async () => {
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });
    const privateKeyLabels = screen.getAllByText("Private Key (secret)");
    expect(privateKeyLabels.length).toBeGreaterThanOrEqual(1);
    const publicKeyLabels = screen.getAllByText("Public Key");
    expect(publicKeyLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("has two editable message inputs", async () => {
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });
    const msg1 = screen.getByLabelText("Message 1");
    const msg2 = screen.getByLabelText("Message 2");
    expect(msg1).toBeInTheDocument();
    expect(msg2).toBeInTheDocument();
    expect(msg1).toHaveValue("Hello, Bitcoin!");
    expect(msg2).toHaveValue("Buy coffee");
  });

  it("Sign Both Messages produces signature display with same-nonce badge", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByText("Sign Both Messages"));

    await waitFor(() => {
      expect(screen.getByText("Signature 1")).toBeInTheDocument();
      expect(screen.getByText("Signature 2")).toBeInTheDocument();
    });

    // Same-nonce mode by default — should show compromised badge
    const badges = screen.getAllByText(/Nonce Reused/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("different-nonce mode shows Protected badge", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    // Switch to different nonce mode
    await user.click(screen.getByText("Different nonce"));

    await user.click(screen.getByText("Sign Both Messages"));

    await waitFor(() => {
      const protectedBadges = screen.getAllByText(/Protected/);
      expect(protectedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("step-by-step mode gates formula steps behind reveal buttons", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    // Enable step-by-step
    await user.click(screen.getByLabelText("Step-by-step"));

    await user.click(screen.getByText("Sign Both Messages"));

    await waitFor(() => {
      const revealBtns = screen.getAllByText("Reveal next step");
      expect(revealBtns.length).toBeGreaterThanOrEqual(1);
    });

    // Click first reveal
    await user.click(screen.getAllByText("Reveal next step")[0]);

    // Should show step 1 content (Recover Nonce k)
    await waitFor(() => {
      expect(screen.getByText("Recover Nonce k")).toBeInTheDocument();
    });
  });

  it("regenerate clears signature state", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByText("Sign Both Messages"));
    await waitFor(() => {
      expect(screen.getByText("Signature 1")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Regenerate"));

    await waitFor(() => {
      expect(screen.queryByText("Signature 1")).not.toBeInTheDocument();
    });
  });

  it("switches to xpub Leak tab and shows setup display", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "xpub Leak" }));

    await waitFor(() => {
      const seedLabels = screen.getAllByText("Master Seed");
      expect(seedLabels.length).toBeGreaterThanOrEqual(1);
    });

    const chainCodeLabels = screen.getAllByText("Chain Code");
    expect(chainCodeLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("xpub Leak: Run Attack in normal mode produces recovered key and siblings", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "xpub Leak" }));

    await waitFor(() => {
      expect(screen.getByText("Run Attack")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Run Attack"));

    await waitFor(() => {
      const recoveredLabels = screen.getAllByText(/Recovered Parent Private Key/);
      expect(recoveredLabels.length).toBeGreaterThanOrEqual(1);
    });

    // Should show sibling entries
    const siblingSection = screen.getAllByText(/Derived Sibling Keys/);
    expect(siblingSection.length).toBeGreaterThanOrEqual(1);
  });

  it("xpub Leak: hardened mode shows Protected badge", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "xpub Leak" }));

    await waitFor(() => {
      expect(screen.getByText("Hardened")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Hardened"));
    await user.click(screen.getByText("Run Attack"));

    await waitFor(() => {
      const protectedBadges = screen.getAllByText(/parent key safe/);
      expect(protectedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("switches to Weak Entropy tab and shows passphrase input", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Weak Entropy" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Passphrase")).toBeInTheDocument();
    });
  });

  it("brain wallet: typing a known phrase triggers warning banner", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Weak Entropy" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Passphrase")).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText("Passphrase"));
    await user.type(screen.getByLabelText("Passphrase"), "password");

    await waitFor(() => {
      expect(screen.getByText(/Known brain wallet phrase/)).toBeInTheDocument();
    });
  });

  it("brain wallet: Generate Random Key shows RNG-derived key", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Weak Entropy" }));

    const genBtn = await screen.findByText("Generate Random Key");
    await user.click(genBtn);

    await waitFor(() => {
      const csprngLabels = screen.getAllByText(/CSPRNG/);
      expect(csprngLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("switches to Rainbow Table tab and shows Crack button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Rainbow Table" }));

    await waitFor(() => {
      expect(screen.getByText("Crack")).toBeInTheDocument();
    });
  });

  it("rainbow table: crack succeeds for selected hash", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Rainbow Table" }));

    await waitFor(() => {
      expect(screen.getByText("Crack")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Crack"));

    await waitFor(
      () => {
        expect(screen.getByText(/Cracked:/)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("switches to Tx Malleability tab and shows Malleate button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Tx Malleability" }));

    await waitFor(() => {
      expect(screen.getByText("Malleate Transaction")).toBeInTheDocument();
    });
  });

  it("tx malleability: legacy mode shows changed TxID", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Tx Malleability" }));

    await waitFor(() => {
      expect(screen.getByText("Malleate Transaction")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Malleate Transaction"));

    await waitFor(() => {
      expect(screen.getByText(/malleation succeeded/)).toBeInTheDocument();
    });
  });

  it("tx malleability: segwit mode shows unchanged TxID", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Tx Malleability" }));

    await waitFor(() => {
      expect(screen.getByText("SegWit (P2WPKH)")).toBeInTheDocument();
    });

    await user.click(screen.getByText("SegWit (P2WPKH)"));
    await user.click(screen.getByText("Malleate Transaction"));

    await waitFor(() => {
      expect(screen.getByText(/SegWit protects/)).toBeInTheDocument();
    });
  });

  it("rainbow table: salt toggle defeats lookup", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<AttackLab />);
    });

    await user.click(screen.getByRole("tab", { name: "Rainbow Table" }));

    await waitFor(() => {
      expect(screen.getByText("Enable Salt")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Enable salt"));
    await user.click(screen.getByText("Crack"));

    await waitFor(
      () => {
        expect(screen.getByText(/No match/)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
