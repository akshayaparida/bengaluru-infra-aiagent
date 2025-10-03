import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const r = await prisma.report.findUnique({ where: { id }, select: { photoPath: true } });
    if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!r.photoPath) return NextResponse.json({ error: "photo_missing" }, { status: 404 });

    // Build full path - photoPath is stored as just the filename
    const storageDir = process.env.FILE_STORAGE_DIR || path.join(process.cwd(), '.data', 'uploads');
    const fullPath = path.join(storageDir, r.photoPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "photo_file_missing" }, { status: 404 });
    }

    // Stream the file; assume JPEG or PNG. For POC, sniff by extension minimally.
    const isPng = r.photoPath.toLowerCase().endsWith(".png");
    const ct = isPng ? "image/png" : "image/jpeg";

    const stream = fs.createReadStream(fullPath);
    return new NextResponse(stream as any, {
      status: 200,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch (err) {
    console.error('[photo route error]', err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
