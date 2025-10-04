# Quick Guide: Enable Real Gmail Delivery

## Current Status
✅ Code configured with:
- FROM: blrinfraaiagent@gmail.com  
- TO: akparida28@gmail.com

❌ SMTP pointing to localhost (Mailpit) - **NO REAL EMAILS YET**

## To Receive Real Emails (2 Options)

### Option 1: Gmail SMTP (Real emails to your inbox)

**Step 1: Get Gmail App Password**
1. Login to blrinfraaiagent@gmail.com
2. Go to: https://myaccount.google.com/apppasswords
3. Create App Password named "Bengaluru Infra Agent"
4. Copy the 16-character password

**Step 2: Update .env file**
```bash
# Add these lines to your .env file:
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=blrinfraaiagent@gmail.com
SMTP_PASSWORD=REPLACE_WITH_YOUR_16_CHAR_APP_PASSWORD
FROM_EMAIL=blrinfraaiagent@gmail.com
NOTIFY_TO=akparida28@gmail.com
```

**Step 3: Test**
```bash
# Restart your app
pnpm dev

# Submit a report and click "Notify"
# Check akparida28@gmail.com inbox
```

### Option 2: Local Testing with Mailpit (Fake emails for testing)

**Step 1: Start Mailpit**
```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

**Step 2: Update .env file**
```bash
ENABLE_EMAIL=true
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=blrinfraaiagent@gmail.com
NOTIFY_TO=akparida28@gmail.com
```

**Step 3: View emails**
- Open browser: http://localhost:8025
- Submit reports and see emails appear here
- No real email delivery (testing only)

## Which Option Should You Use?

**Use Option 1 (Gmail) if:**
- You want real emails to akparida28@gmail.com
- Testing production email flow
- Want to verify email content/formatting in real inbox

**Use Option 2 (Mailpit) if:**
- Development/testing only
- Don't want to spam real inbox
- Want to see emails without internet
- Faster iteration (no Gmail rate limits)

## Troubleshooting

**No emails received (Option 1)?**
1. Check spam folder in akparida28@gmail.com
2. Verify App Password is correct (no spaces)
3. Check SMTP_HOST=smtp.gmail.com (not localhost)
4. Ensure ENABLE_EMAIL=true

**Connection error?**
1. Port 587 must be open (firewall)
2. Verify 2FA enabled on blrinfraaiagent@gmail.com
3. App Password must be used (not regular password)

**Mailpit not working (Option 2)?**
1. Check Docker is running: `docker ps`
2. Visit http://localhost:8025 to see web UI
3. Port 1025 must be free

## Security Reminder

⚠️ NEVER commit SMTP_PASSWORD to git  
⚠️ .env file is already in .gitignore  
⚠️ Use AWS Secrets Manager in production

## What happens when you click "Notify"?

1. API calls `/api/reports/:id/notify`
2. Code generates AI email using Cerebras
3. Email sent via configured SMTP
4. Database updated with `emailedAt` timestamp
5. (Optional) Auto-tweet if AUTO_TWEET=true
