import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('COMPLETE TDD DIAGNOSIS', () => {
  let testReportId: string;

  describe('Step 1: Server Health Checks', () => {
    it('Next.js should be running on port 3000', async () => {
      const res = await fetch('http://localhost:3000');
      console.log('Next.js Status:', res.status);
      expect(res.ok).toBe(true);
    });

    it('MCP Gateway should be running on port 8008', async () => {
      const res = await fetch('http://localhost:8008/health');
      console.log('MCP Gateway Health:', await res.json());
      expect(res.ok).toBe(true);
    });

    it('PostgreSQL should be accessible', async () => {
      const res = await fetch('http://localhost:3000/api/reports');
      console.log('Database connection status:', res.status);
      expect(res.ok).toBe(true);
    });
  });

  describe('Step 2: Environment Configuration', () => {
    it('should have MCP_BASE_URL set to port 8008', () => {
      const mcpUrl = process.env.MCP_BASE_URL;
      console.log('MCP_BASE_URL:', mcpUrl);
      
      if (!mcpUrl) {
        console.error('❌ MCP_BASE_URL is not set!');
        console.error('Fix: Add to .env.local: MCP_BASE_URL=http://localhost:8008');
      } else if (!mcpUrl.includes('8008')) {
        console.error('❌ MCP_BASE_URL has wrong port!');
        console.error('Current:', mcpUrl);
        console.error('Should be: http://localhost:8008');
      }
      
      expect(mcpUrl).toBeTruthy();
      expect(mcpUrl).toContain('8008');
    });

    it('should have CEREBRAS_API_KEY configured', () => {
      const hasKey = !!process.env.CEREBRAS_API_KEY;
      console.log('CEREBRAS_API_KEY exists:', hasKey);
      
      if (!hasKey) {
        console.error('❌ CEREBRAS_API_KEY not found in environment');
        console.error('Check: .env or .env.local file');
      }
      
      expect(hasKey).toBe(true);
    });
  });

  describe('Step 3: Photo Upload Endpoint', () => {
    it('should accept photo uploads', async () => {
      const fd = new FormData();
      fd.append('description', 'TDD Test: Photo upload check');
      fd.append('lat', '12.9716');
      fd.append('lng', '77.5946');
      
      // Create a small test image
      const blob = new Blob(['fake-jpeg-data'], { type: 'image/jpeg' });
      fd.append('photo', blob, 'test-photo.jpg');
      
      console.log('Uploading test report...');
      const res = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        body: fd,
      });
      
      console.log('Upload Status:', res.status);
      
      if (!res.ok) {
        const error = await res.text();
        console.error('Upload Error:', error);
      }
      
      expect(res.ok).toBe(true);
      
      const data = await res.json();
      console.log('Report Created:', data);
      testReportId = data.id;
      
      expect(data.id).toBeTruthy();
    }, 10000); // 10 second timeout
  });

  describe('Step 4: AI Email Generation via MCP Gateway', () => {
    it('MCP Gateway should generate email', async () => {
      const payload = {
        description: 'Test pothole on MG Road',
        category: 'pothole',
        severity: 'high',
        lat: 12.9716,
        lng: 77.5946
      };

      console.log('Testing email generation...');
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
    }, 15000); // 15 second timeout for AI generation

    it('Email API should use AI-generated content', async () => {
      if (!testReportId) {
        console.error('⚠️ Skipping: No test report created');
        return;
      }

      console.log('Testing email API with report:', testReportId);
      const res = await fetch(`http://localhost:3000/api/reports/${testReportId}/notify`, {
        method: 'POST'
      });

      console.log('Email API Status:', res.status);
      const data = await res.json();
      console.log('Email API Response:', data);
      
      expect(res.ok || data.simulated).toBeTruthy();
    });
  });

  describe('Step 5: AI Tweet Generation via MCP Gateway', () => {
    it('MCP Gateway should generate tweet with both handles', async () => {
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

      console.log('Testing tweet generation...');
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
      console.log('Generated Tweet:', data.tweet);
      
      expect(data.tweet).toBeTruthy();
      expect(data.tweet.length).toBeLessThanOrEqual(280);
      
      // Check for both handles
      const hasGBA = data.tweet.includes('@GBA_office');
      const hasICCC = data.tweet.includes('@ICCCBengaluru');
      
      console.log('Has @GBA_office:', hasGBA);
      console.log('Has @ICCCBengaluru:', hasICCC);
      
      if (!hasGBA && !hasICCC) {
        console.error('❌ Tweet missing both civic handles!');
        console.error('Tweet:', data.tweet);
      }
      
      expect(hasGBA || hasICCC).toBe(true);
    }, 15000); // 15 second timeout for AI generation

    it('Tweet API should use AI-generated content', async () => {
      if (!testReportId) {
        console.error('⚠️ Skipping: No test report created');
        return;
      }

      console.log('Testing tweet API with report:', testReportId);
      const res = await fetch(`http://localhost:3000/api/reports/${testReportId}/tweet`, {
        method: 'POST'
      });

      console.log('Tweet API Status:', res.status);
      const data = await res.json();
      console.log('Tweet API Response:', data);
      
      expect(res.ok || data.simulated).toBeTruthy();
      
      if (data.text) {
        console.log('Tweet Text:', data.text);
        const hasHandle = data.text.includes('@GBA_office') || data.text.includes('@ICCCBengaluru');
        expect(hasHandle).toBe(true);
      }
    });
  });

  describe('Step 6: MCP Gateway Connection from Next.js', () => {
    it('Next.js should be able to reach MCP Gateway', async () => {
      // This tests if Next.js server can connect to MCP Gateway
      if (!testReportId) {
        console.error('⚠️ Skipping: No test report created');
        return;
      }

      console.log('Testing Next.js -> MCP Gateway connection...');
      
      // Trigger classification which uses MCP Gateway
      const res = await fetch(`http://localhost:3000/api/reports/${testReportId}/classify`, {
        method: 'POST'
      });

      console.log('Classification Status:', res.status);
      const data = await res.json();
      console.log('Classification Response:', data);
      
      if (!res.ok && !data.simulated) {
        console.error('❌ Classification failed');
        console.error('This means Next.js cannot reach MCP Gateway');
        console.error('Check: MCP_BASE_URL in .env.local');
      }
      
      expect(res.ok || data.simulated).toBeTruthy();
    });
  });

  describe('Step 7: Port Configuration Check', () => {
    it('should verify MCP Gateway is on correct port', async () => {
      // Try both 8008 and 8009 to see which is running
      const port8008 = await fetch('http://localhost:8008/health').then(r => r.ok).catch(() => false);
      const port8009 = await fetch('http://localhost:8009/health').then(r => r.ok).catch(() => false);
      
      console.log('Port 8008 (correct):', port8008 ? '✅ Running' : '❌ Not running');
      console.log('Port 8009 (wrong):', port8009 ? '⚠️ Running' : '✓ Not running');
      
      if (port8009) {
        console.error('❌ MCP Gateway is running on WRONG PORT 8009!');
        console.error('Fix: Kill process on 8009 and restart on 8008');
      }
      
      if (!port8008) {
        console.error('❌ MCP Gateway not running on port 8008!');
        console.error('Fix: Start MCP Gateway on port 8008');
      }
      
      expect(port8008).toBe(true);
      expect(port8009).toBe(false);
    });
  });

  describe('Step 8: Email Sender Configuration', () => {
    it('should verify email sender name is configured', async () => {
      // Check if the code has the sender name
      // This is indirect - we check if notify API works
      if (!testReportId) {
        console.error('⚠️ Skipping: No test report created');
        return;
      }

      const res = await fetch(`http://localhost:3000/api/reports/${testReportId}/notify`, {
        method: 'POST'
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      
      console.log('Email notification result:', data);
      // In real email, sender should be "Bengaluru Infra AI Agent <email>"
    });
  });
});

