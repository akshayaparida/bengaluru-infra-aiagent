import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const r = await prisma.report.findUnique({ where: { id }, select: { photoPath: true } });
    if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!r.photoPath) return NextResponse.json({ error: "photo_missing" }, { status: 404 });

    // Stream the file; assume JPEG or PNG. For POC, sniff by extension minimally.
    const isPng = r.photoPath.toLowerCase().endsWith(".png");
    const ct = isPng ? "image/png" : "image/jpeg";

    const stream = fs.createReadStream(r.photoPath);
    return new NextResponse(stream as any, {
      status: 200,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
