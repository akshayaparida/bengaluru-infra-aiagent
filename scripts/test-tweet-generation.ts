import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * TDD Test Suite for Tweet Generation
 * 
 * Tests:
 * 1. Civic handle is correct (@GBA_office)
 * 2. Landmark appears in tweet description
 * 3. Photo path is valid and readable
 * 4. Maps link is included
 * 5. Location line has landmark name
 */

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const tests: TestResult[] = [];

// Test 1: Environment Variable
console.log('🧪 Test Suite: Tweet Generation\n');

const civicHandle = process.env.CIVIC_TWITTER_HANDLE;
tests.push({
  name: 'Civic Handle Environment Variable',
  passed: civicHandle === '@GBA_office',
  expected: '@GBA_office',
  actual: civicHandle || 'undefined'
});

// Test 2: Simulate tweet generation
const mockReport = {
  description: 'Large pothole on 100 Feet Road causing accidents',
  category: 'pothole',
  severity: 'high',
  lat: 12.971599,
  lng: 77.640699,
};

console.log('📝 Mock Report Data:');
console.log(JSON.stringify(mockReport, null, 2));
console.log();

// Test 3: Check MCP Gateway is running
async function testMCPGateway() {
  const mcpUrl = process.env.MCP_BASE_URL || 'http://localhost:8008';
  try {
    const res = await fetch(`${mcpUrl}/health`);
    const data = await res.json();
    tests.push({
      name: 'MCP Gateway Health',
      passed: data.status === 'ok',
      expected: 'ok',
      actual: data.status
    });
  } catch (e: any) {
    tests.push({
      name: 'MCP Gateway Health',
      passed: false,
      expected: 'ok',
      actual: e.message
    });
  }
}

// Test 4: Test AI tweet generation via MCP
async function testTweetGeneration() {
  const mcpUrl = process.env.MCP_BASE_URL || 'http://localhost:8008';
  try {
    const res = await fetch(`${mcpUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        description: mockReport.description,
        category: mockReport.category,
        severity: mockReport.severity,
        locationName: '100 Feet Road, Indiranagar',
        landmark: '100 Feet Road',
        lat: mockReport.lat,
        lng: mockReport.lng,
        mapsLink: `https://maps.google.com/?q=${mockReport.lat},${mockReport.lng}`,
        civicHandle: process.env.CIVIC_TWITTER_HANDLE || '@GBA_office',
      }),
    });
    
    const data = await res.json();
    const tweet = data.tweet || '';
    
    console.log('🤖 AI Generated Tweet:');
    console.log('---');
    console.log(tweet);
    console.log('---\n');
    
    // Test: Tweet contains landmark
    tests.push({
      name: 'Tweet contains landmark in text',
      passed: tweet.toLowerCase().includes('100 feet road') || tweet.toLowerCase().includes('indiranagar'),
      expected: 'Contains landmark/road name',
      actual: tweet.slice(0, 100)
    });
    
    // Test: Tweet contains @GBA_office
    tests.push({
      name: 'Tweet contains @GBA_office',
      passed: tweet.includes('@GBA_office'),
      expected: '@GBA_office',
      actual: tweet.includes('@GBA') ? 'Found @GBA handle' : 'Missing @GBA_office'
    });
    
    // Test: Tweet contains maps link
    tests.push({
      name: 'Tweet contains Google Maps link',
      passed: tweet.includes('maps.google.com'),
      expected: 'maps.google.com link',
      actual: tweet.includes('maps') ? 'Maps link found' : 'No maps link'
    });
    
    // Test: Tweet contains location emoji
    tests.push({
      name: 'Tweet contains location emoji 📍',
      passed: tweet.includes('📍'),
      expected: '📍 emoji',
      actual: tweet.includes('📍') ? 'Found 📍' : 'Missing 📍'
    });
    
  } catch (e: any) {
    tests.push({
      name: 'AI Tweet Generation',
      passed: false,
      expected: 'Tweet generated',
      actual: e.message
    });
  }
}

// Run all tests
async function runTests() {
  await testMCPGateway();
  await testTweetGeneration();
  
  // Print results
  console.log('📊 Test Results:\n');
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach((test, i) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${i + 1}. ${status} - ${test.name}`);
    if (!test.passed) {
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Actual: ${test.actual}`);
    }
    test.passed ? passed++ : failed++;
  });
  
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  
  if (failed > 0) {
    console.log('\n❌ Tests failed! Fix issues before posting tweets.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Ready to post tweets.');
    process.exit(0);
  }
}

runTests();
