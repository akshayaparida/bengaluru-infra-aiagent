import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Inline simulated classifier to avoid module resolution issues during tests
function classifySimulatedLocal(description: string) {
  const text = description.toLowerCase();
  let category = 'traffic';
  if (text.includes('pothole')) category = 'pothole';
  else if (text.includes('light')) category = 'streetlight';
  else if (text.includes('garbage') || text.includes('trash')) category = 'garbage';
  else if (text.includes('water') || text.includes('leak')) category = 'water-leak';
  else if (text.includes('tree')) category = 'tree';
  let severity = 'medium';
  if (text.includes('major') || text.includes('huge') || text.includes('severe')) severity = 'high';
  else if (text.includes('small') || text.includes('minor')) severity = 'low';
  return { category, severity, simulated: true } as const;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const enabled = String(process.env.ENABLE_CLASSIFICATION).toLowerCase() === 'true';

    if (!enabled) {
      // return a simulated response but do not update DB when disabled
      const sim = classifySimulatedLocal(report.description);
      return NextResponse.json({ ok: true, simulated: true, category: sim.category, severity: sim.severity }, { status: 202 });
    }

    const mcpBaseUrl = process.env.MCP_BASE_URL || '';
    const cls = classifySimulatedLocal(report.description);

    await prisma.report.update({ where: { id }, data: { category: cls.category, severity: cls.severity } });

    return NextResponse.json({ ok: true, category: cls.category, severity: cls.severity, simulated: cls.simulated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}