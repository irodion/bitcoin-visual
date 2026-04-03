import { describe, it, expect } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OutputDescriptors from "./OutputDescriptors.tsx";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("OutputDescriptors", () => {
  it("AC1: renders module layout with title", async () => {
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });
    const matches = screen.getAllByText("Output Descriptors");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("AC2: renders theory content with concept cards", async () => {
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });
    const headings = screen.getAllByText("Output Descriptors");
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("What is a Descriptor?").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Script Functions").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Checksum").length).toBeGreaterThanOrEqual(1);
  });

  it("AC3: three tabs render and are clickable", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    expect(screen.getByRole("tab", { name: "Anatomy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Derive" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();

    // Anatomy tab active by default
    expect(screen.getByText("P2PKH (Legacy)")).toBeInTheDocument();

    // Switch to Derive — use findBy* after AnimatePresence transition
    await user.click(screen.getByRole("tab", { name: "Derive" }));
    expect(
      await screen.findByText(/Parse a descriptor in the Anatomy tab first/),
    ).toBeInTheDocument();

    // Switch to Builder
    await user.click(screen.getByRole("tab", { name: "Builder" }));
    expect(await screen.findByLabelText("Script type")).toBeInTheDocument();
  });

  it("AC4: selecting a preset fills input and shows colored segments", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByText("P2WPKH (Native SegWit)"));

    expect(await screen.findByText(/Parsed structure/)).toBeInTheDocument();

    const wpkhSegments = screen.getAllByText("wpkh");
    expect(wpkhSegments.length).toBeGreaterThanOrEqual(1);
  });

  it("AC5: clicking a segment shows explanation card", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    expect(await screen.findByText(/Parsed structure/)).toBeInTheDocument();

    const wpkhButtons = screen.getAllByRole("button", { name: /Script type function/i });
    expect(wpkhButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(wpkhButtons[0]);

    // Explanation card appears via AnimatePresence
    expect(await screen.findByText("Script Type Function")).toBeInTheDocument();
  });

  it("AC6: Derive tab shows guard when no descriptor parsed", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByRole("tab", { name: "Derive" }));
    expect(
      await screen.findByText(/Parse a descriptor in the Anatomy tab first/),
    ).toBeInTheDocument();
  });

  it("AC7: after parsing preset, Derive tab shows addresses", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    expect(await screen.findByText(/Parsed structure/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Derive" }));

    // bc1q prefix for P2WPKH — findAllBy* waits for AnimatePresence
    const addresses = await screen.findAllByText(/^bc1q/);
    expect(addresses.length).toBeGreaterThanOrEqual(1);
  });

  it("AC8: Builder tab renders script type selector and generate button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByRole("tab", { name: "Builder" }));
    expect(await screen.findByLabelText("Script type")).toBeInTheDocument();
    expect(screen.getByText("Generate from seed")).toBeInTheDocument();
  });

  it("AC9: Same Key Different Scripts comparison appears in Derive tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    expect(await screen.findByText(/Parsed structure/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Derive" }));

    expect(await screen.findByText("Same Key, Different Scripts")).toBeInTheDocument();
  });
});
