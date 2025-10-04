# Production Deployment Guide

**Complete step-by-step guide for deploying Bengaluru Infrastructure AI Agent to production**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option 1: Deploy to Vercel (Easiest)](#option-1-deploy-to-vercel)
3. [Option 2: Deploy to AWS (Recommended)](#option-2-deploy-to-aws)
4. [Option 3: Deploy to Railway](#option-3-deploy-to-railway)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (code repository)
- [ ] Docker Hub account (container registry)
- [ ] Cloud provider account (AWS/Vercel/Railway)
- [ ] Domain name (optional but recommended)

### Required Secrets
```bash
# Application
CEREBRAS_API_KEY=your_cerebras_key
DATABASE_URL=postgresql://user:password@host:5432/db

# Twitter API
TWITTER_CONSUMER_KEY=your_key
TWITTER_CONSUMER_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret

# Email (if using real SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
NOTIFY_TO=recipient@example.com
```

### Local Tools
```bash
# Install required tools
pnpm install -g vercel  # For Vercel deployment
aws configure           # For AWS deployment
docker --version        # Verify Docker installed
```

---

## Option 1: Deploy to Vercel (Easiest)

**Time**: 10-15 minutes  
**Cost**: $0-20/month  
**Best for**: MVP, quick testing, small scale

### Step 1: Prepare Database

Use Supabase for managed Postgres:

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Copy connection string
# 4. Add to Vercel environment variables
```

### Step 2: Deploy

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Link to Git repository: Yes
# - Which scope: Personal
# - Link to existing project: No
# - Project name: bengaluru-infra-aiagent
# - Directory: ./
# - Override settings: No
```

### Step 3: Add Environment Variables

```bash
# Via CLI
vercel env add CEREBRAS_API_KEY
vercel env add DATABASE_URL
vercel env add TWITTER_CONSUMER_KEY
# ... add all other secrets

# Or via dashboard:
# 1. Go to vercel.com/dashboard
# 2. Select project
# 3. Settings > Environment Variables
# 4. Add all required variables
```

### Step 4: Trigger Deployment

```bash
git push origin main
```

Vercel automatically deploys on push to main branch.

---

## Option 2: Deploy to AWS (Recommended)

**Time**: 2-4 hours  
**Cost**: $50-150/month  
**Best for**: Production, scalability, full control

### Architecture

```
Internet → CloudFlare → ALB → ECS Fargate (2+ containers) → RDS Postgres
                                                            ↓
                                                         S3 (uploads)
```

### Step 1: Set Up AWS Infrastructure

```bash
# Clone and prepare
cd bengaluru-infra-aiagent

# Initialize Terraform
cd terraform/
terraform init

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Plan deployment
terraform plan

# Apply (creates all infrastructure)
terraform apply

# Note the outputs:
# - alb_dns_name
# - rds_endpoint
# - s3_bucket_name
```

### Step 2: Push Docker Image

```bash
# Login to Docker Hub
docker login

# Build image
docker build -t yourusername/bengaluru-infra-aiagent:latest .

# Push to registry
docker push yourusername/bengaluru-infra-aiagent:latest
```

### Step 3: Configure ECS Task

```bash
# Create task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster bengaluru-infra-prod \
  --service-name app \
  --task-definition bengaluru-infra-aiagent:1 \
  --desired-count 2 \
  --load-balancers \
      targetGroupArn=arn:aws:elasticloadbalancing:... \
      containerName=app \
      containerPort=3000
```

### Step 4: Run Database Migrations

```bash
# Connect to one ECS task
aws ecs execute-command \
  --cluster bengaluru-infra-prod \
  --task TASK_ID \
  --container app \
  --interactive \
  --command "/bin/sh"

# Inside container:
pnpm prisma migrate deploy
```

### Step 5: Set Up CloudFlare

```bash
# 1. Add site to CloudFlare
# 2. Update nameservers at domain registrar
# 3. Add DNS record:
#    Type: CNAME
#    Name: @
#    Target: ALB DNS name
# 4. Enable:
#    - Always Use HTTPS
#    - Auto Minify
#    - Brotli compression
#    - Cache Level: Standard
```

### Step 6: Configure Secrets Manager

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name bengaluru-infra/prod \
  --secret-string file://secrets.json

# Update ECS task definition to reference secrets
# (See aws/ecs-task-definition.json)
```

---

## Option 3: Deploy to Railway

**Time**: 15-20 minutes  
**Cost**: $5-50/month  
**Best for**: Startups, Docker support, simple setup

### Step 1: Create Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Link to GitHub repo
railway link
```

### Step 2: Add Services

```bash
# Add Postgres
railway add postgres

# Deploy app
railway up

# Set environment variables
railway variables set CEREBRAS_API_KEY=your_key
railway variables set AI_DAILY_LIMIT=5
# ... add all other vars
```

### Step 3: Deploy

```bash
git push origin main
```

Railway automatically builds and deploys from Dockerfile.

---

## Post-Deployment

### 1. Verify Health

```bash
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "up",
    "mcp": "up"
  },
  "time": "2025-10-04T12:00:00.000Z"
}
```

### 2. Test AI Usage Limiter

```bash
curl https://your-domain.com/api/ai-usage

# Response:
{
  "ok": true,
  "used": 0,
  "remaining": 5,
  "limit": 5,
  "resetAt": "2025-10-05T00:00:00.000Z",
  "canUseAI": true
}
```

### 3. Submit Test Report

```bash
curl -X POST https://your-domain.com/api/reports \
  -F description="Test pothole on MG Road" \
  -F lat=12.9716 \
  -F lng=77.5946 \
  -F photo=@test-image.jpg

# Save the report ID from response
```

### 4. Run Database Backup

```bash
# AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier bengaluru-infra-prod \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Monitoring & Maintenance

### CloudWatch Alarms (AWS)

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bia-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bia-high-memory \
  --metric-name MemoryUtilization \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bia-error-rate \
  --metric-name 5XXError \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Daily Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Check AI usage
curl https://your-domain.com/api/ai-usage

# Check database connections
aws rds describe-db-instances \
  --db-instance-identifier bengaluru-infra-prod \
  --query 'DBInstances[0].DBInstanceStatus'

# Check logs
aws logs tail /ecs/bengaluru-infra-aiagent --follow
```

### Weekly Tasks

- [ ] Review error logs
- [ ] Check database size and performance
- [ ] Verify backups are working
- [ ] Review AI usage trends
- [ ] Update dependencies (security patches)

### Monthly Tasks

- [ ] Review and optimize costs
- [ ] Performance testing
- [ ] Capacity planning
- [ ] Update documentation
- [ ] Security audit

---

## Troubleshooting

### App Won't Start

```bash
# Check logs
docker logs CONTAINER_ID

# Common issues:
1. Missing environment variables
   → Check: docker exec CONTAINER_ID env

2. Database connection failed
   → Verify: DATABASE_URL is correct
   → Check: Database is accessible

3. Port already in use
   → Kill: lsof -ti:3000 | xargs kill

4. Build failed
   → Clear cache: docker build --no-cache
```

### Database Migration Failed

```bash
# Reset migration
pnpm prisma migrate reset

# Force deploy
pnpm prisma migrate deploy --force

# Check migration status
pnpm prisma migrate status
```

### High Memory Usage

```bash
# Check container stats
docker stats CONTAINER_ID

# Restart container
docker restart CONTAINER_ID

# Scale up (ECS)
aws ecs update-service \
  --cluster prod \
  --service app \
  --desired-count 4
```

### AI Limiter Not Working

```bash
# Check usage file
cat .data/ai-usage.json

# Reset limiter
rm .data/ai-usage.json

# Verify env var
echo $AI_DAILY_LIMIT
```

---

## Rollback Procedures

### Quick Rollback (AWS ECS)

```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix bengaluru-infra-aiagent

# Rollback to previous version
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition bengaluru-infra-aiagent:PREVIOUS_VERSION
```

### Database Rollback

```bash
# Restore from snapshot (AWS)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier bengaluru-infra-restored \
  --db-snapshot-identifier snapshot-20251004

# Restore from backup file
psql $DATABASE_URL < backup-20251004.sql
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Rollback to specific commit
git reset --hard COMMIT_HASH
git push origin main --force
```

---

## Security Checklist

- [ ] HTTPS enforced (CloudFlare/ACM)
- [ ] Environment variables in Secrets Manager
- [ ] Security headers configured (Next.js config)
- [ ] Database in private subnet
- [ ] Security groups properly configured
- [ ] IAM roles with least privilege
- [ ] Rate limiting enabled
- [ ] Regular security audits
- [ ] Dependency updates automated
- [ ] Logging PII safely
- [ ] CORS configured properly

---

## Performance Optimization

### Enable Caching

```typescript
// Add to next.config.ts
const nextConfig = {
  // ... existing config
  
  // Cache static assets
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_reports_created_at ON "Report"(created_at DESC);
CREATE INDEX idx_reports_status ON "Report"(status);
CREATE INDEX idx_reports_category ON "Report"(category);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "Report" WHERE status = 'NEW';
```

### CDN Setup (CloudFlare)

```bash
# Enable caching rules:
1. Cache static assets (images, css, js)
2. Cache API responses (with short TTL)
3. Purge cache on deployment
```

---

## Cost Optimization

### AWS Cost Savings

```bash
# Use Spot instances for non-critical tasks
# Use Reserved Instances for predictable workloads
# Enable RDS auto-scaling
# Use S3 lifecycle policies
# Set up CloudWatch to stop idle resources
```

### Monitor Spending

```bash
# Set up AWS Budgets
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## Success Metrics

Track these KPIs:

- **Uptime**: Target 99.9% (43 minutes downtime/month)
- **Response Time**: < 200ms for API calls
- **Error Rate**: < 0.1%
- **AI Usage**: Within budget (5-20/day)
- **Database Performance**: < 100ms query time
- **Cost**: < $150/month (production)

---

## Support & Resources

- **Documentation**: `/docs` folder
- **GitHub Issues**: Report bugs and feature requests
- **CloudWatch Logs**: Troubleshooting
- **AWS Support**: For infrastructure issues

---

**Deployment checklist complete!** 🚀

Your application is now production-ready with proper monitoring, security, and rollback procedures.
