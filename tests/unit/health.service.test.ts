import { describe, it, expect, vi } from 'vitest';

// TDD-first: we write tests against a health service module we will implement next.
// The module will live at src/lib/health.ts and expose small checkers plus an aggregator.
// For now, we import it; tests will fail until the module is implemented.
import type { PgClientLike, CreatePgClient, TcpConnect } from '../../src/lib/health';
import { checkPostgres, checkMailpit, checkMcp, getHealthStatus } from '../../src/lib/health';

const makePgClientOk = (): PgClientLike => ({
  connect: vi.fn().mockResolvedValue(undefined),
  end: vi.fn().mockResolvedValue(undefined),
});

const makePgClientFail = (): PgClientLike => ({
  connect: vi.fn().mockRejectedValue(new Error('connect failed')),
  end: vi.fn().mockResolvedValue(undefined),
});

describe('health service - postgres', () => {
  it('returns true when client connects and closes cleanly', async () => {
    const createClient: CreatePgClient = () => makePgClientOk();
    const ok = await checkPostgres(createClient, 500);
    expect(ok).toBe(true);
  });

  it('returns false when client connect throws', async () => {
    const createClient: CreatePgClient = () => makePgClientFail();
    const ok = await checkPostgres(createClient, 500);
    expect(ok).toBe(false);
  });
});

describe('health service - mailpit (smtp)', () => {
  it('returns true when TCP connect succeeds', async () => {
    const tcpConnect: TcpConnect = vi.fn().mockResolvedValue(undefined);
    const ok = await checkMailpit('localhost', 1025, tcpConnect, 500);
    expect(ok).toBe(true);
  });

  it('returns false when TCP connect fails', async () => {
    const tcpConnect: TcpConnect = vi.fn().mockRejectedValue(new Error('tcp fail'));
    const ok = await checkMailpit('localhost', 1025, tcpConnect, 500);
    expect(ok).toBe(false);
  });
});

describe('health service - mcp gateway', () => {
  it('returns true when HTTP fetch returns ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    const ok = await checkMcp('http://localhost:8008', fetchFn as any, 500);
    expect(ok).toBe(true);
  });

  it('returns false when HTTP fetch fails or not ok', async () => {
    const fetchReject = vi.fn().mockRejectedValue(new Error('fetch fail'));
    const ok1 = await checkMcp('http://localhost:8008', fetchReject as any, 500);
    expect(ok1).toBe(false);

    const fetchNotOk = vi.fn().mockResolvedValue({ ok: false });
    const ok2 = await checkMcp('http://localhost:8008', fetchNotOk as any, 500);
    expect(ok2).toBe(false);
  });
});

describe('health service - aggregate', () => {
  it('aggregates individual checks and returns structured readiness', async () => {
    const createClient: CreatePgClient = () => makePgClientOk();
    const tcpConnect: TcpConnect = vi.fn().mockResolvedValue(undefined);
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });

    const result = await getHealthStatus({
      createPgClient: createClient,
      mailpitHost: 'localhost',
      mailpitPort: 1025,
      mcpBaseUrl: 'http://localhost:8008',
      tcpConnect,
      fetchFn: fetchFn as any,
    });

    expect(result.status).toBe('ok');
    expect(result.services.web).toBe(true);
    expect(result.services.postgres).toBe(true);
    expect(result.services.mailpit).toBe(true);
    expect(result.services.mcp).toBe(true);
    expect(typeof result.timestamp).toBe('string');
  });
});