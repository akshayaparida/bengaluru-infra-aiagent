import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ReportStatus } from '@prisma/client';

// TDD-first: classification route not implemented yet; these tests define the contract.
// It should export: export async function POST(req: Request, ctx: { params: { id: string }})
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ClassifyRoute from '../../src/app/api/reports/[id]/classify/route';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.ENABLE_CLASSIFICATION = 'true';
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Report" RESTART IDENTITY CASCADE');
});

describe('POST /api/reports/:id/classify (TDD)', () => {
  it('404 when report not found', async () => {
    // @ts-expect-error route will be added later
    const { POST }: typeof ClassifyRoute = await import('../../src/app/api/reports/[id]/classify/route');
    const req = new Request('http://localhost/api/reports/does-not-exist/classify', { method: 'POST' });
    const res = await POST(req as any, { params: { id: 'does-not-exist' } } as any);
    expect(res.status).toBe(404);
  });

  it('200 and updates category/severity when ENABLE_CLASSIFICATION=true (simulation path)', async () => {
    const r = await prisma.report.create({
      data: { description: 'Pothole causing traffic delay', lat: 12.97, lng: 77.59, photoPath: '/tmp/x.jpg', status: ReportStatus.NEW },
    });

    // @ts-expect-error route will be added later
    const { POST }: typeof ClassifyRoute = await import('../../src/app/api/reports/[id]/classify/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/classify`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.category).toBe('string');
    expect(typeof body.severity).toBe('string');

    const updated = await prisma.report.findUnique({ where: { id: r.id } });
    expect(updated?.category).toBeTypeOf('string');
    expect(updated?.severity).toBeTypeOf('string');
  });

  it('202 and does not update DB when ENABLE_CLASSIFICATION!=true', async () => {
    process.env.ENABLE_CLASSIFICATION = 'false';
    const r = await prisma.report.create({
      data: { description: 'Garbage overflow at corner', lat: 12.98, lng: 77.60, photoPath: '/tmp/y.jpg', status: ReportStatus.NEW },
    });

    // @ts-expect-error route will be added later
    const { POST }: typeof ClassifyRoute = await import('../../src/app/api/reports/[id]/classify/route');

    const req = new Request(`http://localhost/api/reports/${r.id}/classify`, { method: 'POST' });
    const res = await POST(req as any, { params: { id: r.id } } as any);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.simulated).toBe(true);

    const unchanged = await prisma.report.findUnique({ where: { id: r.id } });
    expect(unchanged?.category).toBeNull();
    expect(unchanged?.severity).toBeNull();

    // restore flag
    process.env.ENABLE_CLASSIFICATION = 'true';
  });
});