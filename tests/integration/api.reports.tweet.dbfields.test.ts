import { describe, it, expect } from "vitest";
import { PrismaClient, ReportStatus } from "@prisma/client";

// Verify tweet route updates DB fields (tweetedAt, tweetId) even in simulated mode

const prisma = new PrismaClient();

describe("tweet route updates DB", () => {
  it("sets tweetedAt and tweetId on simulated tweet", async () => {
    const { POST } = await import("../../src/app/api/reports/[id]/tweet/route");
    const r = await prisma.report.create({
      data: { description: "Test tweet", lat: 12, lng: 77, photoPath: "/tmp/x.jpg", status: ReportStatus.NEW },
    });
    process.env.SIMULATE_TWITTER = "true";
    const req = new Request(`http://localhost/api/reports/${r.id}/tweet`, { method: "POST" });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect([200,202]).toContain(res.status);

    const updated = await prisma.report.findUnique({ where: { id: r.id } });
    expect(updated?.tweetedAt).toBeTruthy();
    expect(typeof updated?.tweetId === "string").toBe(true);
  });
});
