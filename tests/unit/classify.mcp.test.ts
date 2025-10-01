import { describe, it, expect, vi } from "vitest";
import { classifyViaMcp, DEFAULT_CATEGORIES, DEFAULT_SEVERITIES } from "../../src/lib/classify";

describe("classifyViaMcp", () => {
  it("maps category and severity from MCP response and returns non-simulated", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, category: "pothole", severity: "high" }),
    });
    const res = await classifyViaMcp("Pothole big", "http://localhost:8008", fetchFn as any, 2000);
    expect(res.simulated).toBe(false);
    expect(DEFAULT_CATEGORIES).toContain(res.category);
    expect(DEFAULT_SEVERITIES).toContain(res.severity);
  });

  it("throws when MCP HTTP not ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false });
    await expect(classifyViaMcp("x", "http://localhost:8008", fetchFn as any, 500)).rejects.toBeTruthy();
  });

  it("throws when base url missing", async () => {
    await expect(classifyViaMcp("x", "", fetch as any, 500)).rejects.toBeTruthy();
  });
});
