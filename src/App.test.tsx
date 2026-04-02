import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

describe("App", () => {
  it("renders landing page", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        </MemoryRouter>,
      );
    });
    expect(screen.getByText("Bitcoin Visual")).toBeInTheDocument();
  });
});
