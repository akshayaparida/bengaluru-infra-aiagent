# Gmail SMTP Setup for Real Email Delivery

## Current Status
- Your code is configured with the correct email addresses
- FROM: blrinfraaiagent@gmail.com
- TO: akparida28@gmail.com
- But SMTP is pointing to localhost (Mailpit) for testing

## Steps to Receive Real Emails

### 1. Create App Password for blrinfraaiagent@gmail.com

You need to set up the sender Gmail account (blrinfraaiagent@gmail.com):

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Create a new App Password:
   - App name: "Bengaluru Infra Agent"
   - Copy the generated 16-character password (format: xxxx xxxx xxxx xxxx)

### 2. Update Your .env File

Add these configurations to your `.env` file:

```bash
# Email Configuration - Real Gmail SMTP
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=blrinfraaiagent@gmail.com
SMTP_USER=blrinfraaiagent@gmail.com
SMTP_PASSWORD=REPLACE_WITH_YOUR_APP_PASSWORD
NOTIFY_TO=akparida28@gmail.com

# Optional: Set to false to use real email (not simulation)
# ENABLE_EMAIL=true means real emails will be sent
```

### 3. Update the notify route to use authentication

The current code needs to be updated to use SMTP authentication for Gmail.

## Security Notes

1. NEVER commit the App Password to git
2. The .env file is already in .gitignore
3. Use environment variables in production (AWS Secrets Manager, etc.)
4. App Passwords are specific to the app and can be revoked anytime

## Testing

After setup:
1. Start your Next.js app: `pnpm dev`
2. Submit a report via the UI
3. Click "Notify" button
4. Check akparida28@gmail.com inbox

## Troubleshooting

**Error: "Invalid credentials"**
- Verify the App Password is correct (no spaces)
- Ensure 2FA is enabled on blrinfraaiagent@gmail.com

**Error: "Connection refused"**
- Check firewall allows outbound on port 587
- Verify SMTP_HOST=smtp.gmail.com

**Error: "Less secure app"**
- Gmail deprecated "Less secure apps"
- You MUST use App Passwords (not regular password)

## Alternative: Use Mailpit for Local Testing

If you want to test locally without real emails:

```bash
# Install Mailpit
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit

# Use these settings in .env
ENABLE_EMAIL=true
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=blrinfraaiagent@gmail.com
NOTIFY_TO=akparida28@gmail.com

# View emails at: http://localhost:8025
```

## Production Deployment

For production on AWS:
1. Store SMTP credentials in AWS Secrets Manager
2. Consider using AWS SES instead of Gmail SMTP (better deliverability)
3. Set up proper SPF/DKIM/DMARC records
4. Monitor email bounce rates
