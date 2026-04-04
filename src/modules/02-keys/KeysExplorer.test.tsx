import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import KeysExplorer from "./KeysExplorer.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const TEST_VECTOR_PRIVKEY = "0000000000000000000000000000000000000000000000000000000000000001";
const TEST_VECTOR_PUBKEY = "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
const TEST_VECTOR_P2PKH = "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH";
const TEST_VECTOR_P2WPKH = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

describe("KeysExplorer", () => {
  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });
    expect(screen.getByText("Keys & Address Generator")).toBeInTheDocument();
  });

  it("renders theory content", async () => {
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });
    const privateKeysHeadings = screen.getAllByText("Private Keys");
    expect(privateKeysHeadings.length).toBeGreaterThanOrEqual(1);
    const secp256k1Mentions = screen.getAllByText("secp256k1");
    expect(secp256k1Mentions.length).toBeGreaterThanOrEqual(1);
  });

  it("AC1: Generate Random produces valid key and cascades all values", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));

    expect(screen.getAllByText("Private Key").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Public Key (compressed)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Public Key Hash").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("P2PKH Address").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("P2WPKH Address").length).toBeGreaterThanOrEqual(1);
  });

  it("AC2: shows error for invalid hex input", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    const input = screen.getByLabelText(/custom entropy/i);
    await user.type(input, "abcd");
    expect(screen.getByText(/exactly 64 hex characters/i)).toBeInTheDocument();
  });

  it("AC2: shows error for curve order n", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    const input = screen.getByLabelText(/custom entropy/i);
    // secp256k1 curve order n
    await user.type(input, "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    expect(screen.getByText(/zero or exceeds/i)).toBeInTheDocument();
  });

  it("AC3: shows all 6 pipeline steps with ValueFlowArrow labels", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));

    // ValueFlowArrow labels (may appear in theory panel too, so use getAllByText)
    expect(screen.getAllByText("secp256k1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("HASH160").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Base58Check").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bech32").length).toBeGreaterThanOrEqual(1);
  });

  it("AC5: algorithm names present in DOM for tooltips", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));

    expect(screen.getByText("CSPRNG")).toBeInTheDocument();
    expect(screen.getByText("secp256k1 scalar")).toBeInTheDocument();
    expect(screen.getByText("k × G")).toBeInTheDocument();
    expect(screen.getByText("SHA-256 + RIPEMD-160")).toBeInTheDocument();
  });

  it("AC6+7+8: known test vector privkey 0x01 produces correct pubkey and addresses", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    const input = screen.getByLabelText(/custom entropy/i);
    await user.type(input, TEST_VECTOR_PRIVKEY);

    expect(screen.getByText(TEST_VECTOR_PUBKEY)).toBeInTheDocument();
    expect(screen.getByText(TEST_VECTOR_P2PKH)).toBeInTheDocument();
    expect(screen.getByText(TEST_VECTOR_P2WPKH)).toBeInTheDocument();
  });

  it("AC9: SecurityCallout displayed over private key with never share warning", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent?.toLowerCase()).toContain("never share");
  });

  it("AC10: generating twice produces different values", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));
    const input = screen.getByLabelText(/custom entropy/i) as HTMLInputElement;
    const firstValue = input.value;

    await user.click(screen.getByText("Generate Random Key"));
    const secondValue = input.value;

    expect(firstValue).not.toBe(secondValue);
  });

  it("renders tab bar with Key Pipeline and Elliptic Curves tabs", async () => {
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });
    expect(screen.getByText("Key Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Elliptic Curves")).toBeInTheDocument();
  });

  it("defaults to Key Pipeline tab", async () => {
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });
    expect(screen.getByRole("tab", { name: "Key Pipeline" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to Elliptic Curves tab on click", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: "Elliptic Curves" }));

    const curvesTab = screen.getByRole("tab", { name: "Elliptic Curves" });
    expect(curvesTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("tab", { name: "Point Addition" })).toBeInTheDocument();
  });

  it("switches back to pipeline and preserves entropy", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByText("Generate Random Key"));
    const input = screen.getByLabelText(/custom entropy/i) as HTMLInputElement;
    const entropy = input.value;

    await user.click(screen.getByRole("tab", { name: "Elliptic Curves" }));
    await user.click(screen.getByRole("tab", { name: "Key Pipeline" }));

    const inputAfter = (await screen.findByLabelText(/custom entropy/i)) as HTMLInputElement;
    expect(inputAfter.value).toBe(entropy);
  });

  // ── Code Review tab ──

  it("renders Code Review tab in tab bar", async () => {
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });
    expect(screen.getByRole("tab", { name: "Code Review" })).toBeInTheDocument();
  });

  it("switches to Code Review tab and shows challenge prompt", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: "Code Review" }));

    expect(await screen.findByText("Review: P2PKH address derivation")).toBeInTheDocument();
    expect(await screen.findByText(/teammate added legacy address/)).toBeInTheDocument();
  });

  it("shows Code Review theory content when tab is active", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<KeysExplorer />);
    });

    await user.click(screen.getByRole("tab", { name: "Code Review" }));
    expect(await screen.findByText("Address Derivation Review")).toBeInTheDocument();
  });
});
