import { NextResponse } from "next/server";
import { getHealthStatus, createPgTcpClientFromEnv } from "@/lib/health";

export async function GET() {
  const mailpitHost = process.env.SMTP_HOST || "localhost";
  const mailpitPort = Number(process.env.SMTP_PORT || 1025);
  const mcpBaseUrl = process.env.MCP_BASE_URL || "";

  const result = await getHealthStatus({
    createPgClient: createPgTcpClientFromEnv,
    mailpitHost,
    mailpitPort,
    mcpBaseUrl,
  });

  return NextResponse.json({
    status: result.status,
    services: result.services,
    time: result.timestamp,
  });
}
