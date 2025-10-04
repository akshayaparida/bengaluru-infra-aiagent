# Deploy to Vercel - Step by Step

**Time**: 30 minutes  
**Cost**: $0/month  
**Status**: Ready to deploy! ✅

---

## Step 1: Set Up Supabase Database (5 minutes)

### 1.1 Create Supabase Account
```
1. Open browser: https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Create new organization (if first time)
```

### 1.2 Create Database Project
```
1. Click "New Project"
2. Fill in:
   - Name: bengaluru-infra-aiagent
   - Database Password: (create strong password, SAVE IT!)
   - Region: Choose closest (e.g., "Mumbai" for India)
   - Pricing Plan: FREE
3. Click "Create new project"
4. Wait 2 minutes for provisioning
```

### 1.3 Get Database Connection String
```
1. In Supabase dashboard, go to:
   Settings (left sidebar) > Database > Connection String

2. Select "URI" tab

3. Copy the connection string, looks like:
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

4. Replace [YOUR-PASSWORD] with your actual password

5. SAVE THIS - you'll need it in Step 3
```

### 1.4 Run Database Migrations
```bash
# In your terminal (this directory):
DATABASE_URL="paste-your-supabase-connection-string-here" pnpm prisma migrate deploy

# Example:
# DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" pnpm prisma migrate deploy

# This creates the tables in your Supabase database
```

---

## Step 2: Deploy to Vercel (10 minutes)

### 2.1 Login to Vercel
```bash
# Run this command:
vercel login

# Choose: Continue with GitHub
# Authorize in browser
# Return to terminal
```

### 2.2 Deploy
```bash
# Run this command:
vercel

# Answer these questions:
# ? Set up and deploy: Yes
# ? Which scope: (select your account)
# ? Link to existing project: No
# ? What's your project's name: bengaluru-infra-aiagent
# ? In which directory is your code located: ./
# ? Want to override settings: No

# Deployment will start...
# Wait 2-3 minutes for build
```

### 2.3 Note Your URLs
```
You'll get 3 URLs:
1. Preview: https://bengaluru-infra-aiagent-xxx.vercel.app (for this deployment)
2. Production: https://bengaluru-infra-aiagent.vercel.app (your main URL)
3. Dashboard: https://vercel.com/your-username/bengaluru-infra-aiagent

SAVE the Production URL!
```

---

## Step 3: Add Environment Variables (10 minutes)

### 3.1 Go to Vercel Dashboard
```
1. Open: https://vercel.com/dashboard
2. Click your project: bengaluru-infra-aiagent
3. Go to: Settings > Environment Variables
```

### 3.2 Add Required Variables

**Click "Add New" for each:**

#### Database (CRITICAL)
```
Name: DATABASE_URL
Value: (paste your Supabase connection string from Step 1.3)
Environment: Production, Preview, Development
```

#### Cerebras AI (CRITICAL for cost control)
```
Name: CEREBRAS_API_KEY
Value: (your Cerebras API key from .env.local)
Environment: Production, Preview, Development
```

#### AI Cost Control (CRITICAL!)
```
Name: AI_DAILY_LIMIT
Value: 5
Environment: Production, Preview, Development
```

#### Twitter API
```
Name: TWITTER_CONSUMER_KEY
Value: (from .env.local)
Environment: Production, Preview, Development

Name: TWITTER_CONSUMER_SECRET
Value: (from .env.local)
Environment: Production, Preview, Development

Name: TWITTER_ACCESS_TOKEN
Value: (from .env.local)
Environment: Production, Preview, Development

Name: TWITTER_ACCESS_SECRET
Value: (from .env.local)
Environment: Production, Preview, Development
```

#### Email (Optional - use Gmail)
```
Name: SMTP_HOST
Value: smtp.gmail.com
Environment: Production, Preview, Development

Name: SMTP_PORT
Value: 587
Environment: Production, Preview, Development

Name: SMTP_USER
Value: your-email@gmail.com
Environment: Production, Preview, Development

Name: SMTP_PASSWORD
Value: (Gmail app password - create at https://myaccount.google.com/apppasswords)
Environment: Production, Preview, Development

Name: FROM_EMAIL
Value: your-email@gmail.com
Environment: Production, Preview, Development

Name: NOTIFY_TO
Value: your-email@gmail.com
Environment: Production, Preview, Development
```

#### App Settings
```
Name: NODE_ENV
Value: production
Environment: Production, Preview, Development

Name: APP_BASE_URL
Value: https://bengaluru-infra-aiagent.vercel.app
Environment: Production, Preview, Development

Name: ENABLE_EMAIL
Value: true
Environment: Production, Preview, Development

Name: ENABLE_CLASSIFICATION
Value: true
Environment: Production, Preview, Development

Name: SIMULATE_TWITTER
Value: false
Environment: Production, Preview, Development
```

