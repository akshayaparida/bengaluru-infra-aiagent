/**
 * AI Usage Limiter
 * 
 * Limits the number of AI classification requests per day to control costs.
 * When limit is reached, falls back to keyword-based classification.
 */

import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const USAGE_FILE = '.data/ai-usage.json';

interface AIUsageData {
  date: string; // YYYY-MM-DD
  classificationsUsed: number;
  dailyLimit: number;
  resetAt: string; // ISO timestamp
}

export class AIUsageLimiter {
  private usageFile: string;
  private dailyLimit: number;

  constructor(dailyLimit: number = 5, usageFile: string = USAGE_FILE) {
    this.dailyLimit = dailyLimit;
    this.usageFile = usageFile;
  }

  /**
   * Check if we can use AI classification today
   */
  async canUseAI(): Promise<boolean> {
    const usage = await this.getUsage();
    
    // Check if we need to reset (new day)
    if (this.shouldReset(usage)) {
      await this.reset();
      return true;
    }

    return usage.classificationsUsed < usage.dailyLimit;
  }

  /**
   * Record an AI classification usage
   */
  async recordUsage(): Promise<void> {
    const usage = await this.getUsage();
    
    // Reset if new day
    if (this.shouldReset(usage)) {
      await this.reset();
      return this.recordUsage();
    }

    usage.classificationsUsed++;
    await this.saveUsage(usage);
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(): Promise<{
    used: number;
    remaining: number;
    limit: number;
    resetAt: string;
    canUseAI: boolean;
  }> {
    const usage = await this.getUsage();
    const canUse = await this.canUseAI();

    return {
      used: usage.classificationsUsed,
      remaining: Math.max(0, usage.dailyLimit - usage.classificationsUsed),
      limit: usage.dailyLimit,
      resetAt: usage.resetAt,
      canUseAI: canUse,
    };
  }

  /**
   * Manually reset the usage counter (for testing or admin override)
   */
  async reset(): Promise<void> {
    const today = this.getTodayString();
    const resetAt = this.getTomorrowMidnight();

    const usage: AIUsageData = {
      date: today,
      classificationsUsed: 0,
      dailyLimit: this.dailyLimit,
      resetAt: resetAt.toISOString(),
    };

    await this.saveUsage(usage);
  }

  /**
   * Update daily limit (for production scaling)
   */
  async updateLimit(newLimit: number): Promise<void> {
    const usage = await this.getUsage();
    usage.dailyLimit = newLimit;
    await this.saveUsage(usage);
  }

  // Private helper methods

  private async getUsage(): Promise<AIUsageData> {
    try {
      if (existsSync(this.usageFile)) {
        const data = await readFile(this.usageFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load AI usage data, creating fresh');
    }

    // Create fresh usage data
    const today = this.getTodayString();
    const resetAt = this.getTomorrowMidnight();

    return {
      date: today,
      classificationsUsed: 0,
      dailyLimit: this.dailyLimit,
      resetAt: resetAt.toISOString(),
    };
  }

  private async saveUsage(usage: AIUsageData): Promise<void> {
    try {
      const dir = path.dirname(this.usageFile);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.usageFile, JSON.stringify(usage, null, 2));
    } catch (error) {
      console.error('Could not save AI usage data:', error);
    }
  }

  private shouldReset(usage: AIUsageData): boolean {
    const today = this.getTodayString();
    return usage.date !== today;
  }

  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getTomorrowMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}

// Singleton instance
let aiUsageLimiter: AIUsageLimiter | null = null;

export async function getAIUsageLimiter(): Promise<AIUsageLimiter> {
  if (!aiUsageLimiter) {
    // Read limit from environment variable or default to 5
    const limit = parseInt(process.env.AI_DAILY_LIMIT || '5', 10);
    aiUsageLimiter = new AIUsageLimiter(limit);
  }
  return aiUsageLimiter;
}
