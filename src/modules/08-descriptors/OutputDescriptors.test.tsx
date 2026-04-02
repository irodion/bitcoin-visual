import { describe, it, expect } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
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
    // Key theory concepts should be present
    expect(screen.getAllByText("What is a Descriptor?").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Script Functions").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Checksum").length).toBeGreaterThanOrEqual(1);
  });

  it("AC3: three tabs render and are clickable", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    // All three tabs should be present
    expect(screen.getByRole("tab", { name: "Anatomy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Derive" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();

    // Anatomy tab active by default — preset buttons should be visible
    expect(screen.getByText("P2PKH (Legacy)")).toBeInTheDocument();

    // Switch to Derive
    await user.click(screen.getByRole("tab", { name: "Derive" }));
    await waitFor(() => {
      expect(screen.getByText(/Parse a descriptor in the Anatomy tab first/)).toBeInTheDocument();
    });

    // Switch to Builder
    await user.click(screen.getByRole("tab", { name: "Builder" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Script type")).toBeInTheDocument();
    });
  });

  it("AC4: selecting a preset fills input and shows colored segments", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    // Click a preset
    await user.click(screen.getByText("P2WPKH (Native SegWit)"));

    // Parsed structure label should appear
    await waitFor(() => {
      expect(screen.getByText(/Parsed structure/)).toBeInTheDocument();
    });

    // Should contain clickable segments with the function name
    const wpkhSegments = screen.getAllByText("wpkh");
    expect(wpkhSegments.length).toBeGreaterThanOrEqual(1);
  });

  it("AC5: clicking a segment shows explanation card", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    // Select preset to get segments
    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    await waitFor(() => {
      expect(screen.getByText(/Parsed structure/)).toBeInTheDocument();
    });

    // Click the function segment (wpkh)
    const wpkhButtons = screen.getAllByRole("button", { name: /Script type function/i });
    expect(wpkhButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(wpkhButtons[0]);

    // Explanation card should appear (uses AnimatePresence)
    const explanation = await screen.findByText("Script Type Function");
    expect(explanation).toBeInTheDocument();
  });

  it("AC6: Derive tab shows guard when no descriptor parsed", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByRole("tab", { name: "Derive" }));
    await waitFor(() => {
      expect(screen.getByText(/Parse a descriptor in the Anatomy tab first/)).toBeInTheDocument();
    });
  });

  it("AC7: after parsing preset, Derive tab shows addresses", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    // Parse a wpkh preset
    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    await waitFor(() => {
      expect(screen.getByText(/Parsed structure/)).toBeInTheDocument();
    });

    // Switch to Derive tab
    await user.click(screen.getByRole("tab", { name: "Derive" }));

    // Wait for addresses to render — bc1q prefix for P2WPKH
    await waitFor(() => {
      const addresses = screen.getAllByText(/^bc1q/);
      expect(addresses.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("AC8: Builder tab renders script type selector and generate button", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    await user.click(screen.getByRole("tab", { name: "Builder" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Script type")).toBeInTheDocument();
      expect(screen.getByText("Generate from seed")).toBeInTheDocument();
    });
  });

  it("AC9: Same Key Different Scripts comparison appears in Derive tab", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<OutputDescriptors />);
    });

    // Parse a single-key preset
    await user.click(screen.getByText("P2WPKH (Native SegWit)"));
    await waitFor(() => {
      expect(screen.getByText(/Parsed structure/)).toBeInTheDocument();
    });

    // Switch to Derive
    await user.click(screen.getByRole("tab", { name: "Derive" }));

    // The comparison section should appear
    await waitFor(() => {
      expect(screen.getByText("Same Key, Different Scripts")).toBeInTheDocument();
    });
  });
});
