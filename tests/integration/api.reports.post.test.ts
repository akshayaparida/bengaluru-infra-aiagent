import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

// TDD-first: the route does not exist yet; this import will fail until implemented.
// When implemented, it should export: export async function POST(req: Request)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ReportsRoute from '../../src/app/api/reports/route';

const uploadDir = path.join(process.cwd(), '.data', 'test-uploads');
const prisma = new PrismaClient();

async function ensureCleanDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {}
  await fs.mkdir(dir, { recursive: true });
}

beforeAll(async () => {
  process.env.FILE_STORAGE_DIR = uploadDir;
  await ensureCleanDir(uploadDir);
});

afterAll(async () => {
  await prisma.$disconnect();
  await fs.rm(uploadDir, { recursive: true, force: true });
});

beforeEach(async () => {
  // Clean any test artifacts in DB created by previous tests for isolation.
  await prisma.report.deleteMany({});
  await ensureCleanDir(uploadDir);
});

describe('POST /api/reports (TDD)', () => {
  it('400 when required fields are missing', async () => {
    // @ts-expect-error route will be added later
    const { POST }: typeof ReportsRoute = await import('../../src/app/api/reports/route');

    const fd = new FormData();
    // Intentionally missing fields
    const req = new Request('http://localhost/api/reports', { method: 'POST', body: fd as any });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('400 when lat/lng invalid or photo missing', async () => {
    // @ts-expect-error route will be added later
    const { POST }: typeof ReportsRoute = await import('../../src/app/api/reports/route');

    const fd = new FormData();
    fd.set('description', 'Broken footpath near MG Road');
    fd.set('lat', 'abc'); // invalid
    fd.set('lng', '77.6');
    // missing photo
    const req = new Request('http://localhost/api/reports', { method: 'POST', body: fd as any });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('201 on valid multipart: saves file and creates DB row', async () => {
    // @ts-expect-error route will be added later
    const { POST }: typeof ReportsRoute = await import('../../src/app/api/reports/route');

    const fd = new FormData();
    fd.set('description', 'Pothole near Indiranagar 100ft road');
    fd.set('lat', '12.9716');
    fd.set('lng', '77.5946');

    const jpegBytes = randomBytes(64);
    const file = new File([jpegBytes], 'photo.jpg', { type: 'image/jpeg' });
    fd.set('photo', file);

    const req = new Request('http://localhost/api/reports', { method: 'POST', body: fd as any });
    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('id');

    // DB row exists
    const row = await prisma.report.findUnique({ where: { id: body.id } });
    expect(row).not.toBeNull();
    expect(row?.description).toContain('Pothole');

    // File exists on disk
    const saved = await fs.readdir(uploadDir);
    expect(saved.length).toBeGreaterThan(0);
  });
});