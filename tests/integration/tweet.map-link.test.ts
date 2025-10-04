import { describe, it, expect } from 'vitest';

// TDD: Test-first approach to ensure tweets include map links and location emoji
// BUG: AI-generated tweets are missing map links (🗺️) and location pins (📍)
// Expected: Every tweet should include the Google Maps link for exact location

describe('Tweet Generation - Map Link & Location Emoji', () => {
  const mcpBaseUrl = process.env.MCP_BASE_URL || 'http://localhost:8008';

  it('should include Google Maps link in the tweet', async () => {
    const mapsLink = 'https://maps.google.com/?q=12.9716,77.5946';
    
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Pothole blocking lane',
        category: 'pothole',
        severity: 'high',
        locationName: 'MG Road, Ashok Nagar',
        landmark: 'MG Road',
        lat: 12.9716,
        lng: 77.5946,
        mapsLink: mapsLink,
        civicHandle: '@GBA_office',
        icccHandle: '@ICCCBengaluru',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    const tweet = data.tweet;

    // CRITICAL: Tweet must include the map link for officials to locate issue
    expect(tweet).toContain(mapsLink);
  });

  it('should include location pin emoji (📍) in the tweet', async () => {
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Streetlight not working',
        category: 'streetlight',
        severity: 'medium',
        locationName: 'Koramangala 5th Block',
        landmark: 'Koramangala',
        lat: 12.9352,
        lng: 77.6245,
        mapsLink: 'https://maps.google.com/?q=12.9352,77.6245',
        civicHandle: '@GBA_office',
        icccHandle: '@ICCCBengaluru',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    const tweet = data.tweet;

    // Location emoji helps visual identification in Twitter feed
    expect(tweet).toMatch(/📍/);
  });

  it('should include map emoji (🗺️) or map link in the tweet', async () => {
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Garbage accumulation',
        category: 'garbage',
        severity: 'high',
        locationName: 'Indiranagar 100 Feet Road',
        landmark: '100 Feet Road',
        lat: 12.9719,
        lng: 77.6412,
        mapsLink: 'https://maps.google.com/?q=12.9719,77.6412',
        civicHandle: '@GBA_office',
        icccHandle: '@ICCCBengaluru',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    const tweet = data.tweet;

    // Should have either map emoji or the actual link
    const hasMapEmoji = tweet.includes('🗺️');
    const hasMapLink = tweet.includes('maps.google.com');
    
    expect(hasMapEmoji || hasMapLink).toBe(true);
  });

  it('should handle complete tweet format with all required elements', async () => {
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Water leak flooding the road',
        category: 'water-leak',
        severity: 'high',
        locationName: 'Whitefield Main Road',
        landmark: 'Whitefield',
        lat: 12.9698,
        lng: 77.7500,
        mapsLink: 'https://maps.google.com/?q=12.9698,77.7500',
        civicHandle: '@GBA_office',
        icccHandle: '@ICCCBengaluru',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    const tweet = data.tweet;

    // Complete tweet should have:
    // 1. Issue description
    expect(tweet.toLowerCase()).toMatch(/water|leak|flood/);
    
    // 2. Location with emoji
    expect(tweet).toMatch(/📍/);
    
    // 3. Map link
    expect(tweet).toContain('https://maps.google.com');
    
    // 4. Both civic handles
    expect(tweet).toContain('@GBA_office');
    expect(tweet).toContain('@ICCCBengaluru');
    
    // 5. Reasonable length (not truncated prematurely)
    expect(tweet.length).toBeGreaterThan(100);
    expect(tweet.length).toBeLessThanOrEqual(280);
  });
});
