#!/bin/bash
# Stop all services (Next.js and MCP Gateway)
# Usage: ./stop-all.sh

echo "🛑 Stopping all services..."
echo ""

# Stop Next.js
if pkill -f "next dev"; then
    echo "✅ Next.js server stopped"
else
    echo "ℹ️  Next.js was not running"
fi

# Stop MCP Gateway
if pkill -f "node mcp-gateway/server.js"; then
    echo "✅ MCP Gateway stopped"
else
    echo "ℹ️  MCP Gateway was not running"
fi

echo ""
echo "✅ All services stopped successfully!"
echo ""
