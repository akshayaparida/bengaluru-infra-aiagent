# Zero-Cost / Ultra-Low-Cost Deployment Guide

**Deploy to production for $0-5/month using free tiers and cost optimization**

---

## 🎯 Goal: Stay Under $5/Month

**Problem**: AWS can cost $75-185/month (too expensive for students/learning)  
**Solution**: Use free tiers, optimized platforms, and cost controls

---

## 💰 Cost Comparison

| Platform | Cost | Free Tier | Best For |
|----------|------|-----------|----------|
| **Vercel + Supabase** | **$0-5/month** ✅ | Yes (generous) | **RECOMMENDED** |
| Railway | $5-10/month | Limited | Good backup |
| Render | $0-7/month | Yes | Docker apps |
| AWS (optimized) | $15-30/month | Limited | Learning only |
| AWS (full) | $75-185/month | No | ❌ Too expensive |

---

## 🏆 Recommended: Vercel + Supabase ($0-5/month)

**Why this is the best option for you:**
- ✅ **$0/month** on free tier (generous limits)
- ✅ Automatic HTTPS & CDN
- ✅ Zero infrastructure management
- ✅ Easy deployment (30 minutes)
- ✅ Can upgrade later when you have funding
- ✅ Perfect for interviews (shows modern stack knowledge)

### Free Tier Limits

**Vercel (Free)**
- 100GB bandwidth/month
- 100 deployments/month
- Automatic HTTPS
- Global CDN
- Serverless functions

**Supabase (Free)**
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth
- Daily backups (7 days)

**Total Cost**: **$0/month** 🎉

---

## 📋 Step-by-Step: Deploy to Vercel + Supabase

### Step 1: Set Up Supabase Database (5 minutes)

```bash
# 1. Go to https://supabase.com
# 2. Sign up with GitHub
# 3. Create new project
#    - Name: bengaluru-infra-aiagent
#    - Database Password: (save this securely)
#    - Region: Choose closest to you
#    - Plan: Free

# 4. Wait 2 minutes for database to provision

# 5. Go to Project Settings > Database
# 6. Copy the connection string (URI format)
#    Example: postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# 7. Run migrations
DATABASE_URL="your-connection-string" pnpm prisma migrate deploy
```

### Step 2: Deploy to Vercel (10 minutes)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: (your personal account)
# - Link to existing project: No
# - Project name: bengaluru-infra-aiagent
# - Directory: ./
# - Override settings: No

# Deployment will start automatically
# Wait 2-3 minutes for build

# You'll get a URL like: https://bengaluru-infra-aiagent.vercel.app
```

### Step 3: Add Environment Variables (10 minutes)

**Option A: Via Vercel Dashboard**
```bash
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Go to Settings > Environment Variables
# 4. Add these variables:
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Cerebras AI (you already have this)
CEREBRAS_API_KEY=your_cerebras_key

# Twitter API (you already have this)
TWITTER_CONSUMER_KEY=your_key
TWITTER_CONSUMER_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret

# Email (use free tier)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_EMAIL=your_email@gmail.com
NOTIFY_TO=your_email@gmail.com

# MCP Gateway (optional - can run on Railway free tier)
MCP_BASE_URL=https://your-mcp.railway.app

# App settings
NODE_ENV=production
APP_BASE_URL=https://bengaluru-infra-aiagent.vercel.app

# Feature flags
ENABLE_EMAIL=true
ENABLE_CLASSIFICATION=true
SIMULATE_TWITTER=false

# AI Cost Control (CRITICAL for cost management)
AI_DAILY_LIMIT=5
```

**Option B: Via CLI**
```bash
# Set environment variables
vercel env add DATABASE_URL
vercel env add CEREBRAS_API_KEY
vercel env add AI_DAILY_LIMIT
# ... add all other variables

# Redeploy to apply changes
vercel --prod
```

### Step 4: Deploy MCP Gateway (Optional - Free on Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
cd mcp-gateway/
railway init

# Deploy
railway up

# Add environment variable
railway variables set CEREBRAS_API_KEY=your_key

# Get URL
railway status
# Copy the URL (e.g., https://mcp-gateway-production-xxxx.up.railway.app)

# Add to Vercel env vars
vercel env add MCP_BASE_URL
# Paste the Railway URL
```

### Step 5: Verify Deployment (5 minutes)

```bash
# Check health
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "up",
    "mcp": "up"
  },
  "time": "2025-10-04T12:00:00.000Z"
}

# Check AI usage limiter
curl https://your-app.vercel.app/api/ai-usage

# Expected response:
{
  "ok": true,
  "used": 0,
  "remaining": 5,
  "limit": 5,
  "resetAt": "2025-10-05T00:00:00.000Z",
  "canUseAI": true
}

# Submit test report
curl -X POST https://your-app.vercel.app/api/reports \
  -F description="Test pothole" \
  -F lat=12.9716 \
  -F lng=77.5946 \
  -F photo=@test-image.jpg
```

---

## 🛡️ Cost Control Strategies

