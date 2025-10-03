import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function buildTweetText(desc: string, category: string | null, severity: string | null, lat: number, lng: number): Promise<string> {
  const mcpBaseUrl = process.env.MCP_BASE_URL;
  const civicHandle = process.env.CIVIC_TWITTER_HANDLE || '@GBA_office'; // GBA office (Greater Bengaluru Authority)
  const icccHandle = '@ICCCBengaluru'; // Integrated Command and Control Centre Bengaluru
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  
  // Get location name from reverse geocoding
  let locationName = 'Bengaluru';
  let landmark = '';
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'BengaluruInfraAgent/1.0' }, signal: AbortSignal.timeout(3000) }
    );
    const geoData = await geoRes.json();
    
    // Build detailed location string with landmarks
    const addr = geoData.address || {};
    
    // Priority: road name, then suburb/neighborhood
    if (addr.road) {
      landmark = addr.road;
      if (addr.suburb) locationName = `${addr.road}, ${addr.suburb}`;
      else if (addr.neighbourhood) locationName = `${addr.road}, ${addr.neighbourhood}`;
      else locationName = `${addr.road}, Bengaluru`;
    } else if (addr.suburb) {
      landmark = addr.suburb;
      locationName = `${addr.suburb}, Bengaluru`;
    } else if (addr.neighbourhood) {
      landmark = addr.neighbourhood;
      locationName = `${addr.neighbourhood}, Bengaluru`;
    }
  } catch {}
  
  if (mcpBaseUrl) {
    try {
      
      const aiRes = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          category: category,
          severity: severity,
          locationName: locationName,
          landmark: landmark,
          lat: lat,
          lng: lng,
          mapsLink: mapsLink,
          civicHandle: civicHandle,
          icccHandle: icccHandle,
        }),
        signal: AbortSignal.timeout(5000),
      });
      
      const data = await aiRes.json();
      if (data.tweet) {
        return data.tweet;
      }
    } catch (e) {
      console.warn('AI tweet generation failed, using fallback');
    }
  }
  
  // Fallback template with landmark and exact location
  const emoji = category === 'pothole' ? '🕳️' : category === 'streetlight' ? '💡' : '🚨';
  const locLine = landmark ? `📍 ${locationName}` : `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const base = `${emoji} ${category || 'Infrastructure'} issue: ${desc.slice(0, 60)}\n${locLine}\n🗺️ ${mapsLink}\n${civicHandle} ${icccHandle} please address urgently!`;
  return base.length > 270 ? base.slice(0, 267) + '...' : base;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const simulate = String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false';
    const text = await buildTweetText(report.description, report.category, report.severity, report.lat, report.lng);

    if (simulate) {
      const simId = `sim-${Date.now()}`;
      await prisma.report.update({ where: { id }, data: { tweetedAt: new Date(), tweetId: simId } });
      return NextResponse.json({ ok: true, simulated: true, text, tweetId: simId }, { status: 202 });
    }
    
    // Smart rate limiting: Check daily tweet count (Free tier: 17/day)
    const dailyLimit = parseInt(process.env.TWITTER_DAILY_LIMIT || '15'); // Conservative limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTweets = await prisma.report.count({
      where: {
        tweetedAt: { gte: today },
        tweetId: { not: { startsWith: 'sim-' } } // Exclude simulated tweets
      }
    });
    
    if (todayTweets >= dailyLimit) {
      console.warn(`[Twitter] Daily limit reached: ${todayTweets}/${dailyLimit} tweets today`);
      return NextResponse.json({
        ok: false,
        reason: 'daily_limit_reached',
        detail: `Daily tweet limit (${dailyLimit}) reached. Resets at midnight IST.`,
        tweetsToday: todayTweets,
        limit: dailyLimit
      }, { status: 429 });
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
      
      // Upload photo as media attachment
      let mediaId: string | undefined;
      try {
        // Handle both full paths and filenames
        let photoPath = report.photoPath;
        if (!path.isAbsolute(photoPath) && !photoPath.startsWith('.')) {
          // Just a filename, prepend storage dir
          const storageDir = process.env.FILE_STORAGE_DIR || path.join(process.cwd(), '.data', 'uploads');
          photoPath = path.join(storageDir, photoPath);
        } else if (photoPath.startsWith('.')) {
          // Relative path from project root
          photoPath = path.join(process.cwd(), photoPath);
        }
        // If absolute, use as-is
        
        await fs.access(photoPath); // Check if file exists
        const mediaData = await fs.readFile(photoPath);
        const upload = await client.v1.uploadMedia(mediaData, { mimeType: 'image/jpeg' });
        mediaId = upload;
      } catch (photoErr) {
        console.warn('Photo upload to Twitter failed:', photoErr);
        // Continue without photo attachment
      }
      
      // Post tweet with or without media
      // Note: reply_settings controls who can reply (not where it appears)
      const tweetPayload: any = { 
        text
        // No reply_settings needed - tweets appear in Posts by default when not replying to anyone
      };
      if (mediaId) {
        tweetPayload.media = { media_ids: [mediaId] };
      }
      
      const result = await v2.tweet(tweetPayload);
      const twId = result.data?.id || '';
      await prisma.report.update({ where: { id }, data: { tweetedAt: new Date(), tweetId: twId } });
      return NextResponse.json({ ok: true, simulated: false, tweetId: twId, hasMedia: !!mediaId }, { status: 200 });
    } catch (err: any) {
      // Log detailed error for debugging (without secrets)
      console.error('[Twitter Error] Code:', err?.code);
      console.error('[Twitter Error] Message:', err?.message);
      console.error('[Twitter Error] Data:', JSON.stringify(err?.data || {}));
      console.error('[Twitter Error] RateLimit:', JSON.stringify(err?.rateLimit || {}));
      
      // Specific handling for rate limits
      const errorCode = String(err?.code || '');
      if (errorCode === '429' || err?.message?.includes('Too Many Requests')) {
        return NextResponse.json({ 
          ok: false, 
          reason: 'rate_limit_exceeded', 
          detail: err?.data?.detail || err?.message || 'Twitter rate limit exceeded',
          error: err?.data || {}
        }, { status: 429 });
      }
      
      // Generic error (don't leak secrets)
      return NextResponse.json({ 
        ok: false, 
        reason: 'twitter_post_failed', 
        detail: String(err?.code || err?.message || 'error'),
        hint: errorCode === '403' ? 'Check Twitter app permissions' : undefined
      }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
