import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function ThrowingChild(): React.JSX.Element {
  throw new Error("Test error");
}

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders children when no error", async () => {
    await act(async () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>,
      );
    });
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback when child throws", async () => {
    await act(async () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
    });

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});
