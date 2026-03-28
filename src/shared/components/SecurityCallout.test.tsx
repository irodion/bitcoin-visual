import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SecurityCallout } from "./SecurityCallout";

describe("SecurityCallout", () => {
  it("renders children content", async () => {
    await act(async () => {
      render(<SecurityCallout>Never share your private key</SecurityCallout>);
    });
    expect(screen.getByText("Never share your private key")).toBeInTheDocument();
  });

  it("has role alert for accessibility", async () => {
    await act(async () => {
      render(<SecurityCallout>Warning text</SecurityCallout>);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies danger styling by default", async () => {
    await act(async () => {
      render(<SecurityCallout>Danger content</SecurityCallout>);
    });
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("border-danger");
  });

  it("applies warning styling with variant", async () => {
    await act(async () => {
      render(<SecurityCallout variant="warning">Warning content</SecurityCallout>);
    });
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("border-warning-border");
  });
});
