/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// We import after setting NODE_ENV so the component picks it up
import ServiceWorkerClient from "../../src/components/ServiceWorkerClient";

function setupNavigatorMocks() {
  const unregister = vi.fn(() => Promise.resolve(true));
  const getRegistrations = vi.fn(() => Promise.resolve([{ unregister }]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.navigator as any).serviceWorker = { getRegistrations };
  return { getRegistrations, unregister };
}

describe("ServiceWorkerClient", () => {
  beforeEach(() => {
    (global as any).navigator = { serviceWorker: {} };
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unregisters service worker in development", async () => {
    // Simulate dev by defining property
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    });
    const { getRegistrations, unregister } = setupNavigatorMocks();

    render(<ServiceWorkerClient />);

    // let useEffect run in microtask
    await Promise.resolve();

    expect(getRegistrations).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
  });
});
