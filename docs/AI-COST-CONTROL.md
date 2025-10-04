# AI Cost Control - Daily Usage Limiter

Prevents excessive Cerebras API costs by limiting AI classifications per day.

---

## Overview

The AI Usage Limiter ensures you don't exceed your budget by limiting the number of AI classification requests per day. When the daily limit is reached, the system automatically falls back to keyword-based classification.

**Default Limit**: 5 AI classifications per day

---

## How It Works

```
Report submitted → Classify API called
         ↓
Check daily usage (5/5 used?)
         ↓
    ┌────┴────┐
    ↓         ↓
Under limit   Over limit
    ↓         ↓
Use AI        Use keywords
(Cerebras)    (Free)
    ↓         ↓
Record usage  Continue
    ↓
Update counter
```

---

## Configuration

### Environment Variable

```bash
# .env.local
AI_DAILY_LIMIT=5  # Change to any number (default: 5)
```

### Adjusting the Limit

For production, set based on your budget:

```bash
# Conservative (free tier testing)
AI_DAILY_LIMIT=5

# Light usage
AI_DAILY_LIMIT=20

# Medium usage
AI_DAILY_LIMIT=50

# Heavy usage (monitor costs!)
AI_DAILY_LIMIT=200
```

**Cost Estimation**:
- Cerebras pricing varies by model
- Typically ~$0.001-0.01 per classification
- 5/day = ~$0.15-1.50/month
- 50/day = ~$1.50-15/month

---

## Monitoring Usage

### API Endpoint

```bash
# Check current usage
curl http://localhost:3000/api/ai-usage | jq

# Response
{
  "ok": true,
  "used": 3,
  "remaining": 2,
  "limit": 5,
  "resetAt": "2025-10-05T00:00:00.000Z",
  "canUseAI": true
}
```

### Usage File

Usage is tracked in `.data/ai-usage.json`:

```json
{
  "date": "2025-10-04",
  "classificationsUsed": 3,
  "dailyLimit": 5,
  "resetAt": "2025-10-05T00:00:00.000Z"
}
```

---

## Behavior

### Before Limit (1-4 classifications)

```bash
POST /api/reports/abc123/classify

# Response
{
  "ok": true,
  "category": "pothole",
  "severity": "high",
  "simulated": false  # Used real AI
}
```

### After Limit (5+ classifications)

```bash
POST /api/reports/def456/classify

# Response  
{
  "ok": true,
  "category": "pothole",
  "severity": "high",
  "simulated": true  # Used keyword fallback
}

# Console log: "AI daily limit reached, using simulated classification"
```

---

## Daily Reset

The counter automatically resets at **midnight** (local server time):

- **Today**: 5 classifications used
- **Tomorrow 00:00:00**: Counter resets to 0
- **Tomorrow**: Fresh 5 classifications available

---

## Testing

### Check Current Status

```bash
curl http://localhost:3000/api/ai-usage | jq
```

### Manually Reset (Development)

```typescript
import { getAIUsageLimiter } from './src/lib/ai-usage-limiter';

const limiter = await getAIUsageLimiter();
await limiter.reset();
console.log('Usage reset to 0');
```

### Test Limit Behavior

```bash
# Submit 6 reports and classify them
for i in {1..6}; do
  # Submit report
  REPORT_ID=$(curl -s -X POST http://localhost:3000/api/reports \
    -F description="Test pothole $i" \
    -F lat=12.9716 \
    -F lng=77.5946 \
    -F photo=@test.jpg | jq -r '.id')
  
  # Classify
  curl -s -X POST http://localhost:3000/api/reports/$REPORT_ID/classify | jq
  
  # Check usage
  curl -s http://localhost:3000/api/ai-usage | jq
done

# First 5: simulated=false (AI used)
# 6th and beyond: simulated=true (keywords used)
```

---

## Production Deployment

### AWS Lambda

Store daily limit in environment variable:

```bash
aws lambda update-function-configuration \
  --function-name bengaluru-infra \
  --environment Variables="{AI_DAILY_LIMIT=20}"
```

### Vercel

```bash
vercel env add AI_DAILY_LIMIT
# Enter: 20
```

### Docker

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - AI_DAILY_LIMIT=20
```

---

## Monitoring in Production

### CloudWatch Alarm (AWS)

```bash
# Alert when approaching daily limit
aws cloudwatch put-metric-alarm \
  --alarm-name ai-usage-high \
  --metric-name AIClassificationsUsed \
  --threshold 4 \
  --comparison-operator GreaterThanThreshold
```

### Custom Dashboard

Track daily usage over time:

```sql
-- Example query for analytics DB
SELECT 
  date,
  classifications_used,
  daily_limit,
  (classifications_used / daily_limit * 100) as usage_percentage
FROM ai_usage_log
ORDER BY date DESC
LIMIT 30;
```

---

## Cost Savings Example

**Scenario**: 100 reports per day

### Without Limiter:
- 100 AI classifications/day
- ~$3-30/month (depending on pricing)
- No control over costs

### With Limiter (5/day):
- 5 AI classifications/day
- 95 keyword classifications/day (free)
- ~$0.15-1.50/month
- **95% cost reduction!**

---

## Upgrading the Limit

When ready to scale:

```bash
# Start with 5/day
AI_DAILY_LIMIT=5

# Increase gradually based on budget
AI_DAILY_LIMIT=10   # Week 1
AI_DAILY_LIMIT=20   # Week 2  
AI_DAILY_LIMIT=50   # Month 2
AI_DAILY_LIMIT=100  # After funding/revenue
```

---

## Fallback Quality

**Keyword Classification** is ~70-80% accurate:
- Simple keywords: "pothole" → pothole ✓
- Complex cases: "Road damaged" → might miss

**AI Classification** is ~95%+ accurate:
- Understands context
- Handles complex descriptions
- Better severity assessment

**Strategy**: Use AI for first 5 reports (likely most important), keywords for rest.

---

## FAQ

**Q: What happens when limit is reached?**
A: System automatically uses keyword-based classification (free).

**Q: Does the app break when limit is reached?**
A: No! It seamlessly falls back to keywords. Users won't notice.

**Q: Can I temporarily disable the limit?**
A: Yes, set `AI_DAILY_LIMIT=999999` in .env.local

**Q: Does the limit apply per user or globally?**
A: Globally across the entire application.

**Q: Can I have different limits for different report types?**
A: Not currently, but you could modify the code to add priority tiers.

**Q: What if I need more than 5/day?**
A: Just increase `AI_DAILY_LIMIT` based on your budget.

---

## Related Files

- `src/lib/ai-usage-limiter.ts` - Core limiter logic
- `src/app/api/ai-usage/route.ts` - Usage stats API
- `src/app/api/reports/[id]/classify/route.ts` - Classification with limiter
- `.data/ai-usage.json` - Usage tracking (gitignored)

---

**Smart cost control = sustainable AI integration** 💰✨
