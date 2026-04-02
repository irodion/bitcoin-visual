import { describe, it, expect, beforeEach } from "vite-plus/test";
import { useThemeStore } from "./useThemeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.getState().setTheme("dark");
  });

  it("defaults to dark theme", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggles to light and back", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("sets theme explicitly", () => {
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});
