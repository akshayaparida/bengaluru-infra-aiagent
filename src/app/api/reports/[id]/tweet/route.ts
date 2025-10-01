import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

const prisma = new PrismaClient();

function buildTweetText(desc: string, lat: number, lng: number, createdAt: Date) {
  const base = `Report: ${desc} @ ${lat.toFixed(4)}, ${lng.toFixed(4)} on ${createdAt.toISOString()}`;
  return base.length > 240 ? base.slice(0, 237) + '…' : base;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const simulate = String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false';
    const text = buildTweetText(report.description, report.lat, report.lng, report.createdAt);

    if (simulate) {
      const simId = `sim-${Date.now()}`;
      await prisma.report.update({ where: { id }, data: { tweetedAt: new Date(), tweetId: simId } }).catch(() => {});
      return NextResponse.json({ ok: true, simulated: true, text, tweetId: simId }, { status: 202 });
    }

    // Real posting path (guarded)
    const key = process.env.TWITTER_CONSUMER_KEY;
    const secret = process.env.TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!key || !secret || !accessToken || !accessSecret) {
      return NextResponse.json({ ok: false, reason: 'twitter_keys_missing' }, { status: 501 });
    }

    try {
      const client = new TwitterApi({
        appKey: key,
        appSecret: secret,
        accessToken,
        accessSecret,
      });
      const v2 = client.v2;
      const result = await v2.tweet(text);
      const twId = result.data?.id || '';
      await prisma.report.update({ where: { id }, data: { tweetedAt: new Date(), tweetId: twId } }).catch(() => {});
      return NextResponse.json({ ok: true, simulated: false, tweetId: twId }, { status: 200 });
    } catch (err: any) {
      // Do not leak secrets; return generic error with safe details
      return NextResponse.json({ ok: false, reason: 'twitter_post_failed', detail: String(err?.code || err?.message || 'error') }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
