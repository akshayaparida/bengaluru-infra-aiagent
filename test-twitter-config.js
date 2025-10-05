// Test Twitter configuration
require('dotenv').config({ path: '.env.local' });

console.log('=== Twitter Configuration Check ===\n');

console.log('Environment Variables:');
console.log('SIMULATE_TWITTER =', process.env.SIMULATE_TWITTER);
console.log('AUTO_TWEET =', process.env.AUTO_TWEET);
console.log('');

console.log('Twitter API Keys:');
console.log('TWITTER_CONSUMER_KEY =', process.env.TWITTER_CONSUMER_KEY ? '✓ Set (length: ' + process.env.TWITTER_CONSUMER_KEY.length + ')' : '✗ Missing');
console.log('TWITTER_CONSUMER_SECRET =', process.env.TWITTER_CONSUMER_SECRET ? '✓ Set (length: ' + process.env.TWITTER_CONSUMER_SECRET.length + ')' : '✗ Missing');
console.log('TWITTER_ACCESS_TOKEN =', process.env.TWITTER_ACCESS_TOKEN ? '✓ Set (length: ' + process.env.TWITTER_ACCESS_TOKEN.length + ')' : '✗ Missing');
console.log('TWITTER_ACCESS_SECRET =', process.env.TWITTER_ACCESS_SECRET ? '✓ Set (length: ' + process.env.TWITTER_ACCESS_SECRET.length + ')' : '✗ Missing');
console.log('');

// Check simulation logic (same as route.ts line 88)
const simulate = String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false';
console.log('Simulation Check:');
console.log('String(process.env.SIMULATE_TWITTER) =', String(process.env.SIMULATE_TWITTER));
console.log('.toLowerCase() =', String(process.env.SIMULATE_TWITTER).toLowerCase());
console.log('!== "false" =', String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false');
console.log('');
console.log('🎯 RESULT: simulate =', simulate);
console.log('');

if (simulate) {
  console.log('❌ Tweets will be SIMULATED (not posted to real Twitter)');
} else {
  console.log('✅ Tweets will be POSTED TO REAL TWITTER');
}

console.log('\n=== All Keys Present? ===');
const key = process.env.TWITTER_CONSUMER_KEY;
const secret = process.env.TWITTER_CONSUMER_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_SECRET;

if (!key || !secret || !accessToken || !accessSecret) {
  console.log('❌ Missing Twitter API keys');
} else {
  console.log('✅ All Twitter API keys are present');
}
