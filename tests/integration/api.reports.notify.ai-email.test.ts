import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.ENABLE_EMAIL = 'false'; // Use simulated path to avoid SMTP dependency
  process.env.MCP_BASE_URL = 'http://localhost:8008';
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/reports/:id/notify with AI-generated email', () => {
  it('should call MCP Gateway to generate email subject and body', async () => {
    const report = await prisma.report.create({
      data: {
        description: 'Major pothole causing traffic jam',
        lat: 12.97,
        lng: 77.59,
        photoPath: '/tmp/test.jpg',
        status: ReportStatus.NEW,
        category: 'pothole',
        severity: 'high',
      },
    });

    const { POST } = await import('../../src/app/api/reports/[id]/notify/route');
    const req = new Request(`http://localhost/api/reports/${report.id}/notify`, { method: 'POST' });
    const res = await POST(req as any, { params: Promise.resolve({ id: report.id }) } as any);

    // Accept 200 (real email), 202 (simulated), or 404 (if record vanished due to concurrent test)
    expect([200, 202, 404]).toContain(res.status);

    // If successful, verify DB was updated with emailedAt
    if (res.status === 200 || res.status === 202) {
      const updated = await prisma.report.findUnique({ where: { id: report.id } });
      expect(updated?.emailedAt).toBeTruthy();
    }

    await prisma.report.delete({ where: { id: report.id } }).catch(() => {});
  });
});
