import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BlockchainSimulator from "./BlockchainSimulator.tsx";

// Mock Web Worker since jsdom doesn't support it
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}
vi.stubGlobal(
  "Worker",
  vi.fn(() => new MockWorker()),
);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("BlockchainSimulator", () => {
  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    expect(screen.getByText("Blockchain & Mining")).toBeInTheDocument();
  });

  it("renders 3 initial blocks", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    expect(screen.getByText("Block #0")).toBeInTheDocument();
    expect(screen.getByText("Block #1")).toBeInTheDocument();
    expect(screen.getByText("Block #2")).toBeInTheDocument();
  });

  it("AC: initial blocks are all valid", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    const validBadges = screen.getAllByText("Valid");
    expect(validBadges.length).toBe(3);
  });

  it("renders theory content with key concepts", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    expect(screen.getAllByText(/Hash Pointers/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Proof of Work/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Merkle Root/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/SPV Proofs/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders difficulty slider with default value 2", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    const slider = screen.getByLabelText("Difficulty");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue("2");
  });

  it("AC: editing a transaction invalidates that block", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    expect(screen.getAllByText("Valid").length).toBe(3);

    // Edit first transaction of block 0 (first of many "Transaction 0 data" labels)
    const txInputs = screen.getAllByLabelText("Transaction 0 data");
    await user.clear(txInputs[0]);
    await user.type(txInputs[0], "Modified transaction");

    const invalidBadges = screen.getAllByText(/Invalid/);
    expect(invalidBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("AC: editing nonce makes block invalid", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    expect(screen.getAllByText("Valid").length).toBe(3);

    // Each block has a nonce input with unique id
    const nonceInput = screen.getByLabelText("Nonce", { selector: "#nonce-0" });
    await user.clear(nonceInput);
    await user.type(nonceInput, "99999999");

    const invalidBadges = screen.getAllByText(/Invalid/);
    expect(invalidBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("AC: Mine button appears only on invalid blocks", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    // No Mine buttons when all valid
    expect(screen.queryByText("Mine Block")).not.toBeInTheDocument();

    // Invalidate block 0
    const txInputs = screen.getAllByLabelText("Transaction 0 data");
    await user.clear(txInputs[0]);
    await user.type(txInputs[0], "Tampered");

    // Mine button should now appear
    expect(screen.getAllByText("Mine Block").length).toBeGreaterThanOrEqual(1);
  });

  it("AC: difficulty slider changes displayed difficulty", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    const slider = screen.getByLabelText("Difficulty");
    // Fire native change event for range input
    fireEvent.change(slider, { target: { value: "3" } });

    // Should show "000" requirement
    expect(screen.getByText("000")).toBeInTheDocument();
  });

  it("AC: clicking a block opens Merkle tree panel", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    // No Merkle panel initially
    expect(screen.queryByText(/Merkle Tree — Block/)).not.toBeInTheDocument();

    // Click block 0 header
    const block0Header = screen.getByText("Block #0");
    await user.click(block0Header);

    // Merkle panel should appear
    expect(screen.getByText("Merkle Tree — Block #0")).toBeInTheDocument();
    expect(screen.getByText("3 transactions")).toBeInTheDocument();
  });

  it("AC: clicking a transaction shows SPV proof info", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    // Open Merkle panel for block 0
    const block0Header = screen.getByText("Block #0");
    await user.click(block0Header);

    // Find and click a leaf node (the buttons with truncated hash + tx label)
    const leafButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Alice"));
    expect(leafButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(leafButtons[0]);

    // Should show proof info (appears in both theory panel and SPV box)
    const proofTexts = screen.getAllByText(/you only need/);
    expect(proofTexts.length).toBeGreaterThanOrEqual(2);
  });

  it("AC: adding a transaction invalidates the block", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    expect(screen.getAllByText("Valid").length).toBe(3);

    // Click "+ Add TX" on block 0 (first one)
    const addButtons = screen.getAllByText("+ Add TX");
    await user.click(addButtons[0]);

    // Block should now show 4 transactions and be invalid
    expect(screen.getByText("Transactions (4)")).toBeInTheDocument();
    const invalidBadges = screen.getAllByText(/Invalid/);
    expect(invalidBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows hash target requirement in mining controls", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    // Default difficulty 2 → must start with "00"
    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText(/hashes expected/)).toBeInTheDocument();
  });

  it("renders ValueFlowArrows between blocks", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    // 2 arrows between 3 blocks
    const arrows = screen.getAllByText("prev hash");
    expect(arrows.length).toBe(2);
  });
});
