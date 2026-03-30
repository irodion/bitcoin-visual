import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import { ByteSegmentTooltip } from "./ByteSegmentTooltip";

describe("ByteSegmentTooltip", () => {
  it("renders children with color class", async () => {
    await act(async () => {
      render(
        <ByteSegmentTooltip
          label="version"
          byteRange="bytes 0–3"
          description="Transaction version number"
          color="text-amber-400"
        >
          01000000
        </ByteSegmentTooltip>,
      );
    });

    // Color class is on the outer wrapper span (group/seg)
    const textSpan = screen.getByText("01000000");
    const outerSpan = textSpan.closest("span")?.parentElement;
    expect(outerSpan?.className).toContain("text-amber-400");
  });

  it("contains tooltip text in DOM", async () => {
    await act(async () => {
      render(
        <ByteSegmentTooltip
          label="locktime"
          byteRange="bytes 85–88"
          description="Block height or timestamp lock"
          color="text-gray-400"
        >
          00000000
        </ByteSegmentTooltip>,
      );
    });

    expect(screen.getByText("locktime")).toBeInTheDocument();
    expect(screen.getByText("bytes 85–88")).toBeInTheDocument();
    expect(screen.getByText("Block height or timestamp lock")).toBeInTheDocument();
  });

  it("has role=tooltip and aria-describedby", async () => {
    await act(async () => {
      render(
        <ByteSegmentTooltip
          label="version"
          byteRange="bytes 0–3"
          description="Transaction version"
          color="text-amber-400"
        >
          01000000
        </ByteSegmentTooltip>,
      );
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();

    const trigger = screen.getByText("01000000").closest("[aria-describedby]");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });
});
