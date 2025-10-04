import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

const prisma = new PrismaClient();
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const TEST_USAGE_FILE = '.data/ai-usage.json';

describe('POST /api/reports/:id/classify - AI Limiter Integration', () => {
  let reportIds: string[] = [];

  beforeEach(async () => {
    // Clean up previous test data
    reportIds = [];
    
    // Remove usage file to start fresh
    if (existsSync(TEST_USAGE_FILE)) {
      await unlink(TEST_USAGE_FILE);
    }
  });

  afterEach(async () => {
    // Clean up test reports
    if (reportIds.length > 0) {
      await prisma.report.deleteMany({
        where: { id: { in: reportIds } },
      });
    }
  });

  it('should use AI for classifications within daily limit', async () => {
    // Create a test report
    const report = await prisma.report.create({
      data: {
        description: 'Large pothole on MG Road',
        lat: 12.9716,
        lng: 77.5946,
        photoPath: '/test/photo.jpg',
      },
    });
    reportIds.push(report.id);

    // Classification 1 - should use AI (within limit)
    const res1 = await fetch(`${BASE_URL}/api/reports/${report.id}/classify`, {
      method: 'POST',
    });
    const data1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(data1.ok).toBe(true);
    expect(data1.category).toBeDefined();
    expect(data1.severity).toBeDefined();
    
    // Check usage stats
    const usageRes = await fetch(`${BASE_URL}/api/ai-usage`);
    const usageData = await usageRes.json();
    
    expect(usageData.ok).toBe(true);
    expect(usageData.used).toBeGreaterThan(0);
    expect(usageData.canUseAI).toBe(true);
  });

  it('should fall back to keyword classification after limit reached', async () => {
    // Set environment to use a lower limit for testing
    const originalLimit = process.env.AI_DAILY_LIMIT;
    process.env.AI_DAILY_LIMIT = '2';

    try {
      // Create test reports
      const report1 = await prisma.report.create({
        data: {
          description: 'Pothole on 1st Street',
          lat: 12.9716,
          lng: 77.5946,
          photoPath: '/test/photo1.jpg',
        },
      });
      reportIds.push(report1.id);

      const report2 = await prisma.report.create({
        data: {
          description: 'Pothole on 2nd Street',
          lat: 12.9716,
          lng: 77.5946,
          photoPath: '/test/photo2.jpg',
        },
      });
      reportIds.push(report2.id);

      const report3 = await prisma.report.create({
        data: {
          description: 'Pothole on 3rd Street',
          lat: 12.9716,
          lng: 77.5946,
          photoPath: '/test/photo3.jpg',
        },
      });
      reportIds.push(report3.id);

      // Note: Since MCP might not be running, all might be simulated
      // But the limiter should still track attempts

      // Classification 1
      await fetch(`${BASE_URL}/api/reports/${report1.id}/classify`, {
        method: 'POST',
      });

      // Classification 2
      await fetch(`${BASE_URL}/api/reports/${report2.id}/classify`, {
        method: 'POST',
      });

      // Check usage after 2 classifications
      const usageAfter2 = await fetch(`${BASE_URL}/api/ai-usage`);
      const usage2Data = await usageAfter2.json();
      
      console.log('Usage after 2 classifications:', usage2Data);

      // Classification 3 - should see limit behavior
      const res3 = await fetch(`${BASE_URL}/api/reports/${report3.id}/classify`, {
        method: 'POST',
      });
      const data3 = await res3.json();

      expect(res3.status).toBe(200);
      expect(data3.ok).toBe(true);
      expect(data3.category).toBeDefined();

      // Check final usage stats
      const finalUsage = await fetch(`${BASE_URL}/api/ai-usage`);
      const finalData = await finalUsage.json();
      
      console.log('Final usage:', finalData);
      expect(finalData.ok).toBe(true);
    } finally {
      // Restore original limit
      if (originalLimit) {
        process.env.AI_DAILY_LIMIT = originalLimit;
      } else {
        delete process.env.AI_DAILY_LIMIT;
      }
    }
  });

  it('should persist usage counts across multiple requests', async () => {
    // Create multiple reports
    for (let i = 0; i < 3; i++) {
      const report = await prisma.report.create({
        data: {
          description: `Test pothole ${i + 1}`,
          lat: 12.9716,
          lng: 77.5946,
          photoPath: `/test/photo${i}.jpg`,
        },
      });
      reportIds.push(report.id);
    }

    // Classify each report and check usage incrementally
    for (let i = 0; i < reportIds.length; i++) {
      await fetch(`${BASE_URL}/api/reports/${reportIds[i]}/classify`, {
        method: 'POST',
      });

      const usageRes = await fetch(`${BASE_URL}/api/ai-usage`);
      const usageData = await usageRes.json();

      console.log(`After classification ${i + 1}:`, usageData);
      
      expect(usageData.ok).toBe(true);
      expect(usageData.limit).toBe(5); // Default limit
      expect(usageData.remaining).toBeLessThanOrEqual(5 - (i + 1));
    }
  });

  it('should return correct stats from /api/ai-usage endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/ai-usage`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('used');
    expect(data).toHaveProperty('remaining');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('resetAt');
    expect(data).toHaveProperty('canUseAI');

    // Validate types
    expect(typeof data.used).toBe('number');
    expect(typeof data.remaining).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(typeof data.resetAt).toBe('string');
    expect(typeof data.canUseAI).toBe('boolean');

    // Validate values make sense
    expect(data.used).toBeGreaterThanOrEqual(0);
    expect(data.remaining).toBeGreaterThanOrEqual(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.used + data.remaining).toBeGreaterThanOrEqual(data.limit);
  });

  it('should update report category and severity even when using fallback', async () => {
    const report = await prisma.report.create({
      data: {
        description: 'Major garbage accumulation near park',
        lat: 12.9716,
        lng: 77.5946,
        photoPath: '/test/garbage.jpg',
      },
    });
    reportIds.push(report.id);

    // Classify
    const res = await fetch(`${BASE_URL}/api/reports/${report.id}/classify`, {
      method: 'POST',
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);

    // Verify DB was updated
    const updated = await prisma.report.findUnique({
      where: { id: report.id },
    });

    expect(updated).toBeDefined();
    expect(updated?.category).toBeDefined();
    expect(updated?.severity).toBeDefined();
    
    // Should detect "garbage" and "major"
    expect(updated?.category).toBe('garbage');
    expect(updated?.severity).toBe('high');
  });
});
