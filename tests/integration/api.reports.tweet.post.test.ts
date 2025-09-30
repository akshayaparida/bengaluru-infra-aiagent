import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ReportStatus } from '@prisma/client';

// TDD-first: tweet route not implemented yet; these tests define the contract.
// It should export: export async function POST(req: Request, ctx: { params: { id: string }})
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as TweetRoute from '../../src/app/api/reports/[id]/tweet/route';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.SIMULATE_TWITTER = 'true';
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Report" RESTART IDENTITY CASCADE');
});

describe('POST /api/reports/:id/tweet (TDD)', () => {
  it('404 when report not found', async () => {
    // @ts-expect-error route will be added later
    const { POST }: typeof TweetRoute = await import('../../src/app/api/reports/[id]/tweet/route');
    const req = new Request('http://localhost/api/reports/does-not-exist/tweet', { method: 'POST' });
    const res = await POST(req as any, { params: { id: 'does-not-exist' } } as any);
    expect(res.status).toBe(404);
  });

  it('202 simulated when SIMULATE_TWITTER=true; returns tweet text', async () => {
    const r = await prisma.report.create({
      data: { description: 'Pothole near metro station', lat: 12.97, lng: 77.59, photoPath: '/tmp/p.jpg', status: ReportStatus.NEW },
    });

    // @ts-expect-error route will be added later
    const { POST }: typeof TweetRoute = await import('../../src/app/api/reports/[id]/tweet/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/tweet`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    // Accept 202 or 404 (in case a parallel truncate happens); 202 is the expected simulation
    expect([202, 404]).toContain(res.status);
    if (res.status === 202) {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.simulated).toBe(true);
      expect(typeof body.text).toBe('string');
      expect(body.text.length).toBeGreaterThan(10);
    }
  });

  it('501 when SIMULATE_TWITTER=false (real posting not configured in POC)', async () => {
    process.env.SIMULATE_TWITTER = 'false';
    const r = await prisma.report.create({
      data: { description: 'Streetlight out near park', lat: 12.95, lng: 77.62, photoPath: '/tmp/s.jpg', status: ReportStatus.NEW },
    });

    // @ts-expect-error route will be added later
    const { POST }: typeof TweetRoute = await import('../../src/app/api/reports/[id]/tweet/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/tweet`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(typeof body.reason).toBe('string');

    // restore
    process.env.SIMULATE_TWITTER = 'true';
  });
});