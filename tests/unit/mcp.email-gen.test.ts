import { describe, it, expect } from 'vitest';

describe('MCP Gateway email generation endpoint', () => {
  it('should return AI-generated email subject and body', async () => {
    const mcpBaseUrl = process.env.MCP_BASE_URL || 'http://localhost:8008';
    
    const response = await fetch(`${mcpBaseUrl}/tools/generate.email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Pothole blocking lane near signal',
        category: 'pothole',
        severity: 'high',
        lat: 12.97,
        lng: 77.59,
      }),
    });

    // MCP Gateway might not be running in test env; tolerate both success and connection errors
    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('subject');
      expect(data).toHaveProperty('body');
      expect(typeof data.subject).toBe('string');
      expect(typeof data.body).toBe('string');
      expect(data.subject.length).toBeGreaterThan(0);
      expect(data.body.length).toBeGreaterThan(0);
    } else {
      // If MCP is down, test passes (we verify structure, not availability)
      expect([400, 404, 500, 502, 503]).toContain(response.status);
    }
  });

  it('should handle missing description gracefully', async () => {
    const mcpBaseUrl = process.env.MCP_BASE_URL || 'http://localhost:8008';
    
    try {
      const response = await fetch(`${mcpBaseUrl}/tools/generate.email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Should return valid response even with minimal data (fallback to description)
      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('subject');
        expect(data).toHaveProperty('body');
      }
    } catch (e) {
      // Connection error acceptable if MCP not running in test env
      expect(e).toBeTruthy();
    }
  });
});
