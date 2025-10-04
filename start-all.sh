#!/bin/bash
# Startup script to run both Next.js server and MCP Gateway (AI)
# Usage: ./start-all.sh

set -e

echo "🚀 Starting Bengaluru Infra AI Agent..."
echo ""

# Load environment variables (using dotenv-style parsing)
# This handles values with spaces, #, and special characters
load_env() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        while IFS='=' read -r key value; do
            # Skip empty lines and comments
            [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
            # Remove leading/trailing whitespace from key
            key=$(echo "$key" | xargs)
            # Export the variable
            export "$key=$value"
        done < <(grep -v '^[[:space:]]*$' "$env_file")
    fi
}

load_env .env.local
load_env .env

# Check if Cerebras API key is set
if [ -z "$CEREBRAS_API_KEY" ]; then
    echo "⚠️  Warning: CEREBRAS_API_KEY not found in .env or .env.local"
    echo "   MCP Gateway (AI features) will not work properly"
fi

# Kill any existing processes
echo "🧹 Cleaning up any existing processes..."
pkill -f "node mcp-gateway/server.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 1

# Create logs directory
mkdir -p logs

# Start MCP Gateway (AI service) in background
echo "🤖 Starting MCP Gateway (AI service) on port ${PORT:-8008}..."
PORT=${PORT:-8008} node mcp-gateway/server.js > logs/mcp-gateway.log 2>&1 &
MCP_PID=$!
echo "   ✅ MCP Gateway started (PID: $MCP_PID)"
echo "   📝 Logs: logs/mcp-gateway.log"

# Wait a moment for MCP Gateway to start
sleep 2

# Verify MCP Gateway is running
if curl -s http://localhost:${PORT:-8008}/health > /dev/null; then
    echo "   ✅ MCP Gateway health check passed"
else
    echo "   ⚠️  MCP Gateway health check failed (will use fallback templates)"
fi

echo ""

# Start Next.js development server
echo "⚡ Starting Next.js server on port 3000..."
pnpm dev > logs/nextjs.log 2>&1 &
NEXT_PID=$!
echo "   ✅ Next.js started (PID: $NEXT_PID)"
echo "   📝 Logs: logs/nextjs.log"

# Wait for Next.js to be ready
echo ""
echo "⏳ Waiting for Next.js to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "   ✅ Next.js is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services started successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Next.js App:       http://localhost:3000"
echo "🤖 MCP Gateway (AI):  http://localhost:${PORT:-8008}"
echo ""
echo "📊 Service Status:"
echo "   MCP Gateway PID:   $MCP_PID"
echo "   Next.js PID:       $NEXT_PID"
echo ""
echo "📝 View Logs:"
echo "   MCP Gateway:       tail -f logs/mcp-gateway.log"
echo "   Next.js:           tail -f logs/nextjs.log"
echo ""
echo "🛑 Stop All Services:"
echo "   ./stop-all.sh"
echo "   OR: pkill -f 'next dev|mcp-gateway'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Ready! Open http://localhost:3000 in your browser"
echo ""

# Keep script running to show logs
echo "Press Ctrl+C to stop all services and view logs..."
echo ""
trap "echo ''; echo '🛑 Stopping all services...'; pkill -f 'next dev'; pkill -f 'node mcp-gateway/server.js'; echo '✅ All services stopped'; exit 0" INT TERM

# Show live logs from both services
tail -f logs/nextjs.log logs/mcp-gateway.log
