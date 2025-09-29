import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ReportStatus } from '@prisma/client';

// TDD-first: GET route not implemented yet; these tests define the contract.
// It should export: export async function GET(req: Request)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ReportsRoute from '../../src/app/api/reports/route';

const prisma = new PrismaClient();

beforeAll(async () => {
  // nothing
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.report.deleteMany({});
});

describe('GET /api/reports (TDD)', () => {
  it('returns empty items array when no reports', async () => {
    // @ts-expect-error route will be added later
    const { GET }: typeof ReportsRoute = await import('../../src/app/api/reports/route');
    const req = new Request('http://localhost/api/reports', { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(0);
  });

  it('lists reports sorted by createdAt desc and supports limit', async () => {
    // Seed three reports with increasing createdAt
    const r1 = await prisma.report.create({
      data: { description: 'A', lat: 12.9, lng: 77.5, photoPath: '/tmp/a.jpg', status: ReportStatus.NEW },
    });
    const r2 = await prisma.report.create({
      data: { description: 'B', lat: 13.0, lng: 77.6, photoPath: '/tmp/b.jpg', status: ReportStatus.NEW },
    });
    const r3 = await prisma.report.create({
      data: { description: 'C', lat: 13.1, lng: 77.7, photoPath: '/tmp/c.jpg', status: ReportStatus.NEW },
    });

    // @ts-expect-error route will be added later
    const { GET }: typeof ReportsRoute = await import('../../src/app/api/reports/route');

    // Without limit, expect 3 items, most recent first (r3)
    const resAll = await GET(new Request('http://localhost/api/reports'));
    expect(resAll.status).toBe(200);
    const bodyAll = await resAll.json();
    expect(bodyAll.items.length).toBe(3);
    expect(bodyAll.items[0].id).toBe(r3.id);

    // With limit=1, only one item
    const resOne = await GET(new Request('http://localhost/api/reports?limit=1'));
    expect(resOne.status).toBe(200);
    const bodyOne = await resOne.json();
    expect(bodyOne.items.length).toBe(1);
    expect(bodyOne.items[0].id).toBe(r3.id);

    // Shape check: do not expose internal file path
    const item = bodyOne.items[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('createdAt');
    expect(item).toHaveProperty('description');
    expect(item).toHaveProperty('lat');
    expect(item).toHaveProperty('lng');
    expect(item).toHaveProperty('status');
    expect(item).not.toHaveProperty('photoPath');
  });
});