import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { ValueFlowArrow } from "./ValueFlowArrow";

describe("ValueFlowArrow", () => {
  it("renders label text", async () => {
    await act(async () => {
      render(<ValueFlowArrow label="SHA-256" />);
    });
    expect(screen.getByText("SHA-256")).toBeInTheDocument();
  });

  it("renders in vertical mode by default", async () => {
    await act(async () => {
      render(<ValueFlowArrow label="RIPEMD-160" />);
    });
    const label = screen.getByText("RIPEMD-160");
    const container = label.closest("div[class*='flex']");
    expect(container?.className).toContain("flex-col");
  });

  it("renders in horizontal mode", async () => {
    await act(async () => {
      render(<ValueFlowArrow label="Base58Check" direction="horizontal" />);
    });
    const label = screen.getByText("Base58Check");
    const container = label.closest("div[class*='flex']");
    expect(container?.className).toContain("flex-row");
  });

  it("contains description text when provided", async () => {
    await act(async () => {
      render(
        <ValueFlowArrow label="secp256k1" description="Elliptic curve point multiplication" />,
      );
    });
    expect(screen.getByText("Elliptic curve point multiplication")).toBeInTheDocument();
  });

  it("has role=tooltip with aria-describedby", async () => {
    await act(async () => {
      render(<ValueFlowArrow label="HASH160" description="SHA-256 then RIPEMD-160" />);
    });
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("SHA-256 then RIPEMD-160");
  });
});
