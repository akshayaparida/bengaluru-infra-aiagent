import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function buildTweetText(desc: string, lat: number, lng: number, createdAt: Date) {
  const base = `Report: ${desc} @ ${lat.toFixed(4)}, ${lng.toFixed(4)} on ${createdAt.toISOString()}`;
  return base.length > 240 ? base.slice(0, 237) + '…' : base;
}

export async function POST(request: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id;
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const simulate = String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false';
    const text = buildTweetText(report.description, report.lat, report.lng, report.createdAt);

    if (simulate) {
      return NextResponse.json({ ok: true, simulated: true, text }, { status: 202 });
    }

    return NextResponse.json({ ok: false, reason: 'real_tweet_not_configured_for_poc' }, { status: 501 });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}