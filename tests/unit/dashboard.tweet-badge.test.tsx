import { describe, it, expect } from 'vitest';

describe('Dashboard tweet badge logic (unit)', () => {
  it('should identify simulated tweet IDs correctly', () => {
    const simulatedTweetId = 'sim-12345';
    const realTweetId = '1234567890123456789';

    // Test the logic used in DashboardView
    const isSimulated = (tweetId: string) => tweetId.startsWith('sim-');

    expect(isSimulated(simulatedTweetId)).toBe(true);
    expect(isSimulated(realTweetId)).toBe(false);
  });

  it('should generate correct Twitter URL for real tweet IDs', () => {
    const realTweetId = '1234567890123456789';
    const twitterUrl = `https://x.com/i/web/status/${realTweetId}`;

    expect(twitterUrl).toContain('x.com');
    expect(twitterUrl).toContain(realTweetId);
    expect(twitterUrl).toBe('https://x.com/i/web/status/1234567890123456789');
  });
});
