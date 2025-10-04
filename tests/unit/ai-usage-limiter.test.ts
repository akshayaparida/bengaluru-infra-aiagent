import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { AIUsageLimiter } from '../../src/lib/ai-usage-limiter';

describe('AIUsageLimiter', () => {
  const testUsageFile = '.data/test-ai-usage.json';
  let limiter: AIUsageLimiter;

  beforeEach(async () => {
    // Ensure .data directory exists
    if (!existsSync('.data')) {
      await mkdir('.data', { recursive: true });
    }
    
    // Remove test file if exists
    if (existsSync(testUsageFile)) {
      await unlink(testUsageFile);
    }
    
    // Create limiter with test file
    limiter = new AIUsageLimiter(5, testUsageFile);
  });

  afterEach(async () => {
    // Cleanup test file
    if (existsSync(testUsageFile)) {
      await unlink(testUsageFile);
    }
  });

  describe('canUseAI', () => {
    it('should return true when no usage recorded', async () => {
      const canUse = await limiter.canUseAI();
      expect(canUse).toBe(true);
    });

    it('should return true when usage is below limit', async () => {
      await limiter.recordUsage();
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      const canUse = await limiter.canUseAI();
      expect(canUse).toBe(true);
    });

    it('should return false when usage equals limit', async () => {
      // Record 5 usages (default limit)
      for (let i = 0; i < 5; i++) {
        await limiter.recordUsage();
      }
      
      const canUse = await limiter.canUseAI();
      expect(canUse).toBe(false);
    });

    it('should return false when usage exceeds limit', async () => {
      // Record 6 usages (above limit)
      for (let i = 0; i < 6; i++) {
        await limiter.recordUsage();
      }
      
      const canUse = await limiter.canUseAI();
      expect(canUse).toBe(false);
    });
  });

  describe('recordUsage', () => {
    it('should increment usage counter', async () => {
      await limiter.recordUsage();
      
      const stats = await limiter.getUsageStats();
      expect(stats.used).toBe(1);
    });

    it('should increment multiple times correctly', async () => {
      await limiter.recordUsage();
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      const stats = await limiter.getUsageStats();
      expect(stats.used).toBe(3);
    });

    it('should allow recording even after limit reached', async () => {
      // Record beyond limit
      for (let i = 0; i < 7; i++) {
        await limiter.recordUsage();
      }
      
      const stats = await limiter.getUsageStats();
      expect(stats.used).toBe(7);
    });
  });

  describe('getUsageStats', () => {
    it('should return correct initial stats', async () => {
      const stats = await limiter.getUsageStats();
      
      expect(stats.used).toBe(0);
      expect(stats.remaining).toBe(5);
      expect(stats.limit).toBe(5);
      expect(stats.canUseAI).toBe(true);
      expect(stats.resetAt).toBeDefined();
    });

    it('should return correct stats after some usage', async () => {
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      const stats = await limiter.getUsageStats();
      
      expect(stats.used).toBe(2);
      expect(stats.remaining).toBe(3);
      expect(stats.limit).toBe(5);
      expect(stats.canUseAI).toBe(true);
    });

    it('should show zero remaining when limit reached', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.recordUsage();
      }
      
      const stats = await limiter.getUsageStats();
      
      expect(stats.used).toBe(5);
      expect(stats.remaining).toBe(0);
      expect(stats.canUseAI).toBe(false);
    });

    it('should not show negative remaining', async () => {
      for (let i = 0; i < 7; i++) {
        await limiter.recordUsage();
      }
      
      const stats = await limiter.getUsageStats();
      
      expect(stats.remaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset usage counter to zero', async () => {
      await limiter.recordUsage();
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      await limiter.reset();
      
      const stats = await limiter.getUsageStats();
      expect(stats.used).toBe(0);
      expect(stats.canUseAI).toBe(true);
    });

    it('should reset even when over limit', async () => {
      for (let i = 0; i < 10; i++) {
        await limiter.recordUsage();
      }
      
      await limiter.reset();
      
      const stats = await limiter.getUsageStats();
      expect(stats.used).toBe(0);
      expect(stats.canUseAI).toBe(true);
    });
  });

  describe('updateLimit', () => {
    it('should change daily limit', async () => {
      await limiter.updateLimit(10);
      
      const stats = await limiter.getUsageStats();
      expect(stats.limit).toBe(10);
      expect(stats.remaining).toBe(10);
    });

    it('should affect canUseAI based on new limit', async () => {
      // Use 3 classifications
      await limiter.recordUsage();
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      // Lower limit to 2 (already over)
      await limiter.updateLimit(2);
      
      const canUse = await limiter.canUseAI();
      expect(canUse).toBe(false);
    });

    it('should allow more usage when limit increased', async () => {
      // Use all 5 classifications
      for (let i = 0; i < 5; i++) {
        await limiter.recordUsage();
      }
      
      expect(await limiter.canUseAI()).toBe(false);
      
      // Increase limit to 10
      await limiter.updateLimit(10);
      
      expect(await limiter.canUseAI()).toBe(true);
      
      const stats = await limiter.getUsageStats();
      expect(stats.remaining).toBe(5);
    });
  });

  describe('daily rollover', () => {
    it('should have resetAt timestamp for tomorrow midnight', async () => {
      const stats = await limiter.getUsageStats();
      const resetDate = new Date(stats.resetAt);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(resetDate.getDate()).toBe(tomorrow.getDate());
      expect(resetDate.getHours()).toBe(0);
      expect(resetDate.getMinutes()).toBe(0);
      expect(resetDate.getSeconds()).toBe(0);
    });
  });

  describe('different limits', () => {
    it('should respect custom limit of 10', async () => {
      const limiter10 = new AIUsageLimiter(10, testUsageFile);
      
      for (let i = 0; i < 9; i++) {
        await limiter10.recordUsage();
      }
      
      expect(await limiter10.canUseAI()).toBe(true);
      
      await limiter10.recordUsage();
      expect(await limiter10.canUseAI()).toBe(false);
    });

    it('should respect custom limit of 1', async () => {
      const limiter1 = new AIUsageLimiter(1, testUsageFile);
      
      expect(await limiter1.canUseAI()).toBe(true);
      
      await limiter1.recordUsage();
      
      expect(await limiter1.canUseAI()).toBe(false);
    });

    it('should respect custom limit of 100', async () => {
      const limiter100 = new AIUsageLimiter(100, testUsageFile);
      
      for (let i = 0; i < 99; i++) {
        await limiter100.recordUsage();
      }
      
      expect(await limiter100.canUseAI()).toBe(true);
      
      const stats = await limiter100.getUsageStats();
      expect(stats.remaining).toBe(1);
    });
  });

  describe('persistence', () => {
    it('should persist usage across instances', async () => {
      await limiter.recordUsage();
      await limiter.recordUsage();
      await limiter.recordUsage();
      
      // Create new instance with same file
      const limiter2 = new AIUsageLimiter(5, testUsageFile);
      const stats = await limiter2.getUsageStats();
      
      expect(stats.used).toBe(3);
    });

    it('should persist limit changes', async () => {
      await limiter.updateLimit(15);
      
      // Create new instance with same file
      const limiter2 = new AIUsageLimiter(5, testUsageFile);
      const stats = await limiter2.getUsageStats();
      
      expect(stats.limit).toBe(15);
    });
  });
});
