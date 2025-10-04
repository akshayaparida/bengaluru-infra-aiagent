import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { classifyViaMcp } from '../../../../../lib/classify';
import { getAIUsageLimiter } from '../../../../../lib/ai-usage-limiter';

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
    
    // Check AI usage limit to control costs
    const aiLimiter = await getAIUsageLimiter();
    const canUseAI = await aiLimiter.canUseAI();

    // Try MCP first (if within daily limit); on failure or limit reached, fall back to simulated
    let category = 'traffic';
    let severity = 'medium';
    let simulated = false;
    
    if (canUseAI) {
      try {
        const via = await classifyViaMcp(report.description, mcpBaseUrl);
        category = via.category;
        severity = via.severity;
        simulated = via.simulated;
        
        // Record usage only if AI classification succeeded
        if (!simulated) {
          await aiLimiter.recordUsage();
        }
      } catch {
        const sim = classifySimulatedLocal(report.description);
        category = sim.category;
        severity = sim.severity;
        simulated = true;
      }
    } else {
      // Daily AI limit reached, use simulated classification
      console.log('AI daily limit reached, using simulated classification');
      const sim = classifySimulatedLocal(report.description);
      category = sim.category;
      severity = sim.severity;
      simulated = true;
    }

    await prisma.report.update({ where: { id }, data: { category, severity } });

    return NextResponse.json({ ok: true, category, severity, simulated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}