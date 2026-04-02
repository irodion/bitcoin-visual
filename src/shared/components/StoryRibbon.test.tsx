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

  it("renders progress nav for core modules", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="utxo" />);
    });
    expect(screen.getByRole("navigation", { name: "Story progress" })).toBeInTheDocument();
  });

  it("renders 6 chapter node links for a core module", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="hash" />);
    });
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(6);
  });

  it("marks current module with aria-current step", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="keys" />);
    });
    const current = screen.getByLabelText("Keys & Addresses (current)");
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("shows completed checkmarks", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="keys" />);
    });
    expect(screen.getByLabelText("Hash Playground, completed")).toBeInTheDocument();
  });

  it("shows Side Lab badge for attack lab", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="attacks" />);
    });
    expect(screen.getByText("Side Lab")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Story progress" })).not.toBeInTheDocument();
  });

  it("shows transition copy for current module on desktop", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="utxo" />);
    });
    expect(
      screen.getByText(
        "Learn how Bitcoin represents coins as spendable outputs and builds transactions.",
      ),
    ).toBeInTheDocument();
  });

  it("renders mobile chapter role text", async () => {
    await act(async () => {
      renderWithRouter(<StoryRibbon currentModuleKey="blockchain" />);
    });
    const matches = screen.getAllByText("Chapter 4 of 6");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
