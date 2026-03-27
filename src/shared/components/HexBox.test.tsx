import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HexBox } from "./HexBox";

describe("HexBox", () => {
  it("renders a hex string value", async () => {
    await act(async () => {
      render(<HexBox value="deadbeef" />);
    });
    expect(screen.getByText("deadbeef")).toBeInTheDocument();
  });

  it("converts Uint8Array to hex string", async () => {
    await act(async () => {
      render(<HexBox value={new Uint8Array([0xca, 0xfe, 0xba, 0xbe])} />);
    });
    expect(screen.getByText("cafebabe")).toBeInTheDocument();
  });

  it("renders label when provided", async () => {
    await act(async () => {
      render(<HexBox value="aa" label="Public Key" />);
    });
    expect(screen.getByText("Public Key")).toBeInTheDocument();
  });

  it("applies variant color class", async () => {
    await act(async () => {
      render(<HexBox value="secret" variant="danger" />);
    });
    const hex = screen.getByText("secret");
    expect(hex.className).toContain("text-danger");
  });

  it("truncates long values when truncate is true", async () => {
    const longHex = "a".repeat(100);
    await act(async () => {
      render(<HexBox value={longHex} truncate maxLength={20} />);
    });
    expect(screen.getByText("more")).toBeInTheDocument();
  });

  it("expands truncated value on click", async () => {
    const user = userEvent.setup();
    const longHex = "ab".repeat(50);
    await act(async () => {
      render(<HexBox value={longHex} truncate maxLength={20} />);
    });

    await user.click(screen.getByText("more"));
    expect(screen.getByText(longHex)).toBeInTheDocument();
    expect(screen.getByText("less")).toBeInTheDocument();
  });

  it("includes CopyButton", async () => {
    await act(async () => {
      render(<HexBox value="ff" />);
    });
    expect(screen.getByLabelText("Copy to clipboard")).toBeInTheDocument();
  });
});
