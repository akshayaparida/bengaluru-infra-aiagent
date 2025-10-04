import { NextResponse } from 'next/server';
import { getAIUsageLimiter } from '../../../lib/ai-usage-limiter';

/**
 * GET /api/ai-usage
 * 
 * Returns current AI classification usage statistics
 * Useful for monitoring and cost control
 */
export async function GET() {
  try {
    const limiter = await getAIUsageLimiter();
    const stats = await limiter.getUsageStats();

    return NextResponse.json({
      ok: true,
      ...stats,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI usage stats:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch usage stats',
    }, { status: 500 });
  }
}
