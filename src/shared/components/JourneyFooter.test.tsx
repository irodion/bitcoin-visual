import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useProgressStore } from "../stores/index.ts";
import { getModuleByKey, getNextModule, getPreviousModule } from "../constants/storyHelpers.ts";
import { JourneyFooter } from "./JourneyFooter";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function renderFooter(moduleKey: string) {
  const mod = getModuleByKey(moduleKey)!;
  return renderWithRouter(
    <JourneyFooter
      mod={mod}
      nextModule={getNextModule(moduleKey)}
      prevModule={getPreviousModule(moduleKey)}
    />,
  );
}

describe("JourneyFooter", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
  });

  it("renders next module link for core modules", async () => {
    await act(async () => {
      renderFooter("hash");
    });
    const link = screen.getByText(/Keys & Addresses/);
    expect(link.closest("a")).toHaveAttribute("href", "/keys");
  });

  it("renders Back to Story Map link", async () => {
    await act(async () => {
      renderFooter("hash");
    });
    const link = screen.getByText("Back to Story Map");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("shows Chapter complete and recap when module is completed", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderFooter("hash");
    });
    expect(screen.getByText("Chapter complete")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You learned that SHA-256 creates a unique 256-bit fingerprint for any input.",
      ),
    ).toBeInTheDocument();
  });

  it("shows Continue text when completed", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderFooter("hash");
    });
    expect(screen.getByText(/Continue to Keys & Addresses/)).toBeInTheDocument();
  });

  it("shows Peek text when not completed", async () => {
    await act(async () => {
      renderFooter("hash");
    });
    expect(screen.getByText(/Peek at Keys & Addresses/)).toBeInTheDocument();
  });

  it("shows Return to Bitcoin Story for attacks lab", async () => {
    await act(async () => {
      renderFooter("attacks");
    });
    expect(screen.getByText("Return to the Bitcoin Story")).toBeInTheDocument();
    expect(screen.queryByText("Back to Story Map")).not.toBeInTheDocument();
  });

  it("shows Continue to Security Lab for last core module", async () => {
    await act(async () => {
      renderFooter("descriptors");
    });
    expect(screen.getByText(/Continue to Security Lab/)).toBeInTheDocument();
  });

  it("shows previous module link when it exists", async () => {
    await act(async () => {
      renderFooter("keys");
    });
    const link = screen.getByText(/Hash Playground/);
    expect(link.closest("a")).toHaveAttribute("href", "/hash");
  });
});
