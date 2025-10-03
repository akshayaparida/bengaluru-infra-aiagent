#!/bin/bash
# Start MCP Gateway with CEREBRAS_API_KEY from .env.local

cd "$(dirname "$0")"

# Load CEREBRAS_API_KEY from .env.local
export CEREBRAS_API_KEY=$(grep "^CEREBRAS_API_KEY=" .env.local | cut -d'=' -f2)

if [ -z "$CEREBRAS_API_KEY" ]; then
  echo "❌ CEREBRAS_API_KEY not found in .env.local"
  exit 1
fi

echo "✓ Found CEREBRAS_API_KEY"
echo "Starting MCP Gateway on port 8008..."

# Kill any existing process on port 8008
lsof -ti:8008 | xargs kill -9 2>/dev/null || true
sleep 1

# Start MCP Gateway
cd mcp-gateway
node server.js
