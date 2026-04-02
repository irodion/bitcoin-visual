import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useProgressStore } from "../stores/index.ts";
import { StoryRibbon } from "./StoryRibbon";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("StoryRibbon", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
  });

  it("renders story progress nav for core modules", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="utxo" />);
    });
    expect(screen.getByRole("navigation", { name: "Story progress" })).toBeInTheDocument();
  });

  it("shows current chapter role", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="keys" />);
    });
    expect(screen.getByText("Chapter 2 of 6")).toBeInTheDocument();
  });

  it("shows previous module link", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="keys" />);
    });
    const prevLink = screen.getByText("← Hash");
    expect(prevLink.closest("a")).toHaveAttribute("href", "/hash");
  });

  it("shows next module link", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="keys" />);
    });
    const nextLink = screen.getByText("UTXO →");
    expect(nextLink.closest("a")).toHaveAttribute("href", "/utxo");
  });

  it("shows Start instead of prev link for first module", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="hash" />);
    });
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("shows Side Lab for attack lab", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="attacks" />);
    });
    expect(screen.getByText("Side Lab")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Story progress" })).not.toBeInTheDocument();
  });

  it("renders nothing for unknown module key", async () => {
    const { container } = await act(async () =>
      renderWithRouter(<StoryRibbon currentModuleKey="nonexistent" />),
    );
    expect(container.innerHTML).toBe("");
  });
});
