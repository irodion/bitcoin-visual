import { describe, it, expect, beforeEach } from "vite-plus/test";
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

  it("renders 6 learning path nodes with labels", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    // Desktop uses full titles, mobile uses short labels — both render
    const hashNodes = screen.getAllByText("Hash");
    expect(hashNodes.length).toBeGreaterThanOrEqual(1);

    const keysNodes = screen.getAllByText("Keys");
    expect(keysNodes.length).toBeGreaterThanOrEqual(1);

    const utxoNodes = screen.getAllByText("UTXO");
    expect(utxoNodes.length).toBeGreaterThanOrEqual(1);

    // Desktop renders full titles
    const fullTitles = screen.getAllByText("Hash Playground");
    expect(fullTitles.length).toBeGreaterThanOrEqual(1);
  });

  it("excludes Attack Lab from concept chain", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    expect(screen.queryByText("Attack Lab")).toBeNull();
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

  it("renders mobile arrows between columns", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    const arrows = screen.getAllByText("→");
    // 7 items in grid-cols-4: row 1 has 3 arrows, row 2 has 2 arrows = 5 total
    expect(arrows.length).toBe(5);
  });

  it("highlights recommended module with accent ring", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    // First uncompleted module (hash) should be recommended — renders in desktop + mobile
    const hashLinks = screen.getAllByLabelText("Hash Playground, recommended");
    const hasRing = hashLinks.some((link) => link.querySelector(".ring-2") !== null);
    expect(hasRing).toBe(true);
  });

  it("dims future non-recommended modules", async () => {
    await act(async () => {
      renderWithRouter(<ConceptChain />);
    });
    // Keys is not recommended (hash is), so its links should have opacity-50
    const keysLinks = screen.getAllByLabelText("Keys & Addresses");
    const allDimmed = keysLinks.every((link) => link.className.includes("opacity-50"));
    expect(allDimmed).toBe(true);
  });
});
