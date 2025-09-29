import { PrismaClient, ReportStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const schema = z.object({
  description: z.string().min(3, 'description too short'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

function sanitizeBaseName(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  return base.length ? base : 'upload';
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const description = form.get('description');
    const lat = form.get('lat');
    const lng = form.get('lng');
    const photo = form.get('photo');

    const parsed = schema.safeParse({ description, lat, lng });
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: 'photo_required' }, { status: 400 });
    }

    // Only allow common image types for POC
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(photo.type)) {
      return NextResponse.json({ error: 'unsupported_media_type' }, { status: 400 });
    }

    const storageDir = process.env.FILE_STORAGE_DIR || path.join(process.cwd(), '.data', 'uploads');
    await ensureDir(storageDir);

    const ext = path.extname(sanitizeBaseName(photo.name)) || (photo.type === 'image/png' ? '.png' : '.jpg');
    const rand = crypto.randomBytes(8).toString('hex');
    const fileName = `${Date.now()}-${rand}${ext}`;
    const fullPath = path.join(storageDir, fileName);

    const buf = Buffer.from(await photo.arrayBuffer());
    await fs.writeFile(fullPath, buf);

    const report = await prisma.report.create({
      data: {
        description: parsed.data.description,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        photoPath: fullPath,
        status: ReportStatus.NEW,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    // Fail safe: return 400 for known bad requests, 500 otherwise
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    let limit = Number(limitParam ?? '50');
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 100) limit = 100;

    const rows = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        description: true,
        lat: true,
        lng: true,
        status: true,
      },
    });

    const items = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      description: r.description,
      lat: r.lat,
      lng: r.lng,
      status: r.status,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
