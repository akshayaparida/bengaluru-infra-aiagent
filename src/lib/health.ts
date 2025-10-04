import net from 'node:net';

export type PgClientLike = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
};

export type CreatePgClient = () => PgClientLike;
export type TcpConnect = (host: string, port: number, timeoutMs?: number) => Promise<void>;

function withTimeout<T>(p: Promise<T>, ms = 1000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => {
      clearTimeout(to);
      resolve(v);
    }).catch((e) => {
      clearTimeout(to);
      reject(e);
    });
  });
}

// TCP connect helper used for Mailpit and as a fallback PG check
export const defaultTcpConnect: TcpConnect = (host, port, timeoutMs = 1000) =>
  new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    const onError = (err?: Error) => {
      cleanup();
      reject(err || new Error('tcp error'));
    };
    const onConnect = () => {
      cleanup();
      // immediately destroy after connect success
      socket.destroy();
      resolve();
    };
    const onTimeout = () => onError(new Error('tcp timeout'));
    const cleanup = () => {
      socket.removeListener('error', onError);
      socket.removeListener('connect', onConnect);
      socket.removeListener('timeout', onTimeout);
    };
    socket.setTimeout(timeoutMs);
    socket.once('error', onError);
    socket.once('connect', onConnect);
    socket.once('timeout', onTimeout);
    socket.connect(port, host);
  });

export async function checkPostgres(createClient: CreatePgClient, timeoutMs = 1000): Promise<boolean> {
  try {
    const client = createClient();
    await withTimeout(client.connect(), timeoutMs);
    await withTimeout(client.end(), timeoutMs);
    return true;
  } catch {
    return false;
  }
}

export async function checkMailpit(host: string, port: number, tcpConnect: TcpConnect = defaultTcpConnect, timeoutMs = 1000): Promise<boolean> {
  try {
    await tcpConnect(host, port, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

export async function checkMcp(baseUrl: string, fetchFn: typeof fetch = fetch, timeoutMs = 1000): Promise<boolean> {
  if (!baseUrl) return false;
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetchFn(baseUrl, { method: 'HEAD', signal: ctrl.signal }).catch(() => fetchFn(baseUrl, { method: 'GET', signal: ctrl.signal }));
    clearTimeout(id);
    return !!res && res.ok === true;
  } catch {
    return false;
  }
}

export async function getHealthStatus(opts: {
  createPgClient: CreatePgClient;
  mailpitHost: string;
  mailpitPort: number;
  mcpBaseUrl: string;
  tcpConnect?: TcpConnect;
  fetchFn?: typeof fetch;
}) {
  const { createPgClient, mailpitHost, mailpitPort, mcpBaseUrl, tcpConnect = defaultTcpConnect, fetchFn = fetch } = opts;

  const [pg, mp, mcp] = await Promise.all([
    checkPostgres(createPgClient),
    checkMailpit(mailpitHost, mailpitPort, tcpConnect),
    checkMcp(mcpBaseUrl, fetchFn),
  ]);

  const allOk = pg && mp && mcp;
  return {
    status: allOk ? 'ok' : 'degraded',
    services: {
      web: true,
      postgres: pg,
      mailpit: mp,
      mcp,
    },
    timestamp: new Date().toISOString(),
  } as const;
}

// Utility: create a PG-like client using a raw TCP probe (no pg dependency needed)
export function createPgTcpClientFromEnv(): PgClientLike {
  const url = process.env.DATABASE_URL || '';
  let host = 'localhost';
  let port = 5432;
  try {
    if (url) {
      const u = new URL(url);
      host = u.hostname || host;
      port = Number(u.port || port);
    }
  } catch {
    // ignore parse errors, keep defaults
  }
  let connected = false;
  return {
    connect: async () => {
      await defaultTcpConnect(host, port, 1000);
      connected = true;
    },
    end: async () => {
      // nothing to do for TCP probe
      connected = false;
    },
  };
}