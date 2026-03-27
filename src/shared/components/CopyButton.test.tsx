import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("renders with accessible label", async () => {
    await act(async () => {
      render(<CopyButton text="deadbeef" />);
    });
    expect(screen.getByLabelText("Copy to clipboard")).toBeInTheDocument();
  });

  it("renders clipboard icon initially", async () => {
    await act(async () => {
      render(<CopyButton text="aa" />);
    });
    const button = screen.getByLabelText("Copy to clipboard");
    expect(button.querySelector("rect")).not.toBeNull();
  });

  it("is clickable without errors", async () => {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    }

    const user = userEvent.setup();
    await act(async () => {
      render(<CopyButton text="test" />);
    });

    const button = screen.getByLabelText("Copy to clipboard");
    await user.click(button);
    // Button remains in the document after click (AnimatePresence handles icon swap)
    expect(button).toBeInTheDocument();
  });
});
