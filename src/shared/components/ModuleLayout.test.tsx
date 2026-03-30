import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders tabs with correct ARIA roles", async () => {
    let activeTab = "a";
    await act(async () => {
      renderWithRouter(
        <ModuleLayout
          moduleKey="test"
          title="Test"
          theoryContent={<p>Theory</p>}
          tabConfig={{
            tabs: [
              { key: "a", label: "Tab A" },
              { key: "b", label: "Tab B" },
            ],
            activeTab,
            onTabChange: (key) => {
              activeTab = key;
            },
          }}
        >
          <p>Content</p>
        </ModuleLayout>,
      );
    });

    expect(screen.getByRole("tablist")).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("id", "tab-a");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", "tab-a");
  });

  it("navigates tabs with arrow keys", async () => {
    const onTabChange = vi.fn();
    await act(async () => {
      renderWithRouter(
        <ModuleLayout
          moduleKey="test"
          title="Test"
          theoryContent={<p>Theory</p>}
          tabConfig={{
            tabs: [
              { key: "a", label: "Tab A" },
              { key: "b", label: "Tab B" },
            ],
            activeTab: "a",
            onTabChange,
          }}
        >
          <p>Content</p>
        </ModuleLayout>,
      );
    });

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTabChange).toHaveBeenCalledWith("b");
  });

  it("navigates tabs backwards with ArrowLeft", async () => {
    const onTabChange = vi.fn();
    await act(async () => {
      renderWithRouter(
        <ModuleLayout
          moduleKey="test"
          title="Test"
          theoryContent={<p>Theory</p>}
          tabConfig={{
            tabs: [
              { key: "a", label: "Tab A" },
              { key: "b", label: "Tab B" },
            ],
            activeTab: "b",
            onTabChange,
          }}
        >
          <p>Content</p>
        </ModuleLayout>,
      );
    });

    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onTabChange).toHaveBeenCalledWith("a");
  });

  it("wraps around with ArrowRight on last tab", async () => {
    const onTabChange = vi.fn();
    await act(async () => {
      renderWithRouter(
        <ModuleLayout
          moduleKey="test"
          title="Test"
          theoryContent={<p>Theory</p>}
          tabConfig={{
            tabs: [
              { key: "a", label: "Tab A" },
              { key: "b", label: "Tab B" },
            ],
            activeTab: "b",
            onTabChange,
          }}
        >
          <p>Content</p>
        </ModuleLayout>,
      );
    });

    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTabChange).toHaveBeenCalledWith("a");
  });

  it("wraps around with ArrowLeft on first tab", async () => {
    const onTabChange = vi.fn();
    await act(async () => {
      renderWithRouter(
        <ModuleLayout
          moduleKey="test"
          title="Test"
          theoryContent={<p>Theory</p>}
          tabConfig={{
            tabs: [
              { key: "a", label: "Tab A" },
              { key: "b", label: "Tab B" },
            ],
            activeTab: "a",
            onTabChange,
          }}
        >
          <p>Content</p>
        </ModuleLayout>,
      );
    });

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onTabChange).toHaveBeenCalledWith("b");
  });
});
