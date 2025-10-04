#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { TwitterMonitorService, generateAIReply } from '../src/lib/twitter-monitor';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testTwitterMonitor() {
  console.log('===== Twitter Monitor Test =====\n');

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
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  console.log('✅ Environment variables loaded\n');

  // Get monitored handles
  const monitoredHandles = process.env.MONITORED_TWITTER_HANDLES?.split(',') || 
                            ['@GBA_office', '@ICCCBengaluru'];

  console.log(`📡 Monitoring handles: ${monitoredHandles.join(', ')}\n`);

  // Initialize monitor
  const monitor = new TwitterMonitorService(
    process.env.TWITTER_CONSUMER_KEY!,
    process.env.TWITTER_CONSUMER_SECRET!,
    process.env.TWITTER_ACCESS_TOKEN!,
    process.env.TWITTER_ACCESS_SECRET!,
    monitoredHandles
  );

  console.log('--- Step 1: Fetch Recent Mentions ---\n');
  
  const allTweets = await monitor.monitorAllHandles(20);
  console.log(`Found ${allTweets.length} total mentions\n`);

  if (allTweets.length === 0) {
    console.log('⚠️  No tweets found. This could mean:');
    console.log('   1. The civic handles have no recent mentions');
    console.log('   2. Twitter API credentials might be incorrect');
    console.log('   3. API rate limit reached\n');
    return;
  }

  // Show sample tweets
  console.log('Sample tweets:');
  allTweets.slice(0, 3).forEach((tweet, i) => {
    console.log(`\n${i + 1}. @${tweet.authorUsername}:`);
    console.log(`   ${tweet.text.slice(0, 100)}${tweet.text.length > 100 ? '...' : ''}`);
    console.log(`   ID: ${tweet.id}`);
    console.log(`   Time: ${tweet.createdAt}`);
  });

  console.log('\n--- Step 2: Filter Recent Tweets (last 2 hours) ---\n');
  
  const recentTweets = monitor.filterRecentTweets(allTweets, 2);
  console.log(`${recentTweets.length} tweets from last 2 hours\n`);

  console.log('--- Step 3: Classify Infrastructure Complaints ---\n');
  
  const complaints = recentTweets
    .map(tweet => monitor.classifyComplaint(tweet))
    .filter(complaint => complaint !== null);

  console.log(`Found ${complaints.length} infrastructure complaints\n`);

  if (complaints.length === 0) {
    console.log('⚠️  No infrastructure complaints found in recent tweets');
    console.log('   Try again when citizens post complaints to these handles\n');
    return;
  }

  // Show classified complaints
  console.log('Classified complaints:');
  complaints.forEach((complaint, i) => {
    console.log(`\n${i + 1}. Category: ${complaint!.category.toUpperCase()}`);
    console.log(`   Severity: ${complaint!.severity.toUpperCase()}`);
    console.log(`   Location: ${complaint!.location || 'Not detected'}`);
    console.log(`   Keywords: ${complaint!.keywords.join(', ')}`);
    console.log(`   Tweet: ${complaint!.tweet.text.slice(0, 80)}...`);
    console.log(`   Author: @${complaint!.tweet.authorUsername}`);
  });

  console.log('\n--- Step 4: Generate AI Replies ---\n');

  const testComplaint = complaints[0]!;
  console.log(`Testing AI reply generation for: ${testComplaint.category} complaint`);
  console.log(`Original tweet: "${testComplaint.tweet.text}"\n`);

  const aiReply = await generateAIReply(testComplaint, process.env.MCP_BASE_URL!);

  if (aiReply) {
    console.log('✅ AI Reply Generated:');
    console.log(`   "${aiReply}"\n`);
    console.log(`   Length: ${aiReply.length} characters`);
    console.log(`   Has @GBA_office: ${aiReply.includes('@GBA_office') ? '✅' : '❌'}`);
    console.log(`   Has @ICCCBengaluru: ${aiReply.includes('@ICCCBengaluru') ? '✅' : '❌'}`);
  } else {
    console.log('❌ Failed to generate AI reply');
    console.log('   Check MCP Gateway is running and CEREBRAS_API_KEY is set\n');
  }

  console.log('\n--- Step 5: Dry Run (No Actual Posting) ---\n');
  
  console.log('⚠️  DRY RUN MODE - Not actually posting to Twitter');
  console.log('To post replies for real, call the API endpoint:');
  console.log('   curl http://localhost:3000/api/cron/monitor-twitter\n');

  // Summary
  console.log('--- Summary ---\n');
  console.log(`Total mentions: ${allTweets.length}`);
  console.log(`Recent (2h): ${recentTweets.length}`);
  console.log(`Infrastructure complaints: ${complaints.length}`);
  console.log(`AI reply test: ${aiReply ? '✅ Success' : '❌ Failed'}\n`);

  console.log('Next steps:');
  console.log('1. Set up cron job to run /api/cron/monitor-twitter hourly');
  console.log('2. Monitor logs for actual replies sent');
  console.log('3. Check .data/processed-tweets.json for tracking\n');

  console.log('===== Test Complete =====\n');
}

// Run test
testTwitterMonitor().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