### 1. AI Usage Limiter (Already Implemented)

**This is your main cost control!**

```bash
# Set AI_DAILY_LIMIT in Vercel
vercel env add AI_DAILY_LIMIT
# Enter: 5

# This limits Cerebras API calls to 5/day
# After that, uses free keyword classification
# Saves: ~$25-30/month
```

### 2. Supabase Free Tier Monitoring

```bash
# Monitor your usage
# 1. Go to Supabase Dashboard
# 2. Settings > Usage
# 3. Check:
#    - Database size: Stay under 500MB
#    - Bandwidth: Stay under 2GB/month
#    - Active users: Stay under 50K

# Set up alerts
# 1. Settings > Billing
# 2. Enable email alerts at 80% usage
```

### 3. Vercel Free Tier Monitoring

```bash
# Monitor your usage
# 1. Go to Vercel Dashboard
# 2. Settings > Usage
# 3. Check:
#    - Bandwidth: Stay under 100GB/month
#    - Function invocations: Stay under limits
#    - Build minutes: Stay under limits

# Optimize bandwidth
# - Use image optimization (already enabled)
# - Cache static assets (already configured)
# - Use Cloudflare (optional, adds more free bandwidth)
```

### 4. Disable Expensive Features in Development

```bash
# In .env.local (for local development)
SIMULATE_TWITTER=true          # Don't hit Twitter API
ENABLE_EMAIL=false             # Don't send emails during dev
ENABLE_CLASSIFICATION=false    # Don't call Cerebras during dev

# Only enable in production
```

### 5. Set Up Cost Alerts

**Supabase:**
```bash
# Email alert when approaching limits
# Dashboard > Settings > Billing > Email Alerts
```

**Vercel:**
```bash
# Email alert when approaching bandwidth limit
# Dashboard > Settings > Notifications
```

---

## 💡 Alternative: Railway (All-in-One)

**If you want even simpler setup:**

```bash
# Railway gives you:
# - Postgres database (512MB free)
# - App hosting (500 hours/month free)
# - $5/month after free tier
# - Auto-scaling
# - Automatic HTTPS

# Deploy
railway init
railway link
railway add postgres
git push

# Cost: $0 (free tier) to $5/month
```

---

## 🚫 What NOT to Use (Too Expensive)

### ❌ AWS (Without Free Tier Optimization)

**Costs that add up quickly:**
- ECS Fargate: $30-80/month
- RDS: $15-60/month
- ALB: $20/month
- Data transfer: $5-15/month
- **Total**: $70-175/month ❌

**Only use AWS if:**
1. You have AWS credits (students can get $100-200)
2. You're specifically learning AWS for interviews
3. You have a budget

### ❌ AWS "Free Tier" Traps

**These services claim "free tier" but charge quickly:**
- ECS Fargate (only 750 hours/month free, then expensive)
- RDS (only t2.micro, single-AZ, 1 year free)
- ALB (not free at all, $20/month minimum)
- Data transfer (free inbound, but outbound costs add up)
- CloudWatch (logs cost money after 5GB)

---

## 📊 Monthly Cost Breakdown

### Vercel + Supabase (Recommended)

```
Month 1-12 (Free Tier):
- Vercel:            $0
- Supabase:          $0
- Cerebras AI:       $0 (with 5/day limit)
- Railway (MCP):     $0 (free tier)
Total:               $0/month ✅

After Free Tier (if you exceed limits):
- Vercel:            $0-20/month
- Supabase:          $0-25/month
- Cerebras AI:       $0-5/month (limited)
Total:               $0-50/month

With AI Limiter:
Estimated:           $0-5/month ✅
```

### Railway (Alternative)

```
Month 1-12:
- Railway App:       $0 (free tier)
- Railway Postgres:  $0 (free tier)
- Cerebras AI:       $0 (with limiter)
Total:               $0/month ✅

After 500 hours:
- Railway:           $5/month
- Cerebras AI:       $0 (with limiter)
Total:               $5/month ✅
```

---

## 🎓 AWS Free Tier (If You Must Use AWS)

**Only if you have AWS credits or need to learn AWS specifically:**

### Optimize for AWS Free Tier

```bash
# Use these services (actually free):
- EC2 t2.micro (750 hours/month, 12 months)
- RDS t2.micro (750 hours/month, 12 months)
- S3 (5GB storage, 12 months)
- CloudWatch (5GB logs, always free)

# Avoid these services:
- ❌ ECS Fargate (expensive)
- ❌ Application Load Balancer (expensive)
- ❌ NAT Gateway (expensive)
- ❌ Elastic IP (charges when not attached)

# Estimated cost with free tier: $5-15/month
```

### AWS Cost Control Script

