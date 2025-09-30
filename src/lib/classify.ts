export type Classification = { category: string; severity: string; simulated: boolean };

const DEFAULT_CATEGORIES = ['pothole', 'streetlight', 'garbage', 'water-leak', 'tree', 'traffic'];
const DEFAULT_SEVERITIES = ['low', 'medium', 'high'];

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

// Placeholder for future MCP call
export async function classifyViaMcp(description: string, _mcpBaseUrl: string): Promise<Classification> {
  // For POC, just call simulated
  return classifySimulated(description);
}