import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ModuleLayout } from "./ModuleLayout";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ModuleLayout", () => {
  it("renders module title in header", async () => {
    await act(async () => {
      renderWithRouter(
        <ModuleLayout moduleKey="hash" title="Hash Playground" theoryContent={<p>Theory</p>}>
          <p>Main content</p>
        </ModuleLayout>,
      );
    });
    const matches = screen.getAllByText("Hash Playground");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders back-to-home link", async () => {
    await act(async () => {
      renderWithRouter(
        <ModuleLayout moduleKey="keys" title="Keys" theoryContent={<p>Theory</p>}>
          <p>Content</p>
        </ModuleLayout>,
      );
    });
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders theory content", async () => {
    await act(async () => {
      renderWithRouter(
        <ModuleLayout moduleKey="utxo" title="UTXO" theoryContent={<p>UTXO theory here</p>}>
          <p>Builder</p>
        </ModuleLayout>,
      );
    });
    expect(screen.getByText("UTXO theory here")).toBeInTheDocument();
  });

  it("renders children in main area", async () => {
    await act(async () => {
      renderWithRouter(
        <ModuleLayout moduleKey="test" title="Test" theoryContent={<p>Theory</p>}>
          <p>Sandbox content</p>
        </ModuleLayout>,
      );
    });
    expect(screen.getByText("Sandbox content")).toBeInTheDocument();
  });
});
