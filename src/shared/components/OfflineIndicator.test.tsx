import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineIndicator } from "./OfflineIndicator";

describe("OfflineIndicator", () => {
  it("does not render when online", async () => {
    await act(async () => {
      render(<OfflineIndicator />);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders offline message when navigator.onLine is false", async () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    await act(async () => {
      render(<OfflineIndicator />);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();

    Object.defineProperty(navigator, "onLine", { value: original, configurable: true });
  });
});
