import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TheoryPanel } from "./TheoryPanel";

beforeEach(() => {
  localStorage.clear();
});

describe("TheoryPanel", () => {
  it("renders children content when open", async () => {
    await act(async () => {
      render(
        <TheoryPanel moduleKey="test">
          <p>Theory explanation</p>
        </TheoryPanel>,
      );
    });
    expect(screen.getByText("Theory explanation")).toBeInTheDocument();
  });

  it("defaults to open state", async () => {
    await act(async () => {
      render(
        <TheoryPanel moduleKey="test">
          <p>Content</p>
        </TheoryPanel>,
      );
    });
    expect(screen.getByLabelText("Collapse theory panel")).toBeInTheDocument();
  });

  it("toggles open/closed on button click", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <TheoryPanel moduleKey="test">
          <p>Content</p>
        </TheoryPanel>,
      );
    });

    await user.click(screen.getByLabelText("Collapse theory panel"));
    expect(screen.getByLabelText("Expand theory panel")).toBeInTheDocument();
  });

  it("persists state to localStorage", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <TheoryPanel moduleKey="hash">
          <p>Content</p>
        </TheoryPanel>,
      );
    });

    await user.click(screen.getByLabelText("Collapse theory panel"));
    expect(localStorage.getItem("theory-panel-hash")).toBe("false");
  });

  it("reads persisted state from localStorage", async () => {
    localStorage.setItem("theory-panel-keys", "false");
    await act(async () => {
      render(
        <TheoryPanel moduleKey="keys">
          <p>Content</p>
        </TheoryPanel>,
      );
    });
    expect(screen.getByLabelText("Expand theory panel")).toBeInTheDocument();
  });
});
