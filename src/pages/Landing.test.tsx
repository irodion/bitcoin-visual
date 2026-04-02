import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useProgressStore } from "../shared/stores/index.ts";
import Landing from "./Landing";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Landing", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
  });

  it("renders hero CTA with story text", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("Start the Bitcoin Story")).toBeInTheDocument();
  });

  it("renders story subtitle", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("7 guided chapters + 1 security lab")).toBeInTheDocument();
  });

  it("renders The Bitcoin Story section heading", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("The Bitcoin Story")).toBeInTheDocument();
  });

  it("renders Security Lab section heading", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("Security Lab")).toBeInTheDocument();
  });

  it("shows Recommended badge for the first core module", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
  });

  it("shows Completed badge after marking hash complete", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });

  it("shows Side Lab badge for Attack Lab", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("SIDE LAB")).toBeInTheDocument();
  });

  it("renders story-aware CTA text on cards", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("Start with fingerprints")).toBeInTheDocument();
    expect(screen.getByText("Turn entropy into keys")).toBeInTheDocument();
    expect(screen.getByText("Explore failure modes")).toBeInTheDocument();
  });

  it("renders chapter badges for core modules", async () => {
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 7")).toBeInTheDocument();
  });

  it("shows Resume Your Story after progress", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    const ctaLink = screen.getByText("Resume Your Story").closest("a");
    expect(ctaLink).toHaveAttribute("href", "/keys");
  });

  it("shows progress count after completing modules", async () => {
    useProgressStore.getState().markCompleted("hash");
    useProgressStore.getState().markCompleted("keys");
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    expect(screen.getByText("2 of 7 chapters completed")).toBeInTheDocument();
  });

  it("shows Explore the Security Lab when all core complete", async () => {
    for (const key of [
      "hash",
      "keys",
      "utxo",
      "blockchain",
      "hd-wallet",
      "multisig",
      "descriptors",
    ]) {
      useProgressStore.getState().markCompleted(key);
    }
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    const ctaLink = screen.getByText("Explore the Security Lab").closest("a");
    expect(ctaLink).toHaveAttribute("href", "/attacks");
  });

  it("shows Review the Story when everything is complete", async () => {
    for (const key of [
      "hash",
      "keys",
      "utxo",
      "blockchain",
      "hd-wallet",
      "multisig",
      "descriptors",
      "attacks",
    ]) {
      useProgressStore.getState().markCompleted(key);
    }
    await act(async () => {
      renderWithRouter(<Landing />);
    });
    const ctaLink = screen.getByText("Review the Story").closest("a");
    expect(ctaLink).toHaveAttribute("href", "/hash");
  });
});
