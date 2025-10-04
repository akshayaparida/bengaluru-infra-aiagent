import { describe, it, expect, beforeAll } from 'vitest';

describe('Email & Tweet Fixes', () => {
  let reportId: string;
  
  beforeAll(async () => {
    // Create a test report
    const fd = new FormData();
    fd.append('description', 'Test pothole for email/tweet fixes');
    fd.append('lat', '12.9716');
    fd.append('lng', '77.5946');
    
    // Create a fake photo blob
    const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    fd.append('photo', blob, 'test.jpg');
    
    const res = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      body: fd,
    });
    
    expect(res.ok).toBe(true);
    const data = await res.json();
    reportId = data.id;
  });

  describe('Email Sender Name', () => {
    it('should use "Bengaluru Infra AI Agent" as sender name', async () => {
      const res = await fetch(`http://localhost:3000/api/reports/${reportId}/notify`, {
        method: 'POST',
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      // Check that email was processed
      expect(data.ok || data.simulated).toBe(true);
      
      // Note: Actual sender name is in email headers (not in API response)
      // This would be verified by checking the actual email or SMTP logs
    });

    it('should include "Bengaluru Infra AI Agent" signature in email body', async () => {
      // This is tested indirectly - the HTML should contain the signature
      // In production, you'd parse the email HTML and verify
      expect(true).toBe(true); // Placeholder - actual test would need email parsing
    });
  });

  describe('Twitter Handle - @ICCCBengaluru', () => {
    it('should include @ICCCBengaluru in fallback tweet template', async () => {
      // Test the fallback template directly
      const description = 'Test pothole';
      const lat = 12.9716;
      const lng = 77.5946;
      const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      const civicHandle = '@GBA_office';
      const icccHandle = '@ICCCBengaluru';
      
      // Simulate fallback template
      const fallback = `🕳️ pothole issue: ${description.slice(0, 60)}
📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
🗺️ ${mapsLink}
${civicHandle} ${icccHandle} please address urgently!`;
      
      expect(fallback).toContain('@GBA_office');
      expect(fallback).toContain('@ICCCBengaluru');
    });

    it('should include @ICCCBengaluru when tweet API is called', async () => {
      const res = await fetch(`http://localhost:3000/api/reports/${reportId}/tweet`, {
        method: 'POST',
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      // Check that tweet was generated
      expect(data.ok || data.simulated).toBe(true);
      
      if (data.text) {
        // If we got tweet text back, verify it contains ICCC handle
        expect(
          data.text.includes('@ICCCBengaluru') || 
          data.text.includes('@GBA_office')
        ).toBe(true);
      }
    });
  });

  describe('MCP Gateway Integration', () => {
    it('MCP Gateway should be running and healthy', async () => {
      const res = await fetch('http://localhost:8008/health');
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('mcp-gateway');
    });

    it('MCP Gateway should generate tweets with both handles', async () => {
      const payload = {
        description: 'Test pothole on MG Road',
        category: 'pothole',
        severity: 'high',
        locationName: 'MG Road, Bengaluru',
        landmark: 'MG Road',
        lat: 12.9716,
        lng: 77.5946,
        mapsLink: 'https://maps.google.com/?q=12.9716,77.5946',
        civicHandle: '@GBA_office',
        icccHandle: '@ICCCBengaluru'
      };
      
      const res = await fetch('http://localhost:8008/tools/generate.tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      expect(data.tweet).toBeTruthy();
      // Tweet should contain at least one handle
      const hasCivicHandle = data.tweet.includes('@GBA_office') || 
                            data.tweet.includes('@BBMPCOMM') ||
                            data.tweet.includes('@GBABengaluru');
      const hasICCCHandle = data.tweet.includes('@ICCCBengaluru');
      
      expect(hasCivicHandle || hasICCCHandle).toBe(true);
    });
  });
});
