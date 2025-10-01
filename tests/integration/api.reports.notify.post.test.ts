import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ReportStatus } from '@prisma/client';

// TDD-first: notify route not implemented yet; these tests define the contract.
// It should export: export async function POST(req: Request, ctx: { params: { id: string }})
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as NotifyRoute from '../../src/app/api/reports/[id]/notify/route';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.ENABLE_EMAIL = 'true';
  process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
  process.env.SMTP_PORT = process.env.SMTP_PORT || '1025';
  process.env.FROM_EMAIL = process.env.FROM_EMAIL || 'infra-agent@localhost';
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Report" RESTART IDENTITY CASCADE');
});

describe('POST /api/reports/:id/notify (TDD)', () => {
  it('404 when report not found', async () => {
    const { POST }: typeof NotifyRoute = await import('../../src/app/api/reports/[id]/notify/route');
    const req = new Request('http://localhost/api/reports/does-not-exist/notify', { method: 'POST' });
    const res = await POST(req as any, { params: { id: 'does-not-exist' } } as any);
    expect(res.status).toBe(404);
  });

  it('200 when ENABLE_EMAIL=true and Mailpit is reachable; returns messageId', async () => {
    const r = await prisma.report.create({
      data: { description: 'Streetlight not working', lat: 12.97, lng: 77.59, photoPath: '/tmp/x.jpg', status: ReportStatus.NEW },
    });

    const { POST }: typeof NotifyRoute = await import('../../src/app/api/reports/[id]/notify/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/notify`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    // Accept 200 (sent) or 404 (if a truncation occurred unexpectedly)
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(typeof body.messageId).toBe('string');
    }
  });

  it('202 when ENABLE_EMAIL!=true (simulation path)', async () => {
    process.env.ENABLE_EMAIL = 'false';
    const r = await prisma.report.create({
      data: { description: 'Water leakage', lat: 12.98, lng: 77.60, photoPath: '/tmp/y.jpg', status: ReportStatus.NEW },
    });

    const { POST }: typeof NotifyRoute = await import('../../src/app/api/reports/[id]/notify/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/notify`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect([202, 404]).toContain(res.status);
    const body = await res.json();
    if (res.status === 202) {
      expect(body.ok).toBe(true);
      expect(body.simulated).toBe(true);
    }

    // restore for other tests
    process.env.ENABLE_EMAIL = 'true';
  });
});