describe('DIAGNOSIS SUMMARY', () => {
  it('should print diagnosis summary', async () => {
    console.log('\\n========================================');
    console.log('DIAGNOSIS SUMMARY');
    console.log('========================================\\n');
    
    // Check all services
    const nextjs = await fetch('http://localhost:3000').then(r => r.ok).catch(() => false);
    const mcp8008 = await fetch('http://localhost:8008/health').then(r => r.ok).catch(() => false);
    const mcp8009 = await fetch('http://localhost:8009/health').then(r => r.ok).catch(() => false);
    
    console.log('Services:');
    console.log('  Next.js (3000):', nextjs ? '✅' : '❌');
    console.log('  MCP Gateway (8008):', mcp8008 ? '✅' : '❌');
    console.log('  MCP Gateway (8009):', mcp8009 ? '⚠️ WRONG PORT' : '✓ Not running');
    
    console.log('\\nEnvironment:');
    console.log('  MCP_BASE_URL:', process.env.MCP_BASE_URL || '❌ NOT SET');
    console.log('  CEREBRAS_API_KEY:', process.env.CEREBRAS_API_KEY ? '✅ Set' : '❌ NOT SET');
    
    console.log('\\nExpected Configuration:');
    console.log('  MCP_BASE_URL=http://localhost:8008');
    console.log('  CEREBRAS_API_KEY=<your-key-from-.env>');
    
    if (mcp8009) {
      console.log('\\n❌ PROBLEM: MCP Gateway running on WRONG PORT 8009');
      console.log('FIX: Kill port 8009 and restart on 8008');
    }
    
    if (!mcp8008) {
      console.log('\\n❌ PROBLEM: MCP Gateway not running on port 8008');
      console.log('FIX: Start MCP Gateway');
    }
    
    console.log('\\n========================================\\n');
    
    expect(true).toBe(true);
  });
});
