#!/bin/bash
# Test AI Tweet Generation

echo "=== Testing AI Tweet Generation ==="
echo ""

echo "1. Checking MCP Gateway Health..."
curl -s http://localhost:8008/health | jq .
echo ""

echo "2. Testing MCP Tweet Endpoint..."
curl -s -X POST http://localhost:8008/tools/generate.tweet \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Large pothole causing traffic issues",
    "category": "pothole",
    "severity": "high",
    "locationName": "MG Road, Bengaluru",
    "landmark": "Trinity Circle",
    "lat": 12.9716,
    "lng": 77.5946,
    "mapsLink": "https://maps.google.com/?q=12.9716,77.5946",
    "civicHandle": "@GBA_office",
    "icccHandle": "@ICCCBengaluru"
  }' | jq .
echo ""

echo "3. Checking Environment Variables..."
echo "MCP_BASE_URL: $MCP_BASE_URL"
echo "AI_DAILY_LIMIT: $AI_DAILY_LIMIT"
echo ""

echo "=== Test Complete ==="
echo ""
echo "If MCP Gateway returned a tweet, AI generation is working!"
echo "If Next.js tweet API still fails:"
echo "  1. Stop Next.js (Ctrl+C)"
echo "  2. Run: pnpm dev"
echo "  3. Try submitting a report again"