```bash
# Create cost monitoring script
cat > check-aws-costs.sh << 'EOF'
#!/bin/bash
# Check AWS costs for current month

aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --query 'ResultsByTime[0].Total.UnblendedCost.Amount' \
  --output text

# Alert if over $5
COST=$(aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) --granularity MONTHLY --metrics "UnblendedCost" --query 'ResultsByTime[0].Total.UnblendedCost.Amount' --output text)

if (( $(echo "$COST > 5" | bc -l) )); then
  echo "⚠️  WARNING: AWS costs are $${COST} this month (over $5 budget)"
  echo "Consider shutting down unused resources!"
else
  echo "✅ AWS costs are $${COST} this month (under budget)"
fi
EOF

chmod +x check-aws-costs.sh

# Run daily
./check-aws-costs.sh
```

### Set AWS Budget Alert

```bash
# Set up $5 budget alert
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget-5-dollars.json

# Create budget-5-dollars.json
cat > budget-5-dollars.json << EOF
{
  "BudgetName": "Monthly-5-Dollar-Limit",
  "BudgetLimit": {
    "Amount": "5",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
EOF
```

---

## 🔥 Emergency: Stop All AWS Resources

**If AWS bill is growing too fast:**

```bash
#!/bin/bash
# emergency-stop-aws.sh
# STOPS ALL AWS RESOURCES TO PREVENT CHARGES

echo "🚨 EMERGENCY: Stopping all AWS resources..."

# Stop all EC2 instances
aws ec2 describe-instances \
  --query 'Reservations[].Instances[?State.Name==`running`].[InstanceId]' \
  --output text | xargs -I {} aws ec2 stop-instances --instance-ids {}

# Stop all RDS instances
aws rds describe-db-instances \
  --query 'DBInstances[?DBInstanceStatus==`available`].[DBInstanceIdentifier]' \
  --output text | xargs -I {} aws rds stop-db-instance --db-instance-identifier {}

# Delete all load balancers
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[].LoadBalancerArn' \
  --output text | xargs -I {} aws elbv2 delete-load-balancer --load-balancer-arn {}

# Stop all ECS tasks
aws ecs list-clusters --query 'clusterArns[]' --output text | xargs -I {} \
  aws ecs list-tasks --cluster {} --query 'taskArns[]' --output text | xargs -I @ \
  aws ecs stop-task --cluster {} --task @

echo "✅ All resources stopped. Check AWS console to verify."
echo "💰 This should stop new charges (existing charges for the month will still appear)"
```

---

## ✅ Recommended Setup (Final Answer)

**For staying under $5/month:**

### Use Vercel + Supabase

```bash
# Total cost: $0/month (free tier)
# Can handle: 10,000+ users/month
# Setup time: 30 minutes
# Perfect for: Learning, portfolio, MVP

# Steps:
1. Deploy to Vercel (free)
2. Use Supabase database (free)
3. Enable AI limiter (AI_DAILY_LIMIT=5)
4. Monitor usage monthly
5. Upgrade only when you have funding/revenue
```

### Deployment Commands

```bash
# 1. Set up Supabase (https://supabase.com)
# 2. Deploy to Vercel
vercel --prod

# 3. Add environment variables
vercel env add DATABASE_URL
vercel env add CEREBRAS_API_KEY
vercel env add AI_DAILY_LIMIT
vercel env add TWITTER_CONSUMER_KEY
vercel env add TWITTER_CONSUMER_SECRET
vercel env add TWITTER_ACCESS_TOKEN
vercel env add TWITTER_ACCESS_SECRET

# 4. Redeploy
vercel --prod

# Done! $0/month
```

---

## 📈 Upgrade Path (When You Have Budget)

**Month 1-6: Free Tier**
- Vercel + Supabase: $0/month
- Learn, build, get users

**Month 7-12: Basic Paid**
- Still Vercel + Supabase: $0-25/month
- More users, still cheap

**Year 2+: When Profitable**
- Migrate to AWS: $75-185/month
- Full production setup
- Scale to 100K+ users

---

## 🎯 Summary: Stay Under $5/Month

**DO THIS:**
✅ Use Vercel + Supabase (free)
✅ Set AI_DAILY_LIMIT=5
✅ Monitor usage monthly
✅ Use free tiers of all services
✅ Disable expensive features in dev

**DON'T DO THIS:**
❌ Use AWS without credits
❌ Enable auto-scaling without limits
❌ Forget to set AI usage limits
❌ Run multiple environments on paid tiers
❌ Use expensive managed services

**RESULT:**
- **$0/month** for first 6-12 months (free tiers)
- **$0-5/month** after free tier (with limits)
- **Fully functional** production app
- **Can upgrade** when you have funding

---

## 🚀 Action Plan for You

**Today (30 minutes):**
```bash
1. Create Supabase account
2. Create Vercel account
3. Deploy with: vercel --prod
4. Add environment variables
5. Test deployment
```

**Cost: $0**

**Tomorrow:**
```bash
1. Monitor usage
2. Test features
3. Share with users
```

**Cost: $0**

**This Month:**
```bash
1. Get feedback
2. Iterate
3. Stay on free tier
```

**Cost: $0**

---

**You can deploy production-quality app for $0/month!** 🎉

No need to worry about AWS bills. Vercel + Supabase is perfect for learning and launching.
