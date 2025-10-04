#!/bin/bash
# AWS Cost Monitoring Script
# Checks current month's AWS costs and alerts if over budget

set -e

BUDGET_LIMIT=5  # $5 budget limit
PROFILE="admin1"  # Your AWS profile from notebook

echo "======================================"
echo "AWS Cost Monitor"
echo "======================================"
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install: https://aws.amazon.com/cli/"
    exit 1
fi

# Login reminder
echo "ℹ️  Make sure you're logged in: aws sso login --profile $PROFILE"
echo ""

# Get current month dates
START_DATE=$(date +%Y-%m-01)
END_DATE=$(date +%Y-%m-%d)

echo "📅 Checking costs from $START_DATE to $END_DATE"
echo ""

# Get cost data
echo "🔍 Fetching AWS cost data..."
COST=$(aws ce get-cost-and-usage \
  --profile $PROFILE \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --query 'ResultsByTime[0].Total.UnblendedCost.Amount' \
  --output text 2>/dev/null)

if [ -z "$COST" ]; then
    echo "❌ Could not fetch cost data. Check:"
    echo "   1. AWS CLI is configured"
    echo "   2. You're logged in: aws sso login --profile $PROFILE"
    echo "   3. You have Cost Explorer permissions"
    exit 1
fi

# Convert to number for comparison
COST_INT=$(echo "$COST" | cut -d. -f1)

echo "======================================"
echo "💰 Current Month AWS Costs"
echo "======================================"
echo ""
printf "Total Spent: \$%.2f\n" "$COST"
printf "Budget Limit: \$%d.00\n" "$BUDGET_LIMIT"
echo ""

# Alert if over budget
if (( $(echo "$COST > $BUDGET_LIMIT" | bc -l) )); then
    echo "🚨 ⚠️  WARNING: Over Budget! 🚨"
    echo ""
    echo "You've spent \$$COST this month (budget: \$$BUDGET_LIMIT)"
    echo ""
    echo "Recommended actions:"
    echo "1. Stop unused EC2 instances"
    echo "2. Delete unused load balancers"
    echo "3. Stop RDS databases"
    echo "4. Review CloudWatch logs (they cost money!)"
    echo "5. Run emergency stop script: ./scripts/emergency-stop-aws.sh"
    echo ""
    echo "To see detailed breakdown:"
    echo "aws ce get-cost-and-usage \\"
    echo "  --profile $PROFILE \\"
    echo "  --time-period Start=$START_DATE,End=$END_DATE \\"
    echo "  --granularity DAILY \\"
    echo "  --metrics \"UnblendedCost\" \\"
    echo "  --group-by Type=SERVICE"
    echo ""
else
    echo "✅ Within Budget!"
    REMAINING=$(echo "$BUDGET_LIMIT - $COST" | bc)
    printf "Remaining: \$%.2f\n" "$REMAINING"
    echo ""
fi

# Show top services by cost
echo "======================================"
echo "Top 5 Services by Cost"
echo "======================================"
echo ""

aws ce get-cost-and-usage \
  --profile $PROFILE \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=SERVICE \
  --query 'ResultsByTime[0].Groups[?Metrics.UnblendedCost.Amount > `0`] | sort_by(@, &Metrics.UnblendedCost.Amount) | reverse(@)[:5].[Keys[0], Metrics.UnblendedCost.Amount]' \
  --output table 2>/dev/null || echo "Could not fetch service breakdown"

echo ""
echo "======================================"
echo "Cost Optimization Tips"
echo "======================================"
echo ""
echo "1. Use Vercel + Supabase instead (FREE)"
echo "2. Stop resources when not in use"
echo "3. Use AWS Free Tier only (t2.micro, etc.)"
echo "4. Delete old snapshots and AMIs"
echo "5. Enable AI usage limiter (AI_DAILY_LIMIT=5)"
echo ""
echo "To deploy for FREE: See docs/ZERO-COST-DEPLOYMENT.md"
echo ""
