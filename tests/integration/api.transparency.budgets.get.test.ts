import { describe, it, expect } from 'vitest';

// TDD: budgets endpoint should return seeded demo data and support simple filtering
// It should export: export async function GET(req: Request)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as BudgetsRoute from '../../src/app/api/transparency/budgets/route';

describe('GET /api/transparency/budgets (TDD)', () => {
  it('returns an array of budget items', async () => {
    const { GET }: typeof BudgetsRoute = await import('../../src/app/api/transparency/budgets/route');
    const res = await GET(new Request('http://localhost/api/transparency/budgets') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const one = body.items[0];
    expect(one).toHaveProperty('department');
    expect(one).toHaveProperty('contractor');
    expect(one).toHaveProperty('budgetLine');
  });

  it('supports department filter', async () => {
    const { GET }: typeof BudgetsRoute = await import('../../src/app/api/transparency/budgets/route');
    const res = await GET(new Request('http://localhost/api/transparency/budgets?department=Roads') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.every((x: any) => x.department === 'Roads')).toBe(true);
  });
});