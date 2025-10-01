import { describe, it, expect } from 'vitest';

// TDD: we define the contract for building multipart form data for reports.
// The helper will live in src/lib/reportForm.ts and be named buildReportFormData.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ReportForm from '../../src/lib/reportForm';

function fdEntries(fd: FormData) {
  const out: Record<string, any> = {};
  for (const [k, v] of fd.entries()) {
    // Represent File by its name/type for assertions
    if (v instanceof File) out[k] = { name: v.name, type: v.type };
    else out[k] = v;
  }
  return out;
}

describe('buildReportFormData (TDD)', () => {
  it('creates multipart form with description, lat, lng, and photo', async () => {
    // @ts-expect-error helper will be added soon
    const { buildReportFormData }: typeof ReportForm = await import('../../src/lib/reportForm');
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const fd = buildReportFormData({ description: 'Pothole at cross', lat: 12.97, lng: 77.59, file });
    const entries = fdEntries(fd);
    expect(entries.description).toBe('Pothole at cross');
    expect(entries.lat).toBe('12.97');
    expect(entries.lng).toBe('77.59');
    expect(entries.photo).toEqual({ name: 'photo.jpg', type: 'image/jpeg' });
  });
});