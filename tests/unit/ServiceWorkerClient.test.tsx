/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// We import after setting NODE_ENV so the component picks it up
import ServiceWorkerClient from "../../src/components/ServiceWorkerClient";

function setupNavigatorMocks() {
  const unregister = vi.fn(() => Promise.resolve(true));
  const getRegistrations = vi.fn(() => Promise.resolve([{ unregister }]));
  // @ts-expect-error - partial mock
  global.navigator.serviceWorker = { getRegistrations } as any;
  return { getRegistrations, unregister };
}

describe("ServiceWorkerClient", () => {
  beforeEach(() => {
    global.navigator = { serviceWorker: {} } as any;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unregisters service worker in development", async () => {
    // Simulate dev
    vi.stubEnv('NODE_ENV', 'development');
    const { getRegistrations, unregister } = setupNavigatorMocks();

    render(<ServiceWorkerClient />);

    // let useEffect run in microtask
    await Promise.resolve();

    expect(getRegistrations).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
  });
});
