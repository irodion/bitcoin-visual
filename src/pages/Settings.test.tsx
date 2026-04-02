import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useProgressStore, useThemeStore } from "../shared/stores/index.ts";
import { MODULES } from "../shared/constants/modules.ts";
import Settings from "./Settings";

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe("Settings", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
    useThemeStore.getState().setTheme("dark");
  });

  it("renders Settings heading", async () => {
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders Appearance section", async () => {
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
  });

  it("theme toggle has correct initial aria-checked", async () => {
    await act(async () => {
      renderSettings();
    });
    const toggle = screen.getByRole("switch", { name: "Toggle light mode" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("clicking theme toggle updates aria-checked", async () => {
    await act(async () => {
      renderSettings();
    });
    const toggle = screen.getByRole("switch", { name: "Toggle light mode" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("renders progress count with zero completed", async () => {
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByText(`0 of ${MODULES.length} modules completed.`)).toBeInTheDocument();
  });

  it("renders progress count after marking modules", async () => {
    useProgressStore.getState().markCompleted("hash");
    useProgressStore.getState().markCompleted("keys");
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByText(`2 of ${MODULES.length} modules completed.`)).toBeInTheDocument();
  });

  it("renders Clear Progress button", async () => {
    await act(async () => {
      renderSettings();
    });
    const btns = screen.getAllByText("Clear Progress");
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("Clear Progress button is disabled when no progress", async () => {
    await act(async () => {
      renderSettings();
    });
    const sectionBtn = screen.getAllByText("Clear Progress")[0];
    expect(sectionBtn).toBeDisabled();
  });

  it("clicking Clear Progress opens confirmation dialog", async () => {
    useProgressStore.getState().markCompleted("hash");
    await act(async () => {
      renderSettings();
    });
    const sectionBtn = screen.getAllByText("Clear Progress")[0];
    await userEvent.click(sectionBtn);
    expect(screen.getByText("Clear All Progress?")).toBeInTheDocument();
  });

  it("confirming clear resets progress store", async () => {
    useProgressStore.getState().markCompleted("hash");
    useProgressStore.getState().markCompleted("keys");
    await act(async () => {
      renderSettings();
    });
    const sectionBtn = screen.getAllByText("Clear Progress")[0];
    await userEvent.click(sectionBtn);
    // Click the confirm button inside the dialog (last one)
    const confirmBtns = screen.getAllByText("Clear Progress");
    const dialogConfirm = confirmBtns[confirmBtns.length - 1];
    await userEvent.click(dialogConfirm);
    expect(useProgressStore.getState().completedModules).toEqual([]);
  });

  it("renders Install App section", async () => {
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByRole("heading", { name: "Install App" })).toBeInTheDocument();
  });

  it("shows unavailable message when install not supported", async () => {
    await act(async () => {
      renderSettings();
    });
    expect(screen.getByText(/Installation is not available/)).toBeInTheDocument();
  });

  it("back link points to home", async () => {
    await act(async () => {
      renderSettings();
    });
    const backLink = screen.getByText("Back to Home").closest("a");
    expect(backLink).toHaveAttribute("href", "/");
  });
});
