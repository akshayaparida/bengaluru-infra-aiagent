export type Classification = { category: string; severity: string; simulated: boolean };

export const DEFAULT_CATEGORIES = ['pothole', 'streetlight', 'garbage', 'water-leak', 'tree', 'traffic'];
export const DEFAULT_SEVERITIES = ['low', 'medium', 'high'];

export async function classifySimulated(description: string): Promise<Classification> {
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

  return { category, severity, simulated: true };
}

// Minimal MCP call through Docker MCP Gateway. The gateway is expected to expose
// a tool endpoint for classification. We keep the contract narrow and robust.
export async function classifyViaMcp(
  description: string,
  mcpBaseUrl: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 4000,
): Promise<Classification> {
  if (!mcpBaseUrl) throw new Error('mcp_base_url_missing');

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchFn(`${mcpBaseUrl.replace(/\/$/, '')}/tools/classify.report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: ctrl.signal,
    } as any);
    clearTimeout(id);
    if (!res || !(res as any).ok) throw new Error('mcp_http_error');
    const data: any = await (res as any).json();

    const cat = String(data?.category || '').toLowerCase();
    const sev = String(data?.severity || '').toLowerCase();

    const category = DEFAULT_CATEGORIES.includes(cat) ? cat : 'traffic';
    const severity = DEFAULT_SEVERITIES.includes(sev) ? sev : 'medium';

    return { category, severity, simulated: false };
  } catch (err) {
    clearTimeout(id);
    throw err instanceof Error ? err : new Error('mcp_error');
  }
}
