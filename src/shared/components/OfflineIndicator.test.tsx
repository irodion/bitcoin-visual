import { describe, it, expect } from "vite-plus/test";
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
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, "onLine");

    try {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

      await act(async () => {
        render(<OfflineIndicator />);
      });

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(/You are offline/)).toBeInTheDocument();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(navigator, "onLine", originalDescriptor);
      }
    }
  });
});
