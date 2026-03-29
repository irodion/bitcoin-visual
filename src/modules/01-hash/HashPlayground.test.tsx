import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "../../shared/crypto/index.ts";
import HashPlayground from "./HashPlayground.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const defaultInput = "Hello, Bitcoin!";
const defaultHash = bytesToHex(sha256(new TextEncoder().encode(defaultInput)));

describe("HashPlayground", () => {
  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });
    const matches = screen.getAllByText("Hash Playground");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

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

    const textarea = screen.getByLabelText("Input");
    await user.clear(textarea);
    await user.type(textarea, "test");

    const newHash = bytesToHex(sha256(new TextEncoder().encode("test")));
    expect(screen.getByText(newHash)).toBeInTheDocument();
  });

  it("switches to avalanche mode", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByText("Avalanche Demo"));
    expect(screen.getByLabelText("Modified")).toBeInTheDocument();
  });

  it("shows bit difference counter in avalanche mode", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByText("Avalanche Demo"));
    expect(screen.getByText(/of 256 bits differ/)).toBeInTheDocument();
  });

  it("random input button changes hash", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    const initialHash = defaultHash;
    await user.click(screen.getByText("Random Input"));

    // The initial hash should no longer be visible (replaced by random input's hash)
    expect(screen.queryByText(initialHash)).not.toBeInTheDocument();
  });

  it("returns to normal mode from avalanche", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<HashPlayground />);
    });

    await user.click(screen.getByText("Avalanche Demo"));
    expect(screen.getByText("Back to Normal")).toBeInTheDocument();

    await user.click(screen.getByText("Back to Normal"));
    expect(screen.getByText("SHA-256 Hash")).toBeInTheDocument();
  });
});
