import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConceptChain } from "./ConceptChain";
import { useProgressStore } from "../stores/index.ts";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ConceptChain", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
  });

  it("renders 6 learning path nodes", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    // Each node renders the first word of its title twice (desktop + mobile)
    const hashNodes = screen.getAllByText("Hash");
    expect(hashNodes.length).toBeGreaterThanOrEqual(1);

    const keysNodes = screen.getAllByText("Keys");
    expect(keysNodes.length).toBeGreaterThanOrEqual(1);

    const utxoNodes = screen.getAllByText("UTXO");
    expect(utxoNodes.length).toBeGreaterThanOrEqual(1);

    const blockchainNodes = screen.getAllByText("Blockchain");
    expect(blockchainNodes.length).toBeGreaterThanOrEqual(1);

    const hdNodes = screen.getAllByText("HD");
    expect(hdNodes.length).toBeGreaterThanOrEqual(1);

    const multisigNodes = screen.getAllByText("Multisig");
    expect(multisigNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("excludes Attack Lab from concept chain", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    expect(screen.queryByText("Attack")).toBeNull();
  });

  it("renders clickable links to module routes", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/hash");
    expect(hrefs).toContain("/keys");
    expect(hrefs).toContain("/utxo");
    expect(hrefs).toContain("/blockchain");
    expect(hrefs).toContain("/hd-wallet");
    expect(hrefs).toContain("/multisig");
  });
});
