# Production Deployment Guide

Complete guide for deploying the Bengaluru Infrastructure AI Agent to production.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Options](#deployment-options)
3. [AWS Lambda Setup (Recommended)](#aws-lambda-setup)
4. [Vercel Setup (Easiest)](#vercel-setup)
5. [EC2 Setup (Traditional)](#ec2-setup)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Cost Optimization](#cost-optimization)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Local Development (Current)

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR LAPTOP/PC                                                  │
│                                                                  │
│  ┌──────────────┐        ┌──────────────┐                      │
│  │   CRON JOB   │───────▶│  Next.js API │                      │
│  │  (Every Hour)│        │   Endpoint   │                      │
│  └──────────────┘        └──────┬───────┘                      │
│                                  │                               │
│                          ┌───────▼────────┐                     │
│                          │ Rate Limiter   │                     │
│                          │ (JSON file)    │                     │
│                          └───────┬────────┘                     │
│                                  │                               │
│                          ┌───────▼────────┐                     │
│                          │ Twitter API    │                     │
│                          └────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Production (AWS Lambda)

```
┌─────────────────────────────────────────────────────────────────┐
│  AWS CLOUD                                                       │
│                                                                  │
│  ┌──────────────────┐        ┌────────────────┐                │
│  │  EventBridge     │───────▶│   Lambda       │                │
│  │  (Cron: hourly)  │        │   Function     │                │
│  └──────────────────┘        └───────┬────────┘                │
│                                       │                          │
│                               ┌───────▼────────┐                │
│                               │ Rate Limiter   │                │
│                               │ (DynamoDB)     │                │
│                               └───────┬────────┘                │
│                                       │                          │
│                               ┌───────▼────────┐                │
│                               │ Twitter API    │                │
│                               └────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Options

| Option | Cost/Month | Complexity | Setup Time | Recommended |
|--------|-----------|------------|------------|-------------|
| AWS Lambda + EventBridge | $1-5 | Medium | 30 mins | ✅ YES |
| AWS EC2 (free tier) | Free | Low | 15 mins | ✅ YES |
| AWS EC2 (t2.micro) | $10 | Low | 15 mins | ⚠️ OK |
| AWS ECS Fargate | $15-30 | High | 2 hours | ❌ Overkill |
| Vercel Hobby | Free | Very Low | 5 mins | ✅ YES |
| Vercel Pro | $20 | Very Low | 5 mins | ⚠️ OK |

## AWS Lambda Setup (Recommended)

### Why Lambda?

- **Serverless**: No server management
- **Cost-effective**: Pay only when running ($1-5/month)
- **Auto-scaling**: Handles traffic spikes
- **Production-grade**: Used by major companies
- **Great for learning AWS**: Core AWS service

### Prerequisites

1. AWS Account (free tier eligible)
2. AWS CLI installed and configured
3. Node.js 18+ installed locally

### Step-by-Step Setup

#### 1. Install AWS CLI

```bash
# Ubuntu/Debian
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### 2. Configure AWS Credentials

```bash
aws configure
```

Enter:
- AWS Access Key ID: [Your key from AWS Console]
- AWS Secret Access Key: [Your secret]
- Default region: us-east-1 (or your preferred region)
- Default output format: json

#### 3. Create DynamoDB Table for Rate Limiting

```bash
aws dynamodb create-table \
  --table-name twitter-rate-limits \
  --attribute-definitions \
    AttributeName=endpoint,AttributeType=S \
  --key-schema \
    AttributeName=endpoint,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

What this does:
- Creates a DynamoDB table named `twitter-rate-limits`
- Uses `endpoint` as the primary key (e.g., "mentionTimeline")
- PAY_PER_REQUEST: Only pay for what you use (no minimum cost)
- Region: us-east-1 (change if needed)

#### 4. Store Secrets in AWS Secrets Manager

```bash
# Create secrets for Twitter API
aws secretsmanager create-secret \
  --name bengaluru-twitter-credentials \
  --description "Twitter API credentials for Bengaluru Infrastructure AI Agent" \
  --secret-string '{
    "TWITTER_API_KEY":"{{YOUR_TWITTER_API_KEY}}",
    "TWITTER_API_SECRET":"{{YOUR_TWITTER_API_SECRET}}",
    "TWITTER_ACCESS_TOKEN":"{{YOUR_TWITTER_ACCESS_TOKEN}}",
    "TWITTER_ACCESS_TOKEN_SECRET":"{{YOUR_TWITTER_ACCESS_TOKEN_SECRET}}",
    "TWITTER_BEARER_TOKEN":"{{YOUR_TWITTER_BEARER_TOKEN}}"
  }'

# Create secrets for Cerebras AI
aws secretsmanager create-secret \
  --name bengaluru-cerebras-credentials \
  --description "Cerebras AI credentials" \
  --secret-string '{
    "CEREBRAS_API_KEY":"{{YOUR_CEREBRAS_API_KEY}}"
  }'
```

Replace `{{YOUR_*}}` with actual values from your `.env.local` file.

#### 5. Create Lambda Deployment Package

Create a script to build Lambda package:

```bash
#!/bin/bash
# scripts/build-lambda.sh

echo "Building Lambda deployment package..."

# Create build directory
rm -rf lambda-build
mkdir -p lambda-build

# Copy necessary files
cp -r src lambda-build/
cp -r lib lambda-build/
cp package.json lambda-build/
cp pnpm-lock.yaml lambda-build/

# Install production dependencies
cd lambda-build
pnpm install --prod --no-optional

# Create zip file
zip -r ../lambda-function.zip .

cd ..
echo "Lambda package created: lambda-function.zip"
```

Run it:

```bash
chmod +x scripts/build-lambda.sh
./scripts/build-lambda.sh
```

#### 6. Create Lambda Function

```bash
# Create IAM role for Lambda
aws iam create-role \
  --role-name bengaluru-twitter-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies (logging, DynamoDB, Secrets Manager)
aws iam attach-role-policy \
  --role-name bengaluru-twitter-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name bengaluru-twitter-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
  --role-name bengaluru-twitter-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# Get role ARN (you'll need this in next step)
aws iam get-role --role-name bengaluru-twitter-lambda-role --query 'Role.Arn' --output text
```

```bash
# Create Lambda function
aws lambda create-function \
  --function-name bengaluru-twitter-monitor \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/bengaluru-twitter-lambda-role \
  --handler src/api/cron/monitor-twitter.handler \
  --zip-file fileb://lambda-function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables={
    NODE_ENV=production,
    USE_DYNAMODB=true,
    AUTO_POST_REPLY=true,
    MONITOR_HANDLES="@GBA_office,@ICCCBengaluru"
  }
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID.

#### 7. Create EventBridge Rule (Cron)

```bash
# Create rule to trigger every hour
aws events put-rule \
  --name bengaluru-twitter-hourly \
  --schedule-expression "rate(1 hour)" \
  --description "Triggers Bengaluru Twitter monitor every hour"

# Add Lambda as target
aws events put-targets \
  --rule bengaluru-twitter-hourly \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:bengaluru-twitter-monitor"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name bengaluru-twitter-monitor \
  --statement-id bengaluru-twitter-hourly-event \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/bengaluru-twitter-hourly
```

#### 8. Test Lambda Function

```bash
# Invoke manually
aws lambda invoke \
  --function-name bengaluru-twitter-monitor \
  --invocation-type RequestResponse \
  --payload '{}' \
  response.json

# View response
cat response.json
```

#### 9. View Logs

```bash
# Get latest log stream
aws logs describe-log-streams \
  --log-group-name /aws/lambda/bengaluru-twitter-monitor \
  --order-by LastEventTime \
  --descending \
  --max-items 1

# View logs
aws logs tail /aws/lambda/bengaluru-twitter-monitor --follow
```

### Lambda Architecture Explained

**EventBridge (Scheduler)**:
- CloudWatch Events service that triggers Lambda on schedule
- Like cron but managed by AWS
- No server needed to run scheduler

**Lambda Function**:
- Serverless compute that runs your Node.js code
- Spins up when triggered, shuts down after execution
- Billed per 100ms of execution time

**DynamoDB (Rate Limit Storage)**:
- NoSQL database for storing rate limit state
- Replaces local JSON file (Lambda has no persistent disk)
- Fast, serverless, pay per request

**Secrets Manager**:
- Securely stores API keys and credentials
- Encrypted at rest and in transit
- No hardcoded secrets in code

**CloudWatch Logs**:
- Captures all console.log output
- Searchable and filterable
- Set up alerts on errors

## Vercel Setup (Easiest)

### Why Vercel?

- **Easiest**: Deploy with one command
- **Zero DevOps**: Fully managed
- **Free tier**: Sufficient for this project
- **Built-in Cron**: Native Next.js support

### Step-by-Step Setup

#### 1. Install Vercel CLI

```bash
pnpm add -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Update Rate Limiter for Vercel KV

Create `lib/rate-limiter-vercel.ts`:

```typescript
import { kv } from '@vercel/kv';
import type { RateLimitState } from './rate-limiter';

export class VercelRateLimiter {
  private static async getState(): Promise<RateLimitState> {
    const state = await kv.get<RateLimitState>('rate-limit-state');
    return state || { endpoints: {} };
  }

  private static async setState(state: RateLimitState): Promise<void> {
    await kv.set('rate-limit-state', state);
  }

  // Rest of rate limiter implementation...
}
```

#### 4. Configure Vercel Cron

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/monitor-twitter",
    "schedule": "0 * * * *"
  }]
}
```

This runs every hour at minute 0.

#### 5. Deploy

```bash
# Deploy to production
vercel --prod

# Set environment variables
vercel env add TWITTER_API_KEY
vercel env add TWITTER_API_SECRET
vercel env add TWITTER_ACCESS_TOKEN
vercel env add TWITTER_ACCESS_TOKEN_SECRET
vercel env add TWITTER_BEARER_TOKEN
vercel env add CEREBRAS_API_KEY
```

#### 6. Enable Vercel KV

```bash
# In Vercel dashboard:
# 1. Go to Storage tab
# 2. Create KV Database
# 3. Connect to your project
```

### Vercel Architecture Explained

**Vercel Cron**:
- Managed cron service by Vercel
- Triggers your API endpoint on schedule
- No additional cost

**Vercel KV**:
- Redis-based key-value store
- Replaces local JSON file
- Free tier: 30,000 requests/month

**Vercel Functions**:
- Serverless functions (like Lambda)
- Auto-scales
- Free tier: 100GB-hours/month

## EC2 Setup (Traditional)

### Why EC2?

- **Simple**: Like your laptop but in cloud
- **Full control**: Install anything
- **Free tier**: t2.micro for 12 months
- **Familiar**: Standard Linux server

### Step-by-Step Setup

#### 1. Launch EC2 Instance

```bash
# Create security group
aws ec2 create-security-group \
  --group-name bengaluru-twitter-sg \
  --description "Security group for Bengaluru Twitter bot"

# Allow SSH
aws ec2 authorize-security-group-ingress \
  --group-name bengaluru-twitter-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Launch instance (Ubuntu 22.04, t2.micro)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name YOUR_KEY_PAIR_NAME \
  --security-groups bengaluru-twitter-sg \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bengaluru-twitter-bot}]'
```

#### 2. Connect to Instance

```bash
# Get instance public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=bengaluru-twitter-bot" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# SSH into instance
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_INSTANCE_IP
```

#### 3. Setup Environment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 4. Deploy Application

```bash
# Clone repository
git clone YOUR_REPO_URL
cd bengaluru-infra-aiagent

# Install dependencies
pnpm install

# Create .env.local file
nano .env.local
# Paste your environment variables

# Build application
pnpm build

# Start with PM2
pm2 start pnpm --name bengaluru-twitter -- start

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

#### 5. Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl http://localhost:3000/api/cron/monitor-twitter >> /var/log/twitter-monitor.log 2>&1
```

#### 6. Setup Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/twitter-monitor

# Add this:
/var/log/twitter-monitor.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### EC2 Architecture Explained

**EC2 Instance**:
- Virtual server in AWS cloud
- Runs 24/7 (unlike Lambda)
- Full control over environment

**PM2 Process Manager**:
- Keeps Next.js running
- Auto-restarts on crash
- Logs management

**Cron Job**:
- Linux built-in scheduler
- Same as your laptop
- Triggers API endpoint hourly

## Production Checklist

### Before Deployment

- [ ] Test locally for 24 hours minimum
- [ ] Verify rate limiter working correctly
- [ ] Confirm all API keys are valid
- [ ] Check .gitignore includes .env files
- [ ] Review all console.log statements
- [ ] Test error scenarios (API down, rate limit hit)
- [ ] Document deployment process
- [ ] Set up rollback plan

### Security

- [ ] API keys in Secrets Manager (not code)
- [ ] IAM roles with minimal permissions
- [ ] Enable CloudTrail for audit logs
- [ ] Set up billing alerts
- [ ] Rotate keys every 90 days
- [ ] Review security group rules

### Monitoring

- [ ] CloudWatch alarms for errors
- [ ] SNS notifications for failures
- [ ] Track API usage metrics
- [ ] Monitor Twitter account health
- [ ] Set up weekly summary reports

### Testing

- [ ] Unit tests passing
- [ ] Integration tests for Twitter API
- [ ] Rate limiter tests
- [ ] Error handling tests
- [ ] Mock API responses tested

## Monitoring & Alerts

### CloudWatch Alarms (Lambda)

```bash
# Alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name bengaluru-twitter-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=bengaluru-twitter-monitor \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:your-sns-topic
```

### Custom Metrics

Add to your code:

```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch();

async function publishMetric(name: string, value: number) {
  await cloudwatch.putMetricData({
    Namespace: 'BengaluruTwitterBot',
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date(),
    }],
  });
}

// Usage
await publishMetric('RepliesPosted', 1);
await publishMetric('ComplaintsFound', complaintCount);
```

## Cost Optimization

### AWS Lambda Costs

**Current usage estimate**:
- Executions: 24 per day (hourly) = 720/month
- Duration: ~2 seconds per execution
- Memory: 512 MB

**Calculation**:
- Compute: 720 executions × 2 seconds = 1,440 seconds
- GB-seconds: 1,440 × 0.5 GB = 720 GB-seconds
- Cost: $0.0000166667 per GB-second
- Total: 720 × $0.0000166667 = $0.012/month

**Additional costs**:
- DynamoDB: ~$0.25/month (PAY_PER_REQUEST)
- Secrets Manager: $0.40/month per secret
- CloudWatch Logs: $0.50/month

**Total estimated cost**: $1-2/month

### Cost Reduction Tips

1. **Reduce Lambda Memory**: Try 256 MB if sufficient
2. **Optimize Code**: Faster execution = lower cost
3. **Batch Operations**: Process multiple tweets per run
4. **Use Free Tier**: First 1M requests/month free
5. **Set Billing Alerts**: Alert at $5/month

### Set Billing Alert

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create billing alarm (requires us-east-1 region)
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-5usd \
  --alarm-description "Alert when charges exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --dimensions Name=Currency,Value=USD
```

## Troubleshooting

### Lambda Function Not Triggering

**Check EventBridge rule**:
```bash
aws events describe-rule --name bengaluru-twitter-hourly
```

**Check Lambda permissions**:
```bash
aws lambda get-policy --function-name bengaluru-twitter-monitor
```

**Manually trigger**:
```bash
aws lambda invoke \
  --function-name bengaluru-twitter-monitor \
  --invocation-type RequestResponse \
  --payload '{}' \
  response.json
```

### Rate Limit Errors

**Check DynamoDB table**:
```bash
aws dynamodb scan --table-name twitter-rate-limits
```

**Reset rate limits**:
```bash
aws dynamodb delete-item \
  --table-name twitter-rate-limits \
  --key '{"endpoint":{"S":"mentionTimeline"}}'
```

### Twitter API Errors

**View Lambda logs**:
```bash
aws logs tail /aws/lambda/bengaluru-twitter-monitor --follow
```

**Check API credentials**:
```bash
aws secretsmanager get-secret-value --secret-id bengaluru-twitter-credentials
```

### High Costs

**View Lambda metrics**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=bengaluru-twitter-monitor \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

**Check DynamoDB costs**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=twitter-rate-limits \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

## Production Best Practices

1. **Start Small**: 1 reply per hour initially
2. **Monitor Closely**: Check logs daily for first week
3. **Have Rollback Plan**: Can disable quickly
4. **Test Failure Scenarios**: API down, rate limits, errors
5. **Document Everything**: Deployment steps, issues, solutions
6. **Set Up Alerts**: Know when things break
7. **Review Costs Weekly**: Ensure no surprises
8. **Rotate Credentials**: Every 90 days minimum
9. **Backup Configuration**: Save all IaC code
10. **Plan for Scale**: Design for 10x current usage

## Next Steps

1. Choose deployment option (Lambda recommended)
2. Follow setup steps carefully
3. Test in production with monitoring
4. Document any issues encountered
5. Optimize based on real usage
6. Consider adding features:
   - Dashboard for monitoring
   - Admin panel for manual control
   - Analytics and reporting
   - Multi-language support

## Support

If you encounter issues:
1. Check CloudWatch logs first
2. Verify all credentials valid
3. Test rate limiter separately
4. Try manual Lambda invocation
5. Review security group rules
6. Check billing for unexpected costs

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [EventBridge Documentation](https://docs.aws.amazon.com/eventbridge/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Vercel Documentation](https://vercel.com/docs)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
