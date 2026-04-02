import "@testing-library/jest-dom";
import { vi } from "vite-plus/test";

// jsdom does not implement matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom does not implement HTMLDialogElement methods
HTMLDialogElement.prototype.showModal ??= vi.fn() as typeof HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.close ??= vi.fn() as typeof HTMLDialogElement.prototype.close;

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));