#### MCP Gateway (Optional - deploy later)
```
Name: MCP_BASE_URL
Value: http://localhost:8008
Environment: Development

# For production, we'll add Railway URL later
```

### 3.3 Redeploy with New Variables
```bash
# In terminal:
vercel --prod

# This redeploys with all environment variables
# Wait 2-3 minutes
```

---

## Step 4: Verify Deployment (5 minutes)

### 4.1 Check Health
```bash
# Replace with your actual URL:
curl https://bengaluru-infra-aiagent.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "up"
  },
  "time": "2025-10-04T13:00:00.000Z"
}
```

### 4.2 Check AI Usage Limiter
```bash
curl https://bengaluru-infra-aiagent.vercel.app/api/ai-usage

# Expected response:
{
  "ok": true,
  "used": 0,
  "remaining": 5,
  "limit": 5,
  "resetAt": "2025-10-05T00:00:00.000Z",
  "canUseAI": true
}
```

### 4.3 Open in Browser
```
Open: https://bengaluru-infra-aiagent.vercel.app

You should see your app running!
```

---

## Step 5: Optional - Deploy MCP Gateway to Railway (5 minutes)

**If you want AI classification to work:**

### 5.1 Install Railway CLI
```bash
npm i -g @railway/cli
```

### 5.2 Deploy MCP Gateway
```bash
cd mcp-gateway/

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Add environment variable
railway variables set CEREBRAS_API_KEY=your-cerebras-key

# Get URL
railway status
# Copy the URL (e.g., https://mcp-gateway-production-xxxx.up.railway.app)
```

### 5.3 Update Vercel with MCP URL
```
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Edit MCP_BASE_URL:
   - Production: https://mcp-gateway-production-xxxx.up.railway.app
3. Redeploy: vercel --prod
```

---

## ✅ Success Checklist

- [ ] Supabase account created
- [ ] Database provisioned
- [ ] Connection string copied
- [ ] Migrations run successfully
- [ ] Vercel CLI installed
- [ ] Deployed to Vercel
- [ ] All environment variables added
- [ ] Redeployed with variables
- [ ] Health check passes
- [ ] AI usage endpoint works
- [ ] App opens in browser

---

## 🎉 You're Live!

**Your app is now:**
- ✅ Deployed to production
- ✅ Using managed database (Supabase)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ AI cost control enabled
- ✅ **$0/month** 🎉

**Your URL:**
```
https://bengaluru-infra-aiagent.vercel.app
```

---

## 📊 Monitor Usage

### Vercel Usage
```
Dashboard > Settings > Usage
- Bandwidth: Stay under 100GB/month
- Function invocations: Stay under limits
```

### Supabase Usage
```
Dashboard > Settings > Usage
- Database: Stay under 500MB
- Bandwidth: Stay under 2GB/month
- Active users: Stay under 50K
```

### AI Usage
```
curl https://bengaluru-infra-aiagent.vercel.app/api/ai-usage
# Check daily to ensure limit is working
```

---

## 🐛 Troubleshooting

### Build Failed
```bash
# Check logs in Vercel Dashboard > Deployments > Latest > Logs
# Common issues:
# 1. Missing environment variables
# 2. Prisma client not generated
# 3. Build timeout

# Fix: Add all required env vars and redeploy
vercel --prod
```

### Database Connection Failed
```bash
# Verify DATABASE_URL is correct
# Test connection:
DATABASE_URL="your-url" pnpm prisma db push

# Check Supabase dashboard for database status
```

### Health Check Fails
```bash
# Check logs:
vercel logs https://bengaluru-infra-aiagent.vercel.app --follow

# Common issues:
# 1. DATABASE_URL not set
# 2. Tables not created (run migrations)
# 3. Supabase database paused (free tier pauses after inactivity)
```

---

## 🚀 Next Steps

1. **Share your URL** with friends/users
2. **Monitor usage** daily for first week
3. **Add custom domain** (optional, costs ~$12/year)
4. **Set up monitoring** alerts in Vercel
5. **Deploy MCP Gateway** to Railway when ready

---

## 💰 Cost Tracking

**Current Setup:**
- Vercel: $0/month (free tier)
- Supabase: $0/month (free tier)
- Cerebras AI: $0/month (with AI_DAILY_LIMIT=5)
- **Total: $0/month** ✅

**When to Upgrade:**
- Vercel Pro ($20/month): When you exceed 100GB bandwidth
- Supabase Pro ($25/month): When you need > 500MB database
- Increase AI limit: When you have revenue

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Your Deployment**: https://vercel.com/dashboard
- **Cost Guide**: `docs/ZERO-COST-DEPLOYMENT.md`
- **Help**: This file!

---

**Congratulations! You're live on production for $0/month!** 🎉
