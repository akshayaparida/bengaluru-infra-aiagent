#!/usr/bin/env tsx

/**
 * POST ONE REAL REPLY - For Screenshot Proof
 * This will actually post to Twitter! Use carefully!
 */

import * as dotenv from 'dotenv';
import { TwitterMonitorService, generateAIReply } from '../src/lib/twitter-monitor';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function postOneRealReply() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   POST ONE REAL REPLY - For Screenshot Proof             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('⚠️  WARNING: This will actually post to Twitter!\n');

  // Verify environment variables
  const requiredEnvVars = [
    'TWITTER_CONSUMER_KEY',
    'TWITTER_CONSUMER_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  console.log('✅ Environment variables loaded\n');

  // Monitor only ONE handle to save rate limits
  const monitorHandle = '@GBA_office';
  console.log(`📡 Monitoring: ${monitorHandle}\n`);

  // Initialize monitor
  const monitor = new TwitterMonitorService(
    process.env.TWITTER_CONSUMER_KEY!,
    process.env.TWITTER_CONSUMER_SECRET!,
    process.env.TWITTER_ACCESS_TOKEN!,
    process.env.TWITTER_ACCESS_SECRET!,
    [monitorHandle]
  );

  console.log('--- Step 1: Fetch Recent Mentions ---\n');
  
  const allTweets = await monitor.monitorAllHandles(20);
  console.log(`Found ${allTweets.length} total mentions\n`);

  if (allTweets.length === 0) {
    console.log('❌ No tweets found. Cannot proceed.\n');
    return;
  }

  // Filter recent
  const recentTweets = monitor.filterRecentTweets(allTweets, 2);
  console.log(`${recentTweets.length} tweets from last 2 hours\n`);

  // Classify
  const complaints = recentTweets
    .map(tweet => monitor.classifyComplaint(tweet))
    .filter(complaint => complaint !== null);

  console.log(`Found ${complaints.length} infrastructure complaints\n`);

  if (complaints.length === 0) {
    console.log('❌ No infrastructure complaints found. Cannot proceed.\n');
    return;
  }

  // Pick the first complaint
  const complaint = complaints[0]!;

  console.log('--- Step 2: Selected Complaint for Reply ---\n');
  console.log(`Category: ${complaint.category.toUpperCase()}`);
  console.log(`Severity: ${complaint.severity.toUpperCase()}`);
  console.log(`Location: ${complaint.location || 'Not detected'}`);
  console.log(`Author: @${complaint.tweet.authorUsername}`);
  console.log(`Tweet: "${complaint.tweet.text.slice(0, 100)}..."\n`);

  console.log('--- Step 3: Generate AI Reply ---\n');
  
  const reply = await generateAIReply(complaint, process.env.MCP_BASE_URL || 'http://localhost:8008');
  
  if (!reply) {
    console.log('❌ Failed to generate reply\n');
    return;
  }

  console.log(`Generated reply:\n"${reply}"\n`);
  console.log(`Length: ${reply.length} chars`);
  console.log(`Has @GBA_office: ${reply.includes('@GBA_office') ? '✓' : '✗'}`);
  console.log(`Has @ICCCBengaluru: ${reply.includes('@ICCCBengaluru') ? '✓' : '✗'}\n`);

  console.log('--- Step 4: Confirm Before Posting ---\n');
  console.log('⚠️  FINAL CONFIRMATION REQUIRED!\n');
  console.log('This will POST TO TWITTER:');
  console.log(`  Tweet ID: ${complaint.tweet.id}`);
  console.log(`  Reply: "${reply}"`);
  console.log(`  Author will be notified: @${complaint.tweet.authorUsername}\n`);

  // For automation, check environment variable
  const autoConfirm = process.env.AUTO_CONFIRM_REPLY === 'true';
  
  if (!autoConfirm) {
    console.log('❌ AUTO_CONFIRM_REPLY not set to "true"');
    console.log('   To proceed, run with: AUTO_CONFIRM_REPLY=true\n');
    console.log('Example:');
    console.log('  AUTO_CONFIRM_REPLY=true npx tsx scripts/post-one-real-reply.ts\n');
    return;
  }

  console.log('✅ AUTO_CONFIRM_REPLY=true, proceeding...\n');
  console.log('--- Step 5: Posting to Twitter ---\n');

  try {
    const success = await monitor.postReply(complaint.tweet.id, reply);
    
    if (success) {
      console.log('✅ SUCCESS! Reply posted to Twitter!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('SCREENSHOT PROOF DETAILS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Tweet ID: ${complaint.tweet.id}`);
      console.log(`Original Tweet: @${complaint.tweet.authorUsername}`);
      console.log(`Your Reply: "${reply}"`);
      console.log(`Category: ${complaint.category}`);
      console.log(`Severity: ${complaint.severity}`);
      console.log(`Location: ${complaint.location || 'N/A'}`);
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📸 Take screenshot now!');
      console.log('🔗 View on Twitter: https://twitter.com/i/status/' + complaint.tweet.id);
      console.log('\n✅ Feature working! Autonomous civic engagement successful!\n');
    } else {
      console.log('❌ Failed to post reply. Check logs above.\n');
    }
  } catch (error) {
    console.error('❌ Error posting reply:', error);
  }
}

// Run
postOneRealReply().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
