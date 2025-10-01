import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const enabled = String(process.env.ENABLE_EMAIL).toLowerCase() === 'true';
    if (!enabled) {
      // Mark as simulated email for dashboard visibility
      await prisma.report.update({ where: { id }, data: { emailedAt: new Date(), emailMessageId: 'simulated' } }).catch(() => {});

      // Optionally trigger a tweet in background even when email is simulated
      const shouldAutoTweet = String(process.env.AUTO_TWEET).toLowerCase() === 'true';
      if (shouldAutoTweet) {
        const base = process.env.APP_BASE_URL || 'http://localhost:3000';
        fetch(`${base}/api/reports/${id}/tweet`, { method: 'POST' }).catch(() => {});
      }
      return NextResponse.json({ ok: true, simulated: true, id }, { status: 202 });
    }

    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || '1025');
    const from = process.env.FROM_EMAIL || 'infra-agent@localhost';
    const to = process.env.NOTIFY_TO || from; // POC: send to ourselves or configured recipient
    const disclaimer = process.env.DISCLAIMER_TEXT || 'Local POC notification via Mailpit';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      tls: { rejectUnauthorized: false },
    });

    const subject = `Report: ${report.description.slice(0, 60)}`;
    const text = `${report.description}\nLocation: ${report.lat}, ${report.lng}\nTime: ${report.createdAt.toISOString()}\n\n${disclaimer}`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });

    // Persist email delivery metadata for dashboard
    await prisma.report.update({ where: { id }, data: { emailedAt: new Date(), emailMessageId: info.messageId } }).catch(() => {});

    // Optionally trigger a tweet in background (feature-flagged)
    const shouldAutoTweet = String(process.env.AUTO_TWEET).toLowerCase() === 'true';
    if (shouldAutoTweet) {
      const base = process.env.APP_BASE_URL || 'http://localhost:3000';
      fetch(`${base}/api/reports/${id}/tweet`, { method: 'POST' }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id, messageId: info.messageId }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}