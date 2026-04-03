import { describe, it, expect, vi, afterAll } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BlockchainSimulator from "../BlockchainSimulator.tsx";

// ── Mocks ──

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}
vi.stubGlobal(
  "Worker",
  vi.fn(() => new MockWorker()),
);

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterAll(() => {
  vi.unstubAllGlobals();
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ── Tests ──

describe("NetworkTab", () => {
  it("renders tab bar with Blockchain and Network tabs", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    expect(screen.getByRole("tab", { name: "Blockchain" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Network" })).toBeInTheDocument();
  });

  it("AC: default tab is Blockchain, shows mining controls", async () => {
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });
    expect(screen.getByRole("tab", { name: "Blockchain" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Mining controls should be visible
    expect(screen.getByText("Difficulty")).toBeInTheDocument();
  });

  it("AC: clicking Network tab shows network content", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));

    // Wait for AnimatePresence transition
    expect(await screen.findByText("1 · Gossip Propagation")).toBeInTheDocument();
    expect(await screen.findByText("2 · Compact Block Relay")).toBeInTheDocument();
    expect(await screen.findByText("3 · Eclipse Attack")).toBeInTheDocument();
    expect(await screen.findByText("4 · Bootstrap Waterfall")).toBeInTheDocument();
  });

  it("AC: theory panel switches when tab changes", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    // Blockchain tab theory
    expect(screen.getByText("Hash Pointers")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Network" }));

    // Network tab theory
    expect(await screen.findByText("P2P Topology")).toBeInTheDocument();
    expect(await screen.findByText("Gossip Protocol")).toBeInTheDocument();
    expect(await screen.findByText("Compact Blocks")).toBeInTheDocument();
    expect(await screen.findByText("Eclipse Attacks")).toBeInTheDocument();
    expect(await screen.findByText("Node Bootstrap")).toBeInTheDocument();
  });

  it("AC: gossip section renders clickable nodes", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("1 · Gossip Propagation");

    // Node A should be clickable
    const nodeA = screen.getByTestId("network-node-n0");
    expect(nodeA).toBeInTheDocument();
    expect(nodeA).toHaveAttribute("role", "button");
  });

  it("AC: gossip view toggle filters connections", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("1 · Gossip Propagation");

    // PillToggle should exist with both options
    expect(screen.getByRole("radio", { name: "All Connections" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Outbound Only" })).toBeInTheDocument();
  });

  it("AC: compact block demo starts with button click", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("2 · Compact Block Relay");

    const startBtn = screen.getByRole("button", { name: "Start Demo" });
    expect(startBtn).toBeInTheDocument();
  });

  it("AC: eclipse attack has Next Step button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("3 · Eclipse Attack");

    const nextBtn = screen.getByRole("button", { name: "Next Step" });
    expect(nextBtn).toBeInTheDocument();

    // Advance one step
    await user.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText("Attacker peers: 3/8")).toBeInTheDocument();
    });
  });

  it("AC: bootstrap waterfall shows Start Bootstrap button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("4 · Bootstrap Waterfall");

    expect(screen.getByRole("button", { name: "Start Bootstrap" })).toBeInTheDocument();
  });

  it("AC: switching back to Blockchain tab shows original content", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    // Switch to Network
    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("1 · Gossip Propagation");

    // Switch back to Blockchain
    await user.click(screen.getByRole("tab", { name: "Blockchain" }));

    // Mining controls should be back
    expect(await screen.findByText("Difficulty")).toBeInTheDocument();
  });

  it("AC: eclipse attack cross-links to Attack Lab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<BlockchainSimulator />);
    });

    await user.click(screen.getByRole("tab", { name: "Network" }));
    await screen.findByText("3 · Eclipse Attack");

    const link = screen.getByRole("link", { name: /Explore more attacks/ });
    expect(link).toHaveAttribute("href", "/attacks");
  });
});
