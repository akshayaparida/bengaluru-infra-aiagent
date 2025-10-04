import { describe, it, expect } from 'vitest';

describe('TDD: AI Generation Diagnosis', () => {
  describe('Step 1: MCP Gateway Health Check', () => {
    it('should have MCP Gateway running', async () => {
      const res = await fetch('http://localhost:8008/health');
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      console.log('MCP Gateway Health:', data);
      
      expect(data.status).toBe('ok');
      expect(data.service).toBe('mcp-gateway');
    });
  });

  describe('Step 2: Environment Variables Check', () => {
    it('should have MCP_BASE_URL configured', () => {
      const mcpUrl = process.env.MCP_BASE_URL;
      console.log('MCP_BASE_URL:', mcpUrl);
      
      expect(mcpUrl).toBeTruthy();
      expect(mcpUrl).toContain('8008');
    });

    it('should have CEREBRAS_API_KEY configured', () => {
      // This test checks if the key exists (not the actual value for security)
      const hasKey = !!process.env.CEREBRAS_API_KEY;
      console.log('CEREBRAS_API_KEY exists:', hasKey);
      
      if (!hasKey) {
        console.error('❌ CEREBRAS_API_KEY is missing!');
        console.error('Fix: Add to .env.local: CEREBRAS_API_KEY=your_key_here');
      }
      
      expect(hasKey).toBe(true);
    });
  });

  describe('Step 3: AI Email Generation Test', () => {
    it('should generate email via MCP Gateway', async () => {
      const payload = {
        description: 'Test pothole on MG Road',
        category: 'pothole',
        severity: 'high',
        lat: 12.9716,
        lng: 77.5946
      };

      const res = await fetch('http://localhost:8008/tools/generate.email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Email Generation Status:', res.status);
      
      if (!res.ok) {
        const error = await res.text();
        console.error('Email Generation Error:', error);
      }
      
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      console.log('Generated Email:', data);
      
      expect(data.subject).toBeTruthy();
      expect(data.body).toBeTruthy();
      expect(data.subject.length).toBeGreaterThan(0);
      expect(data.body.length).toBeGreaterThan(0);
    });
  });

  describe('Step 4: AI Tweet Generation Test', () => {
    it('should generate tweet via MCP Gateway', async () => {
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

      console.log('Tweet Generation Status:', res.status);
      
      if (!res.ok) {
        const error = await res.text();
        console.error('Tweet Generation Error:', error);
      }
      
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      console.log('Generated Tweet:', data);
      
      expect(data.tweet).toBeTruthy();
      expect(data.tweet.length).toBeGreaterThan(0);
      expect(data.tweet.length).toBeLessThanOrEqual(280);
      
      // Should contain at least one civic handle
      const hasHandle = data.tweet.includes('@GBA_office') || 
                       data.tweet.includes('@ICCCBengaluru');
      expect(hasHandle).toBe(true);
    });
  });

  describe('Step 5: Full Integration Test', () => {
    it('should generate email and tweet for a complete report', async () => {
      // First create a report
      const fd = new FormData();
      fd.append('description', 'TDD Test: Large pothole on MG Road');
      fd.append('lat', '12.9716');
      fd.append('lng', '77.5946');
      
      const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
      fd.append('photo', blob, 'test.jpg');
      
      const createRes = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        body: fd
      });
      
      expect(createRes.ok).toBe(true);
      const report = await createRes.json();
      console.log('Report Created:', report.id);
      
      // Test email generation
      const emailRes = await fetch(`http://localhost:3000/api/reports/${report.id}/notify`, {
        method: 'POST'
      });
      
      console.log('Email API Status:', emailRes.status);
      const emailData = await emailRes.json();
      console.log('Email API Response:', emailData);
      
      // Test tweet generation
      const tweetRes = await fetch(`http://localhost:3000/api/reports/${report.id}/tweet`, {
        method: 'POST'
      });
      
      console.log('Tweet API Status:', tweetRes.status);
      const tweetData = await tweetRes.json();
      console.log('Tweet API Response:', tweetData);
      
      expect(emailRes.ok || emailData.simulated).toBeTruthy();
      expect(tweetRes.ok || tweetData.simulated).toBeTruthy();
    });
  });
});
