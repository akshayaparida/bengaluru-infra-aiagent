import { NextRequest, NextResponse } from 'next/server';
import { TwitterMonitorService, generateAIReply } from '@/lib/twitter-monitor';
import { getRateLimitManager } from '@/lib/rate-limit-tracker';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const PROCESSED_TWEETS_FILE = '.data/processed-tweets.json';
const MAX_REPLIES_PER_RUN = 5;
const REPLY_DELAY_MS = 120000; // 2 minutes between replies

interface ProcessedTweet {
  id: string;
  processedAt: string;
  repliedAt?: string;
}

async function loadProcessedTweets(): Promise<ProcessedTweet[]> {
  try {
    if (!existsSync(PROCESSED_TWEETS_FILE)) {
      const dir = path.dirname(PROCESSED_TWEETS_FILE);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(PROCESSED_TWEETS_FILE, JSON.stringify([]));
      return [];
    }
    const data = await readFile(PROCESSED_TWEETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading processed tweets:', error);
    return [];
  }
}

async function saveProcessedTweets(tweets: ProcessedTweet[]): Promise<void> {
  try {
    const dir = path.dirname(PROCESSED_TWEETS_FILE);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(PROCESSED_TWEETS_FILE, JSON.stringify(tweets, null, 2));
  } catch (error) {
    console.error('Error saving processed tweets:', error);
  }
}

function isAlreadyProcessed(tweetId: string, processed: ProcessedTweet[]): boolean {
  return processed.some(t => t.id === tweetId);
}

function cleanupOldProcessedTweets(processed: ProcessedTweet[]): ProcessedTweet[] {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return processed.filter(t => new Date(t.processedAt) > sevenDaysAgo);
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify environment variables
    const requiredEnvVars = [
      'TWITTER_CONSUMER_KEY',
      'TWITTER_CONSUMER_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'MCP_BASE_URL',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        return NextResponse.json(
          { error: `Missing required environment variable: ${envVar}` },
          { status: 500 }
        );
      }
    }

    // Get monitored handles from env or use defaults
    const monitoredHandles = process.env.MONITORED_TWITTER_HANDLES?.split(',') || 
                              ['@GBA_office', '@ICCCBengaluru'];

    console.log(`Starting Twitter monitor for handles: ${monitoredHandles.join(', ')}`);

    // Initialize rate limit manager
    const rateLimiter = await getRateLimitManager();
    
    // Show current rate limit status
    const stats = rateLimiter.getStats();
    console.log('Rate limit status:');
    stats.forEach(stat => {
      console.log(`  ${stat.endpoint}: ${stat.callsInWindow}/${stat.limit} calls, ` +
                  `can call: ${stat.canMakeCall}, wait: ${Math.ceil(stat.waitTimeMs / 1000)}s`);
    });

    // Check if we can make API calls
    if (!rateLimiter.canMakeCall('mentionTimeline')) {
      const waitMs = rateLimiter.getWaitTime('mentionTimeline');
      const waitMin = Math.ceil(waitMs / 60000);
      console.log(`⚠️  Rate limit reached. Need to wait ${waitMin} minute(s)`);
      
      return NextResponse.json({
        success: false,
        message: `Rate limit reached. Try again in ${waitMin} minute(s)`,
        waitTimeMs: waitMs,
        stats: rateLimiter.getStats(),
      }, { status: 429 });
    }

    // Initialize Twitter monitor
    const monitor = new TwitterMonitorService(
      process.env.TWITTER_CONSUMER_KEY!,
      process.env.TWITTER_CONSUMER_SECRET!,
      process.env.TWITTER_ACCESS_TOKEN!,
      process.env.TWITTER_ACCESS_SECRET!,
      monitoredHandles
    );

    // Load processed tweets
    let processedTweets = await loadProcessedTweets();
    processedTweets = cleanupOldProcessedTweets(processedTweets);

    // Fetch recent mentions with rate limit tracking
    console.log('Fetching recent mentions...');
    
    // Record API calls for each handle
    monitoredHandles.forEach(() => {
      rateLimiter.recordCall('mentionTimeline');
    });
    
    const allTweets = await monitor.monitorAllHandles(20);
    
    // Filter to recent tweets only (last 2 hours)
    const recentTweets = monitor.filterRecentTweets(allTweets, 2);
    
    console.log(`Found ${recentTweets.length} recent tweets`);

    // Classify and filter infrastructure complaints
    const complaints = recentTweets
      .map(tweet => monitor.classifyComplaint(tweet))
      .filter(complaint => complaint !== null)
      .filter(complaint => !isAlreadyProcessed(complaint!.tweet.id, processedTweets));

    console.log(`Found ${complaints.length} infrastructure complaints`);

    if (complaints.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new infrastructure complaints to process',
        stats: {
          totalTweets: allTweets.length,
          recentTweets: recentTweets.length,
          newComplaints: 0,
          repliesSent: 0,
          duration: Date.now() - startTime,
        },
      });
    }

    // Limit replies per run
    const complaintsToProcess = complaints.slice(0, MAX_REPLIES_PER_RUN);
    
    console.log(`Processing ${complaintsToProcess.length} complaints (max ${MAX_REPLIES_PER_RUN} per run)`);

    const results = {
      processed: 0,
      replied: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each complaint
    for (const complaint of complaintsToProcess) {
      try {
        console.log(`Processing tweet ${complaint!.tweet.id} - ${complaint!.category} (${complaint!.severity})`);

        // Generate AI reply
        const reply = await generateAIReply(complaint!, process.env.MCP_BASE_URL!);
        
        if (!reply) {
          console.error(`Failed to generate reply for tweet ${complaint!.tweet.id}`);
          results.failed++;
          results.errors.push(`Failed to generate reply for tweet ${complaint!.tweet.id}`);
          continue;
        }

        console.log(`Generated reply: ${reply}`);

        // Check rate limit for posting
        if (!rateLimiter.canMakeCall('postTweet')) {
          console.log(`⚠️  Post rate limit reached, skipping remaining replies`);
          break;
        }

        // Post reply to Twitter
        const success = await monitor.postReply(complaint!.tweet.id, reply);
        
        if (success) {
          rateLimiter.recordCall('postTweet');
          results.replied++;
          processedTweets.push({
            id: complaint!.tweet.id,
            processedAt: new Date().toISOString(),
            repliedAt: new Date().toISOString(),
          });
          console.log(`Successfully replied to tweet ${complaint!.tweet.id}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to post reply for tweet ${complaint!.tweet.id}`);
        }

        results.processed++;

        // Delay between replies to avoid rate limiting
        if (complaintsToProcess.indexOf(complaint) < complaintsToProcess.length - 1) {
          console.log(`Waiting ${REPLY_DELAY_MS / 1000} seconds before next reply...`);
          await delay(REPLY_DELAY_MS);
        }

      } catch (error) {
        console.error(`Error processing complaint:`, error);
        results.failed++;
        results.errors.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save processed tweets
    await saveProcessedTweets(processedTweets);

    const duration = Date.now() - startTime;
    console.log(`Monitor run completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} complaints, sent ${results.replied} replies`,
      stats: {
        totalTweets: allTweets.length,
        recentTweets: recentTweets.length,
        newComplaints: complaints.length,
        processed: results.processed,
        repliesSent: results.replied,
        failed: results.failed,
        duration,
      },
      rateLimits: rateLimiter.getStats(),
      errors: results.errors.length > 0 ? results.errors : undefined,
    });

  } catch (error) {
    console.error('Twitter monitor error:', error);
    return NextResponse.json(
      { 
        error: 'Twitter monitor failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Optionally support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
