import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EllipticCurvesTab } from "./EllipticCurvesTab.tsx";

function renderTab(entropyHex = "") {
  return render(
    <MemoryRouter>
      <EllipticCurvesTab entropyHex={entropyHex} />
    </MemoryRouter>,
  );
}

describe("EllipticCurvesTab", () => {
  it("renders without crashing", async () => {
    await act(async () => {
      renderTab();
    });
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("shows all three section pills", async () => {
    await act(async () => {
      renderTab();
    });
    expect(screen.getByText("Point Addition")).toBeInTheDocument();
    expect(screen.getByText("Scalar Multiply")).toBeInTheDocument();
    expect(screen.getByText("Scale It Up")).toBeInTheDocument();
  });

  it("defaults to Point Addition section", async () => {
    await act(async () => {
      renderTab();
    });
    const additionTab = screen.getByText("Point Addition").closest("button");
    expect(additionTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders 72 curve points in the SVG grid", async () => {
    await act(async () => {
      renderTab();
    });
    const svg = screen.getByRole("img");
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(72);
  });

  it("switches to Scalar Multiply section", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderTab();
    });

    await user.click(screen.getByText("Scalar Multiply"));

    const scalarTab = screen.getByText("Scalar Multiply").closest("button");
    expect(scalarTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByLabelText("Scalar k")).toBeInTheDocument();
  });

  it("switches to Scale It Up section", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderTab();
    });

    await user.click(screen.getByText("Scale It Up"));

    expect(await screen.findByText("Toy Curve vs. secp256k1")).toBeInTheDocument();
  });

  it("Scale It Up shows prompt when no key provided", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderTab("");
    });

    await user.click(screen.getByText("Scale It Up"));

    expect(await screen.findByText(/generate a key/i)).toBeInTheDocument();
  });

  it("Scale It Up shows real coordinates when valid key provided", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderTab("0000000000000000000000000000000000000000000000000000000000000001");
    });

    await user.click(screen.getByText("Scale It Up"));

    expect(await screen.findByText("Your Key on secp256k1")).toBeInTheDocument();
  });
});
