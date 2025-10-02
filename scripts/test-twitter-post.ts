import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testTwitterAccount() {
  console.log('🐦 Testing Twitter API Connection...\n');

  const key = process.env.TWITTER_CONSUMER_KEY;
  const secret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!key || !secret || !accessToken || !accessSecret) {
    console.error('❌ Missing Twitter credentials in .env.local');
    process.exit(1);
  }

  try {
    // Create Twitter client
    const client = new TwitterApi({
      appKey: key,
      appSecret: secret,
      accessToken,
      accessSecret,
    });

    console.log('✅ Twitter client initialized\n');

    // Get account information
    console.log('📊 Fetching account information...');
    const me = await client.v2.me();
    
    console.log('\n✅ Successfully connected to Twitter!');
    console.log(`\n📱 Account Details:`);
    console.log(`   Name: ${me.data.name}`);
    console.log(`   Username: @${me.data.username}`);
    console.log(`   ID: ${me.data.id}`);
    
    // Ask user if they want to post a test tweet
    console.log('\n⚠️  Would you like to post a test tweet?');
    console.log('   This will post to your REAL Twitter account!');
    console.log('\n   Test tweet: "🤖 Testing Bengaluru Infra AI Agent - automated infrastructure reporting with @BBMPCOMM tagging. Demo ready! #BengaluruTech"\n');
    
    // For automated execution, set this to true to post
    const POST_TEST_TWEET = process.env.POST_TEST_TWEET === 'true';
    
    if (POST_TEST_TWEET) {
      console.log('📤 Posting test tweet...');
      const testTweet = '🤖 Testing Bengaluru Infra AI Agent - automated infrastructure reporting with @BBMPCOMM tagging. Demo ready! #BengaluruTech';
      
      const result = await client.v2.tweet(testTweet);
      console.log(`\n✅ Test tweet posted successfully!`);
      console.log(`   Tweet ID: ${result.data.id}`);
      console.log(`   View at: https://twitter.com/${me.data.username}/status/${result.data.id}`);
    } else {
      console.log('ℹ️  Test tweet NOT posted (set POST_TEST_TWEET=true to post)');
    }

    console.log('\n🎉 Twitter integration is working!');
    console.log('\n📝 Next steps:');
    console.log('   1. Your app will now post REAL tweets');
    console.log('   2. Submit a report to test automatic posting');
    console.log('   3. Check your Twitter feed for the AI-generated tweet');
    console.log('   4. Tweet will include @BBMPCOMM tagging automatically\n');

  } catch (error: any) {
    console.error('\n❌ Twitter API Error:', error.message);
    if (error.code === 401) {
      console.error('\n   Error 401: Invalid credentials');
      console.error('   • Check your API keys in .env.local');
      console.error('   • Ensure keys are from the correct Twitter account');
    } else if (error.code === 403) {
      console.error('\n   Error 403: Permission denied');
      console.error('   • Your app may not have write permissions');
      console.error('   • Check app permissions in Twitter Developer Portal');
    } else if (error.code === 429) {
      console.error('\n   Error 429: Rate limit exceeded');
      console.error('   • Wait a few minutes before trying again');
    }
    process.exit(1);
  }
}

testTwitterAccount();
