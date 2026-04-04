import { describe, it, expect } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import WhyBitcoinExists from "./WhyBitcoinExists.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("WhyBitcoinExists", () => {
  // ── Tab structure ──

  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });
    const matches = screen.getAllByText("Why Bitcoin Exists");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all four tabs", async () => {
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });
    expect(screen.getByRole("tab", { name: "Central Ledger" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Double Spend" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "The Network" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Lockers" })).toBeInTheDocument();
  });

  it("defaults to Central Ledger tab", async () => {
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });
    expect(screen.getByRole("tab", { name: "Central Ledger" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ── Central Ledger tab ──

  it("renders theory content for Central Ledger", async () => {
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });
    expect(screen.getByText("Why Bitcoin?")).toBeInTheDocument();
  });

  it("shows centralized view by default with Bank actor", async () => {
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });
    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("Controls the ledger")).toBeInTheDocument();
  });

  it("toggles to Bitcoin Network view", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("radio", { name: "Bitcoin Network" }));
    expect(await screen.findByText(/Everyone verifies/)).toBeInTheDocument();
  });

  // ── Double Spend tab ──

  it("switches to Double Spend tab and shows first phase", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("tab", { name: "Double Spend" }));
    expect(await screen.findByText("Alice has 1 BTC")).toBeInTheDocument();
  });

  it("advances through double-spend phases", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("tab", { name: "Double Spend" }));
    expect(await screen.findByText("Alice has 1 BTC")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    expect(await screen.findByText("Alice tries to spend it twice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next Step" }));
    expect(await screen.findByText("The network resolves the conflict")).toBeInTheDocument();

    // Final phase shows Reset instead of Next Step
    expect(screen.queryByRole("button", { name: "Next Step" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  // ── Network tab ──

  it("switches to Network tab and shows pipeline", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("tab", { name: "The Network" }));
    expect(await screen.findByText("Wallet")).toBeInTheDocument();
    expect(await screen.findByText("Broadcast")).toBeInTheDocument();
    expect(await screen.findByText("Mining")).toBeInTheDocument();
  });

  // ── Lockers tab ──

  it("switches to Lockers tab and shows initial lockers", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("tab", { name: "Lockers" }));
    expect(await screen.findByText("0.50 BTC")).toBeInTheDocument();
    expect(await screen.findByText("0.30 BTC")).toBeInTheDocument();
    expect(await screen.findByText("0.20 BTC")).toBeInTheDocument();
  });

  it("unlocking a locker creates new lockers", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    await user.click(screen.getByRole("tab", { name: "Lockers" }));
    const locker = await screen.findByRole("button", { name: /Unlock 0.50 BTC/ });
    await user.click(locker);

    // Original is spent, new lockers appear (0.35 recipient + 0.15 change)
    expect(await screen.findByText("0.35 BTC")).toBeInTheDocument();
    expect(await screen.findByText("0.15 BTC")).toBeInTheDocument();
  });

  // ── Theory switching ──

  it("switches theory content when changing tabs", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<WhyBitcoinExists />);
    });

    // Central Ledger theory
    expect(screen.getByText("Why Bitcoin?")).toBeInTheDocument();

    // Switch to Network tab — theory changes
    await user.click(screen.getByRole("tab", { name: "The Network" }));
    await waitFor(() => expect(screen.queryByText("Why Bitcoin?")).not.toBeInTheDocument());
    expect(await screen.findByText("The Bitcoin Network")).toBeInTheDocument();
  });
});
