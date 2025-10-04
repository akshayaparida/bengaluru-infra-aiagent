import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

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
      await prisma.report.update({ where: { id }, data: { emailedAt: new Date(), emailMessageId: 'simulated' } });

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
    // Agent email configuration with sender name
    const from = `"Bengaluru Infra AI Agent" <${process.env.FROM_EMAIL || 'blrinfraaiagent@gmail.com'}>`; 
    const to = process.env.NOTIFY_TO || 'akparida28@gmail.com'; // Receiver email
    const disclaimer = process.env.DISCLAIMER_TEXT || 'Local POC notification via Mailpit';

    // SMTP authentication (required for Gmail)
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    
    // Configure transporter with optional authentication
    // Build config object dynamically to satisfy TypeScript
    const transportConfig = (smtpUser && smtpPassword
      ? {
          host,
          port,
          secure: port === 465, // Use TLS for port 465, STARTTLS for 587
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        }
      : {
          host,
          port,
          secure: port === 465,
          tls: { rejectUnauthorized: false },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any as nodemailer.TransportOptions;
    
    const transporter = nodemailer.createTransport(transportConfig);

    // Get photo attachment
    const storageDir = process.env.FILE_STORAGE_DIR || path.join(process.cwd(), '.data', 'uploads');
    const photoPath = path.join(storageDir, report.photoPath);
    let photoAttachment = null;
    
    try {
      await fs.access(photoPath);
      photoAttachment = {
        filename: `report-${id}.jpg`,
        path: photoPath,
        contentType: 'image/jpeg'
      };
    } catch {
      console.warn(`Photo not found: ${photoPath}`);
    }

    // Generate AI-crafted email via Cerebras MCP Gateway
    let subject = `🚨 Infrastructure Report: ${report.description.slice(0, 50)}`;
    let html = `
      <h2>Infrastructure Issue Reported</h2>
      <p><strong>Description:</strong> ${report.description}</p>
      <p><strong>Category:</strong> ${report.category || 'Unclassified'}</p>
      <p><strong>Severity:</strong> ${report.severity || 'Medium'}</p>
      <p><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</p>
      <p><strong>Reported:</strong> ${new Date(report.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      ${photoAttachment ? '<p><strong>Photo:</strong> Please see attachment</p>' : ''}
      <hr>
      <p><em>${disclaimer}</em></p>
    `;
    let text = `${report.description}\nLocation: ${report.lat}, ${report.lng}\nTime: ${report.createdAt.toISOString()}\n\n${disclaimer}`;
    
    const mcpBaseUrl = process.env.MCP_BASE_URL;
    if (mcpBaseUrl) {
      try {
        const aiRes = await fetch(`${mcpBaseUrl}/tools/generate.email`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            description: report.description,
            category: report.category,
            severity: report.severity,
            lat: report.lat,
            lng: report.lng,
          }),
          signal: AbortSignal.timeout(5000),
        }).then(r => r.json()).catch(() => null);
        
        if (aiRes?.subject && aiRes?.body) {
          subject = `🚨 ${aiRes.subject}`;
          html = `
            <h2>Infrastructure Issue Report - Action Required</h2>
            ${aiRes.body.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
            <hr>
            <h3>Report Details:</h3>
            <ul>
              <li><strong>Category:</strong> ${report.category || 'Unclassified'}</li>
              <li><strong>Severity:</strong> ${report.severity || 'Medium'}</li>
              <li><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</li>
              <li><strong>Reported:</strong> ${new Date(report.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
            </ul>
            ${photoAttachment ? '<p>📷 <strong>Photo evidence attached</strong></p>' : ''}
            <hr>
            <p>Sincerely,<br><strong>Bengaluru Infra AI Agent</strong><br><em>Automated Civic Reporting System</em></p>
            <hr>
            <p><em>${disclaimer}</em></p>
          `;
          text = `${aiRes.body}\n\nCategory: ${report.category}\nSeverity: ${report.severity}\nLocation: ${report.lat}, ${report.lng}\nReported: ${report.createdAt.toISOString()}\n\n${disclaimer}`;
        }
      } catch {
        // Fallback to template on error
      }
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };

    // Add photo attachment if available
    if (photoAttachment) {
      mailOptions.attachments = [photoAttachment];
    }

    const info = await transporter.sendMail(mailOptions);

    // Persist email delivery metadata for dashboard
    await prisma.report.update({ where: { id }, data: { emailedAt: new Date(), emailMessageId: info.messageId } });

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