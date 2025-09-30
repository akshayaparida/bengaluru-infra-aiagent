import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

type BudgetItem = {
  id: string;
  department: string;
  contractor: string;
  budgetLine: string;
  wardId?: number;
  amount: number;
};

async function readBudgets(): Promise<BudgetItem[]> {
  const filePath = path.join(process.cwd(), 'data', 'seed', 'budgets.json');
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json as BudgetItem[];
    return [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const department = url.searchParams.get('department') || '';
    const q = url.searchParams.get('q') || '';

    const all = await readBudgets();
    const items = all.filter((b) => {
      const depOk = department ? b.department === department : true;
      const qOk = q ? (b.budgetLine.toLowerCase().includes(q.toLowerCase()) || b.contractor.toLowerCase().includes(q.toLowerCase())) : true;
      return depOk && qOk;
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}