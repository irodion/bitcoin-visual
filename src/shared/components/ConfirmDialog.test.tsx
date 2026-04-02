import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: false,
    title: "Delete item?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("does not show content when closed", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).not.toHaveAttribute("open");
  });

  it("shows title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} open />);
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} open onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} open onCancel={onCancel} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders danger variant with danger-styled confirm button", () => {
    render(<ConfirmDialog {...defaultProps} open variant="danger" />);
    const confirmBtn = screen.getByText("Delete");
    expect(confirmBtn.className).toContain("bg-danger");
  });
});
