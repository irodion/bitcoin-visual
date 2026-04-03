import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "../../shared/crypto/index.ts";
import HashPlayground from "./HashPlayground.tsx";

// Mock Web Worker for Mining tab
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

const defaultInput = "Hello, Bitcoin!";
const defaultHash = bytesToHex(sha256(new TextEncoder().encode(defaultInput)));

describe("HashPlayground", () => {
  // ── Tab structure ──

  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    const matches = screen.getAllByText("Hash Playground");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all five tabs", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    expect(screen.getByRole("tab", { name: "Playground" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Avalanche" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mining Puzzle" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Deep Dive" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code Review" })).toBeInTheDocument();
  });

  it("defaults to Playground tab", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    expect(screen.getByRole("tab", { name: "Playground" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ── Playground tab ──

  it("renders theory content", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    expect(screen.getByText("What is SHA-256?")).toBeInTheDocument();
  });

  it("displays initial hash value", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    expect(screen.getByText(defaultHash)).toBeInTheDocument();
  });

  it("updates hash when input changes", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    const textarea = screen.getByLabelText("Message");
    await user.clear(textarea);
    await user.type(textarea, "test");

    const newHash = bytesToHex(sha256(new TextEncoder().encode("test")));
    expect(screen.getByText(newHash)).toBeInTheDocument();
  });

  it("loads Genesis Block preset input", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    await user.click(screen.getByRole("button", { name: /Genesis Block/ }));
    expect(screen.getByDisplayValue(/The Times 03/)).toBeInTheDocument();
  });

  it("loads Empty String preset and shows famous hash constant", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    await user.click(screen.getByRole("button", { name: /Empty String/ }));
    expect(screen.getByText(/e3b0c44298fc/)).toBeInTheDocument();
  });

  it("random input button changes hash", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    const initialHash = defaultHash;
    await user.click(screen.getByRole("button", { name: /Random Hex/ }));
    expect(screen.queryByText(initialHash)).not.toBeInTheDocument();
  });

  it("shows RIPEMD-160 and HASH160 in algorithm comparison", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    const ripemdMatches = screen.getAllByText(/RIPEMD-160/);
    expect(ripemdMatches.length).toBeGreaterThanOrEqual(1);
    const hashMatches = screen.getAllByText(/HASH160/);
    expect(hashMatches.length).toBeGreaterThanOrEqual(1);
  });

  // ── Avalanche tab ──

  it("switches to Avalanche tab and shows modified input", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Avalanche" }));
    expect(await screen.findByLabelText(/Modified/)).toBeInTheDocument();
  });

  it("shows bit difference counter in Avalanche tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Avalanche" }));
    expect(await screen.findByText("BITS CHANGED")).toBeInTheDocument();
  });

  it("shows bit grid in Avalanche tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Avalanche" }));
    expect(await screen.findByText(/Bit Map/)).toBeInTheDocument();
  });

  it("switches back from Avalanche to Playground and avalanche content is gone", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Avalanche" }));
    expect(await screen.findByLabelText(/Modified/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Playground" }));
    await waitFor(() => expect(screen.queryByLabelText(/Modified/)).not.toBeInTheDocument());
    expect(await screen.findByText("SHA-256 Hash")).toBeInTheDocument();
  });

  // ── Mining Puzzle tab ──

  it("shows Mine button in Mining Puzzle tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Mining Puzzle" }));
    expect(await screen.findByRole("button", { name: /Mine/ })).toBeInTheDocument();
  });

  it("shows Benchmark button in Mining Puzzle tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Mining Puzzle" }));
    expect(await screen.findByRole("button", { name: /Benchmark/ })).toBeInTheDocument();
  });

  // ── Deep Dive tab ──

  it("shows Nothing Up My Sleeve section in Deep Dive tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Deep Dive" }));
    expect(await screen.findByText(/Nothing Up My Sleeve/)).toBeInTheDocument();
  });

  it("shows Birthday Paradox section in Deep Dive tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Deep Dive" }));
    expect(await screen.findByText(/Birthday Paradox/)).toBeInTheDocument();
  });

  // ── Code Review tab ──

  it("switches to Code Review tab and shows challenge prompt", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Code Review" }));
    expect(await screen.findByText("Review: txid helper")).toBeInTheDocument();
    expect(await screen.findByText(/teammate wrote a helper/)).toBeInTheDocument();
  });

  it("shows Code Review theory content when tab is active", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByRole("tab", { name: "Code Review" }));
    expect(await screen.findByText("Why Code Review Matters")).toBeInTheDocument();
  });

  // ── Theory switching ──

  it("switches theory content when changing tabs", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    // Playground theory
    expect(screen.getByText("What is SHA-256?")).toBeInTheDocument();

    // Switch to Mining tab — theory changes
    await user.click(screen.getByRole("tab", { name: "Mining Puzzle" }));
    await waitFor(() => expect(screen.queryByText("What is SHA-256?")).not.toBeInTheDocument());
    expect(await screen.findByText("Proof of Work")).toBeInTheDocument();
  });
});
