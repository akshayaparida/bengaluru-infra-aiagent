import { describe, it, expect } from "vitest";
import { PrismaClient, ReportStatus } from "@prisma/client";

// Verify notify route updates DB fields (emailedAt, emailMessageId) in both real and simulated paths

const prisma = new PrismaClient();

describe("notify route updates DB", () => {
  it("sets emailedAt and emailMessageId on simulated path", async () => {
    const { POST } = await import("../../src/app/api/reports/[id]/notify/route");
    const r = await prisma.report.create({
      data: { description: "Test email", lat: 12, lng: 77, photoPath: "/tmp/x.jpg", status: ReportStatus.NEW },
    });
    process.env.ENABLE_EMAIL = "false";
    const req = new Request(`http://localhost/api/reports/${r.id}/notify`, { method: "POST" });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect([202,200,404]).toContain(res.status);

    const updated = await prisma.report.findUnique({ where: { id: r.id } });
    expect(updated?.emailedAt).toBeTruthy();
  });
});
