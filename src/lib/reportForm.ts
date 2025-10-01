export function buildReportFormData(args: { description: string; lat: number; lng: number; file: File }) {
  const fd = new FormData();
  fd.set('description', args.description);
  fd.set('lat', String(args.lat));
  fd.set('lng', String(args.lng));
  fd.set('photo', args.file);
  return fd;
}