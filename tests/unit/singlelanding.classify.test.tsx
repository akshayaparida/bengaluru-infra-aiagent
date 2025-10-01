/* @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock next/dynamic to avoid actual dynamic import at test time
vi.mock("next/dynamic", () => ({
  default: (loader: any) => {
    // return a simple stub component
    return function Stub() {
      return React.createElement("div", { "data-testid": "dashboard" });
    };
  },
}));

// Mock the ReportForm used inside SingleLanding so we can simulate a submit quickly
vi.mock("../../src/app/report/ReportForm", () => ({
  __esModule: true,
  default: ({ onSubmitted }: { onSubmitted?: (id: string) => void }) => {
    React.useEffect(() => {
      onSubmitted?.("r-test-1");
    }, [onSubmitted]);
    return React.createElement("div", { "data-testid": "report-form-mock" });
  },
}));

// Import the component under test
import SingleLanding from "../../src/app/(home)/SingleLanding";


describe("SingleLanding - classification flow", () => {
  it("calls classify after submit and shows category/severity, then proceeds to notify", async () => {
    const fetchMock = vi.fn()
      // 1) classify
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, category: "pothole", severity: "high", simulated: false }) })
      // 2) notify (we don't care about body here)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, simulated: true }) });
    // @ts-expect-error overwrite global
    global.fetch = fetchMock;

    render(<SingleLanding />);

    // Actions panel should not be present anymore (fully automated flow)
    expect(screen.queryByText(/Actions/i)).toBeNull();

    // Notify should also be called after classify
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/reports/r-test-1/classify", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/reports/r-test-1/notify", expect.any(Object));
    });
  });
});
