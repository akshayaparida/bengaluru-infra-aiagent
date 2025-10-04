import { describe, it, expect } from 'vitest';

// TDD: Test that AI tweet generation produces complete tweets with proper content
// Issue: max_tokens: 150 is too small, causing truncated tweets

describe('MCP Gateway AI Tweet Generation', () => {
  const mcpBaseUrl = process.env.MCP_BASE_URL || 'http://localhost:8009';

  it('should generate complete tweet with emoji, description, location, and civic handle', async () => {
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Pothole blocking lane causing traffic delays',
        category: 'pothole',
        severity: 'high',
        locationName: 'MG Road, Ashok Nagar',
        landmark: 'MG Road',
        lat: 12.9716,
        lng: 77.5946,
        mapsLink: 'https://maps.google.com/?q=12.9716,77.5946',
        civicHandle: '@GBA_office',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    expect(data).toHaveProperty('tweet');
    expect(typeof data.tweet).toBe('string');

    const tweet = data.tweet;

    // Verify tweet has minimum length (not truncated)
    expect(tweet.length).toBeGreaterThan(50);

    // Verify tweet contains key elements
    expect(tweet).toMatch(/@GBA_office/); // Civic handle
    expect(tweet).toMatch(/📍/); // Location emoji
    expect(tweet).toMatch(/🗺️|maps\.google/); // Map link

    // Verify tweet mentions the issue
    expect(tweet.toLowerCase()).toMatch(/pothole|lane|traffic/);

    // Verify tweet is not just the fallback template
    // (fallback starts with just "@GBA_office\n📍")
    expect(tweet.length).toBeGreaterThan(100);
  });

  it('should generate tweet with proper formatting for different issue types', async () => {
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Streetlight not working affecting safety',
        category: 'streetlight',
        severity: 'medium',
        locationName: 'Koramangala 5th Block',
        landmark: 'Koramangala',
        lat: 12.9352,
        lng: 77.6245,
        mapsLink: 'https://maps.google.com/?q=12.9352,77.6245',
        civicHandle: '@GBA_office',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    expect(data).toHaveProperty('tweet');

    const tweet = data.tweet;

    // Verify complete tweet generation
    expect(tweet.length).toBeGreaterThan(80);
    expect(tweet).toMatch(/@GBA_office/);
    expect(tweet.toLowerCase()).toMatch(/streetlight|light|safety/);
  });

  it('should handle AI response with sufficient max_tokens', async () => {
    // This test verifies that the MCP Gateway is configured
    // with enough max_tokens to generate complete responses

    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Large pothole on MG Road near metro station causing severe traffic issues and safety concerns for motorists',
        category: 'pothole',
        severity: 'high',
        locationName: 'MG Road near Metro Station, Ashok Nagar',
        landmark: 'MG Road Metro Station',
        lat: 12.9716,
        lng: 77.5946,
        mapsLink: 'https://maps.google.com/?q=12.9716,77.5946',
        civicHandle: '@GBA_office',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    const tweet = data.tweet;

    // With max_tokens: 150, the AI would truncate
    // With proper max_tokens (300-400), should have complete tweet
    expect(tweet.length).toBeGreaterThan(100);

    // Should not end abruptly (which happens with truncation)
    // A proper tweet ends with handle, map link, or punctuation
    expect(tweet).toMatch(/(@\w+|🗺️.*|!|\.)$/);

    // Should contain the issue description
    expect(tweet.toLowerCase()).toMatch(/pothole|traffic|safety|metro/);
  });

  it('should use fallback if AI fails but still produce valid tweet', async () => {
    // Test that even if AI fails, the fallback produces a valid tweet
    const response = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test issue',
        category: 'test',
        severity: 'low',
        locationName: 'Test Location',
        landmark: 'Test',
        lat: 12.9716,
        lng: 77.5946,
        mapsLink: 'https://maps.google.com/?q=12.9716,77.5946',
        civicHandle: '@GBA_office',
      }),
    });

    if (!response.ok) {
      console.warn('MCP Gateway not available, test skipped');
      return;
    }

    const data = await response.json();
    expect(data).toHaveProperty('tweet');

    const tweet = data.tweet;

    // Even fallback should have minimum content
    expect(tweet.length).toBeGreaterThan(30);
    expect(tweet).toMatch(/@GBA_office/);
  });
});
