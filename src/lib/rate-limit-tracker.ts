/**
 * Rate Limit Tracker for Twitter API
 * Prevents exceeding API limits by tracking usage and enforcing delays
 */

import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const RATE_LIMIT_FILE = '.data/rate-limits.json';

interface RateLimitData {
  endpoint: string;
  callsInWindow: number;
  windowStart: number; // Unix timestamp
  lastCall: number; // Unix timestamp
  resetTime: number; // Unix timestamp from Twitter headers
}

interface RateLimitTracker {
  mentionTimeline: RateLimitData;
  postTweet: RateLimitData;
  userLookup: RateLimitData;
}

// Twitter API Free Tier Limits
const LIMITS = {
  mentionTimeline: {
    perWindow: 3,      // 3 requests per 15 minutes
    windowMs: 15 * 60 * 1000,  // 15 minutes
    per24h: 96,        // 96 requests per day
  },
  postTweet: {
    perWindow: 50,     // 50 posts per 15 minutes (conservative)
    windowMs: 15 * 60 * 1000,
    per24h: 1500,      // 1,500 posts per day
  },
  userLookup: {
    perWindow: 300,
    windowMs: 15 * 60 * 1000,
    per24h: 300,
  },
};

export class RateLimitManager {
  private tracker: RateLimitTracker;
  private filePath: string;

  constructor(filePath: string = RATE_LIMIT_FILE) {
    this.filePath = filePath;
    this.tracker = {
      mentionTimeline: {
        endpoint: 'mentionTimeline',
        callsInWindow: 0,
        windowStart: Date.now(),
        lastCall: 0,
        resetTime: 0,
      },
      postTweet: {
        endpoint: 'postTweet',
        callsInWindow: 0,
        windowStart: Date.now(),
        lastCall: 0,
        resetTime: 0,
      },
      userLookup: {
        endpoint: 'userLookup',
        callsInWindow: 0,
        windowStart: Date.now(),
        lastCall: 0,
        resetTime: 0,
      },
    };
  }

  async load(): Promise<void> {
    try {
      if (existsSync(this.filePath)) {
        const data = await readFile(this.filePath, 'utf-8');
        this.tracker = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load rate limit data, using fresh tracker');
    }
  }

  async save(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.filePath, JSON.stringify(this.tracker, null, 2));
    } catch (error) {
      console.error('Could not save rate limit data:', error);
    }
  }

  /**
   * Check if we can make a call without exceeding rate limit
   */
  canMakeCall(endpoint: keyof RateLimitTracker): boolean {
    const now = Date.now();
    const data = this.tracker[endpoint];
    const limits = LIMITS[endpoint];

    // Check if window has expired
    if (now - data.windowStart > limits.windowMs) {
      // Reset window
      data.callsInWindow = 0;
      data.windowStart = now;
    }

    // Check if we're under the limit
    return data.callsInWindow < limits.perWindow;
  }

  /**
   * Get milliseconds to wait before next call is allowed
   */
  getWaitTime(endpoint: keyof RateLimitTracker): number {
    const now = Date.now();
    const data = this.tracker[endpoint];
    const limits = LIMITS[endpoint];

    if (this.canMakeCall(endpoint)) {
      return 0;
    }

    // If we have a reset time from Twitter headers, use that
    if (data.resetTime > 0 && data.resetTime > now) {
      return data.resetTime - now;
    }

    // Otherwise calculate based on window
    const windowEnd = data.windowStart + limits.windowMs;
    return Math.max(0, windowEnd - now);
  }

  /**
   * Record a successful API call
   */
  recordCall(endpoint: keyof RateLimitTracker, resetTime?: number): void {
    const now = Date.now();
    const data = this.tracker[endpoint];

    data.callsInWindow++;
    data.lastCall = now;
    
    if (resetTime) {
      data.resetTime = resetTime * 1000; // Convert to milliseconds
    }

    this.save();
  }

  /**
   * Update from Twitter API response headers
   */
  updateFromHeaders(endpoint: keyof RateLimitTracker, headers: {
    'x-rate-limit-limit'?: string;
    'x-rate-limit-remaining'?: string;
    'x-rate-limit-reset'?: string;
  }): void {
    const data = this.tracker[endpoint];

    if (headers['x-rate-limit-reset']) {
      data.resetTime = parseInt(headers['x-rate-limit-reset']) * 1000;
    }

    if (headers['x-rate-limit-remaining']) {
      const remaining = parseInt(headers['x-rate-limit-remaining']);
      const limit = parseInt(headers['x-rate-limit-limit'] || '0');
      data.callsInWindow = Math.max(0, limit - remaining);
    }

    this.save();
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    endpoint: string;
    callsInWindow: number;
    limit: number;
    canMakeCall: boolean;
    waitTimeMs: number;
    resetTime: Date;
  }[] {
    return Object.entries(this.tracker).map(([key, data]) => {
      const endpoint = key as keyof RateLimitTracker;
      const limits = LIMITS[endpoint];
      
      return {
        endpoint: key,
        callsInWindow: data.callsInWindow,
        limit: limits.perWindow,
        canMakeCall: this.canMakeCall(endpoint),
        waitTimeMs: this.getWaitTime(endpoint),
        resetTime: new Date(data.resetTime || data.windowStart + limits.windowMs),
      };
    });
  }

  /**
   * Smart delay: automatically wait if needed
   */
  async waitIfNeeded(endpoint: keyof RateLimitTracker): Promise<void> {
    const waitMs = this.getWaitTime(endpoint);
    
    if (waitMs > 0) {
      const minutes = Math.ceil(waitMs / 60000);
      console.log(`⏳ Rate limit reached for ${endpoint}. Waiting ${minutes} minute(s)...`);
      console.log(`   Will resume at: ${new Date(Date.now() + waitMs).toLocaleTimeString()}`);
      
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  /**
   * Conservative check: ensures we stay well under limits
   */
  shouldThrottle(endpoint: keyof RateLimitTracker): boolean {
    const data = this.tracker[endpoint];
    const limits = LIMITS[endpoint];
    
    // Use 80% of limit as safety threshold
    const safetyThreshold = limits.perWindow * 0.8;
    
    return data.callsInWindow >= safetyThreshold;
  }

  /**
   * Reset tracker (for testing)
   */
  reset(): void {
    Object.values(this.tracker).forEach(data => {
      data.callsInWindow = 0;
      data.windowStart = Date.now();
      data.lastCall = 0;
      data.resetTime = 0;
    });
    this.save();
  }
}

// Singleton instance
let rateLimitManager: RateLimitManager | null = null;

export async function getRateLimitManager(): Promise<RateLimitManager> {
  if (!rateLimitManager) {
    rateLimitManager = new RateLimitManager();
    await rateLimitManager.load();
  }
  return rateLimitManager;
}
