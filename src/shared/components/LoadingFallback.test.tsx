import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { LoadingFallback } from "./LoadingFallback";

describe("LoadingFallback", () => {
  it("renders loading text", async () => {
    await act(async () => {
      render(<LoadingFallback />);
    });
    expect(screen.getByText("Loading module...")).toBeInTheDocument();
  });
});
