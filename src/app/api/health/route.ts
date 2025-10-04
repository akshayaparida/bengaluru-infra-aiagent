import { NextResponse } from "next/server";
import { getHealthStatus, createPgTcpClientFromEnv } from "@/lib/health";

export async function GET() {
  const mcpBaseUrl = process.env.MCP_BASE_URL || "";

  const result = await getHealthStatus({
    createPgClient: createPgTcpClientFromEnv,
    mcpBaseUrl,
  });

  return NextResponse.json({
    status: result.status,
    services: result.services,
    time: result.timestamp,
  });
}
