import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

/**
 * Integration test: Verify lat/lng order is consistent throughout the entire app
 * 
 * Common mistake: Leaflet and some APIs use [lat, lng] while others use [lng, lat]
 * This test ensures coordinates are stored and retrieved in the correct order.
 * 
 * Bengaluru coordinates for reference:
 * - Latitude: 12.9716 (should be first in [lat, lng] format)
 * - Longitude: 77.5946 (should be second in [lat, lng] format)
 */

const uploadDir = path.join(process.cwd(), '.data', 'test-uploads-coords');
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
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Report" RESTART IDENTITY CASCADE');
  await ensureCleanDir(uploadDir);
});

describe('Coordinate Order Validation (Integration)', () => {
  it('stores lat/lng in correct order when submitting report', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { POST }: typeof import('../../src/app/api/reports/route') = await import('../../src/app/api/reports/route');

    const fd = new FormData();
    fd.set('description', 'Test pothole near MG Road');
    // MG Road, Bengaluru: lat=12.9716, lng=77.5946
    fd.set('lat', '12.9716');
    fd.set('lng', '77.5946');

    const jpegBytes = randomBytes(64);
    const file = new File([new Uint8Array(jpegBytes)], 'photo.jpg', { type: 'image/jpeg' });
    fd.set('photo', file);

    const req = new Request('http://localhost/api/reports', { method: 'POST', body: fd as any });
    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const body = await res.json();
    const reportId = body.id;

    // Verify DB storage
    const dbReport = await prisma.report.findUnique({ where: { id: reportId } });
    expect(dbReport).not.toBeNull();
    
    // Verify lat/lng are stored correctly
    expect(dbReport!.lat).toBeCloseTo(12.9716, 4);
    expect(dbReport!.lng).toBeCloseTo(77.5946, 4);
    
    // IMPORTANT: Latitude should be smaller than longitude for Bengaluru
    // If this fails, coordinates are likely swapped
    expect(dbReport!.lat).toBeLessThan(dbReport!.lng);
    
    // Verify latitude is in Bengaluru range (12.8 to 13.2)
    expect(dbReport!.lat).toBeGreaterThanOrEqual(12.8);
    expect(dbReport!.lat).toBeLessThanOrEqual(13.2);
    
    // Verify longitude is in Bengaluru range (77.4 to 77.8)
    expect(dbReport!.lng).toBeGreaterThanOrEqual(77.4);
    expect(dbReport!.lng).toBeLessThanOrEqual(77.8);
  });

  it('retrieves lat/lng in correct order from GET endpoint', async () => {
    // Seed a report with known coordinates
    const testLat = 12.9352; // Koramangala
    const testLng = 77.6245;
    
    await prisma.report.create({
      data: {
        description: 'Test report for coordinate order',
        lat: testLat,
        lng: testLng,
        photoPath: '/tmp/test.jpg',
        status: 'NEW'
      }
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { GET }: typeof import('../../src/app/api/reports/route') = await import('../../src/app/api/reports/route');
    
    const req = new Request('http://localhost/api/reports?limit=10', { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    
    const report = body.items[0];
    
    // Verify coordinates are returned in correct order
    expect(report.lat).toBeCloseTo(testLat, 4);
    expect(report.lng).toBeCloseTo(testLng, 4);
    
    // Latitude should be less than longitude for Bengaluru
    expect(report.lat).toBeLessThan(report.lng);
  });

  it('detects if coordinates are swapped (lat > lng for Bengaluru would be wrong)', async () => {
    // This test ensures we catch the common mistake of swapping lat/lng
    // For Bengaluru: lat (12.x) < lng (77.x)
    // If someone swaps them: lat (77.x) > lng (12.x) - WRONG!
    
    const correctLat = 12.9716;
    const correctLng = 77.5946;
    
    // Verify the assumption that lat < lng for Bengaluru
    expect(correctLat).toBeLessThan(correctLng);
    
    // If coordinates were swapped, this would fail:
    const swappedLat = 77.5946; // WRONG - this is actually longitude
    const swappedLng = 12.9716; // WRONG - this is actually latitude
    
    // The swapped version would have lat > lng
    expect(swappedLat).toBeGreaterThan(swappedLng);
    
    // Make sure our validation would catch this
    const isValidBengaluru = (lat: number, lng: number) => {
      return lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8;
    };
    
    expect(isValidBengaluru(correctLat, correctLng)).toBe(true);
    expect(isValidBengaluru(swappedLat, swappedLng)).toBe(false);
  });
});
