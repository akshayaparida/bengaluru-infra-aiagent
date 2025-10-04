/* @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Render Dashboard and mock fetch for reports and budgets
import DashboardView from "../../src/app/dashboard/DashboardView";

function mockFetchOnce(value: any) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => value });
}

describe("DashboardView statuses", () => {
  it("shows emailed and tweeted badges and a tweet link when fields present", async () => {
    const reports = {
      items: [
        {
          id: "r1",
          createdAt: new Date().toISOString(),
          description: "Pothole near park",
          lat: 12.9,
          lng: 77.6,
          status: "NOTIFIED",
          category: "pothole",
          severity: "high",
          emailedAt: new Date().toISOString(),
          emailMessageId: "m1",
          tweetedAt: new Date().toISOString(),
          tweetId: "1234567890",
        },
      ],
    };
    const budgets = { items: [] };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => reports })
      .mockResolvedValueOnce({ ok: true, json: async () => budgets });
    global.fetch = fetchMock as any;

    render(<DashboardView />);

    await screen.findByText(/Recent reports/i);
    await screen.findByText(/pothole \/ high/i);
    await screen.findByText(/Emailed ✓/i);
    await screen.findByText(/Tweeted ✓/i);

    // Has view tweet link
    const link = await screen.findByRole('link');
    expect(link.getAttribute('href') || '').toContain('1234567890');

    // budgets called as well
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
