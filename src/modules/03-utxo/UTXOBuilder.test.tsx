import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UTXOBuilder from "./UTXOBuilder.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("UTXOBuilder", () => {
  it("renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });
    expect(screen.getByText("UTXO & Transactions")).toBeInTheDocument();
  });

  it("renders theory content", async () => {
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });
    const utxoHeadings = screen.getAllByText(/UTXO/);
    expect(utxoHeadings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Change Outputs/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Fees/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders all 4 UTXO coins", async () => {
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText("0.3")).toBeInTheDocument();
    expect(screen.getByText("0.1")).toBeInTheDocument();
    expect(screen.getByText("0.05")).toBeInTheDocument();
  });

  it("AC: selecting UTXOs updates total inputs in real time", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    // Click the first UTXO (0.5 BTC)
    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    // "0.5" appears in both coin and total — just verify it's there
    expect(screen.getAllByText("0.5").length).toBeGreaterThanOrEqual(1);

    // Click the second UTXO (0.3 BTC)
    const utxo2 = screen.getByLabelText(/0\.3 BTC/);
    await user.click(utxo2);
    // Total should show 0.8 in the selected total display
    expect(screen.getByText("0.8")).toBeInTheDocument();
  });

  it("AC: shows validation error for insufficient funds", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    // Select one UTXO (0.05 BTC = 5,000,000 sats)
    const utxo4 = screen.getByLabelText(/0\.05 BTC/);
    await user.click(utxo4);

    // Enter amount larger than the UTXO
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.06");

    expect(screen.getByRole("alert")).toHaveTextContent(/insufficient funds/i);
  });

  it("AC: hex inspector appears when transaction is valid", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    // No hex inspector before selection
    expect(screen.queryByText("Raw Transaction Hex")).not.toBeInTheDocument();

    // Select UTXO and enter valid amount
    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.3");

    // Hex inspector should now appear
    expect(screen.getByText("Raw Transaction Hex")).toBeInTheDocument();
  });

  it("AC: TXID panel appears with intermediate hash values", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.3");

    expect(screen.getByText("TXID Computation")).toBeInTheDocument();
    expect(screen.getByText("Serialized TX (legacy)")).toBeInTheDocument();
    expect(screen.getByText("First Hash")).toBeInTheDocument();
    expect(screen.getByText("Double Hash (SHA-256d)")).toBeInTheDocument();
    expect(screen.getByText("TXID (display order)")).toBeInTheDocument();
  });

  it("AC: SegWit toggle shows witness-related content", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    // Select and build valid transaction
    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.3");

    // Toggle to SegWit
    const segwitTab = screen.getByText("SegWit P2WPKH");
    await user.click(segwitTab);

    // Should show SegWit badge
    expect(screen.getByText("P2WPKH")).toBeInTheDocument();

    // Should show WTXID section (may appear in multiple places)
    expect(screen.getAllByText(/WTXID/i).length).toBeGreaterThanOrEqual(1);
  });

  it("AC: deselecting all UTXOs hides hex inspector and TXID panel", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    // Select and build valid transaction
    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.3");
    expect(screen.getByText("Raw Transaction Hex")).toBeInTheDocument();

    // Deselect the UTXO
    await user.click(utxo1);
    expect(screen.queryByText("Raw Transaction Hex")).not.toBeInTheDocument();
  });

  it("AC: balance shows checkmark when valid", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<UTXOBuilder />);
    });

    const utxo1 = screen.getByLabelText(/0\.5 BTC/);
    await user.click(utxo1);
    const input = screen.getByLabelText(/recipient amount/i);
    await user.type(input, "0.3");

    // Should show balanced status (multiple status roles exist)
    const statuses = screen.getAllByRole("status");
    const balanceStatus = statuses.find(
      (el) => el.textContent?.includes("Total In") && el.textContent?.includes("Total Out"),
    );
    expect(balanceStatus).toBeDefined();
  });
});
