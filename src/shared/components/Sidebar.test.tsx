import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useProgressStore } from "../stores/index.ts";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Sidebar", () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
  });

  it("renders all 7 module links", async () => {
    await act(async () => {
      renderWithRouter(
        <Sidebar currentModuleKey="hash" mobileOpen={false} onMobileClose={() => {}} />,
      );
    });
    const nav = screen.getByLabelText("Module navigation");
    expect(nav).toBeInTheDocument();
    expect(screen.getByLabelText("Hash Playground")).toBeInTheDocument();
    expect(screen.getByLabelText("Keys & Addresses")).toBeInTheDocument();
    expect(screen.getByLabelText("UTXO & Transactions")).toBeInTheDocument();
    expect(screen.getByLabelText("Blockchain & Mining")).toBeInTheDocument();
    expect(screen.getByLabelText("HD Wallet Tree")).toBeInTheDocument();
    expect(screen.getByLabelText("Multisig Vault")).toBeInTheDocument();
    expect(screen.getByLabelText("Attack Lab (coming soon)")).toBeInTheDocument();
  });

  it("highlights current module", async () => {
    await act(async () => {
      renderWithRouter(
        <Sidebar currentModuleKey="keys" mobileOpen={false} onMobileClose={() => {}} />,
      );
    });
    const keysLink = screen.getByLabelText("Keys & Addresses");
    expect(keysLink).toHaveAttribute("aria-current", "page");
  });

  it("renders home link", async () => {
    await act(async () => {
      renderWithRouter(
        <Sidebar currentModuleKey="hash" mobileOpen={false} onMobileClose={() => {}} />,
      );
    });
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  it("shows completion dot for completed modules", async () => {
    useProgressStore.getState().markCompleted("hash");

    await act(async () => {
      renderWithRouter(
        <Sidebar currentModuleKey="keys" mobileOpen={false} onMobileClose={() => {}} />,
      );
    });
    const hashLink = screen.getByLabelText("Hash Playground, completed");
    expect(hashLink).toBeInTheDocument();
    const checkmark = hashLink.querySelector("[aria-hidden]");
    expect(checkmark).toBeTruthy();
  });
});
