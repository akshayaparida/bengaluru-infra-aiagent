#!/bin/bash
# Emergency AWS Resource Shutdown
# STOPS ALL AWS RESOURCES TO PREVENT FURTHER CHARGES
# ⚠️  USE WITH CAUTION - THIS WILL STOP PRODUCTION SERVICES ⚠️

set -e

PROFILE="admin1"  # Your AWS profile
DRY_RUN=true  # Set to false to actually stop resources

echo "🚨🚨🚨 EMERGENCY AWS RESOURCE SHUTDOWN 🚨🚨🚨"
echo ""
echo "This script will STOP all running AWS resources to prevent charges."
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "⚠️  DRY RUN MODE - No resources will be stopped"
    echo "   To actually stop resources, edit this script and set DRY_RUN=false"
    echo ""
else
    echo "❌ LIVE MODE - Resources WILL BE STOPPED"
    echo ""
    read -p "Are you SURE you want to stop ALL AWS resources? (type YES): " confirm
    if [ "$confirm" != "YES" ]; then
        echo "Cancelled."
        exit 0
    fi
    echo ""
fi

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found."
    exit 1
fi

echo "======================================"
echo "1. Stopping EC2 Instances"
echo "======================================"
echo ""

RUNNING_INSTANCES=$(aws ec2 describe-instances \
  --profile $PROFILE \
  --query 'Reservations[].Instances[?State.Name==`running`].[InstanceId,Tags[?Key==`Name`].Value|[0]]' \
  --output text 2>/dev/null)

if [ -z "$RUNNING_INSTANCES" ]; then
    echo "✓ No running EC2 instances found"
else
    echo "Found running instances:"
    echo "$RUNNING_INSTANCES"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        echo "$RUNNING_INSTANCES" | awk '{print $1}' | while read instance_id; do
            echo "Stopping $instance_id..."
            aws ec2 stop-instances --profile $PROFILE --instance-ids "$instance_id"
        done
        echo "✓ All EC2 instances stopped"
    else
        echo "[DRY RUN] Would stop these instances"
    fi
fi

echo ""
echo "======================================"
echo "2. Stopping RDS Databases"
echo "======================================"
echo ""

RDS_INSTANCES=$(aws rds describe-db-instances \
  --profile $PROFILE \
  --query 'DBInstances[?DBInstanceStatus==`available`].[DBInstanceIdentifier]' \
  --output text 2>/dev/null)

if [ -z "$RDS_INSTANCES" ]; then
    echo "✓ No running RDS instances found"
else
    echo "Found running RDS instances:"
    echo "$RDS_INSTANCES"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        echo "$RDS_INSTANCES" | while read db_id; do
            echo "Stopping $db_id..."
            aws rds stop-db-instance --profile $PROFILE --db-instance-identifier "$db_id"
        done
        echo "✓ All RDS instances stopped"
    else
        echo "[DRY RUN] Would stop these databases"
    fi
fi

echo ""
echo "======================================"
echo "3. Deleting Load Balancers"
echo "======================================"
echo ""

LOAD_BALANCERS=$(aws elbv2 describe-load-balancers \
  --profile $PROFILE \
  --query 'LoadBalancers[].[LoadBalancerArn,LoadBalancerName]' \
  --output text 2>/dev/null)

if [ -z "$LOAD_BALANCERS" ]; then
    echo "✓ No load balancers found"
else
    echo "Found load balancers:"
    echo "$LOAD_BALANCERS"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        echo "$LOAD_BALANCERS" | awk '{print $1}' | while read lb_arn; do
            echo "Deleting $lb_arn..."
            aws elbv2 delete-load-balancer --profile $PROFILE --load-balancer-arn "$lb_arn"
        done
        echo "✓ All load balancers deleted"
    else
        echo "[DRY RUN] Would delete these load balancers"
    fi
fi

echo ""
echo "======================================"
echo "4. Stopping ECS Tasks"
echo "======================================"
echo ""

ECS_CLUSTERS=$(aws ecs list-clusters --profile $PROFILE --query 'clusterArns[]' --output text 2>/dev/null)

if [ -z "$ECS_CLUSTERS" ]; then
    echo "✓ No ECS clusters found"
else
    echo "Found ECS clusters:"
    echo "$ECS_CLUSTERS"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        echo "$ECS_CLUSTERS" | while read cluster; do
            echo "Stopping tasks in $cluster..."
            TASKS=$(aws ecs list-tasks --profile $PROFILE --cluster "$cluster" --query 'taskArns[]' --output text)
            if [ ! -z "$TASKS" ]; then
                echo "$TASKS" | while read task; do
                    aws ecs stop-task --profile $PROFILE --cluster "$cluster" --task "$task"
                done
            fi
        done
        echo "✓ All ECS tasks stopped"
    else
        echo "[DRY RUN] Would stop all ECS tasks"
    fi
fi

echo ""
echo "======================================"
echo "5. Listing Other Potential Costs"
echo "======================================"
echo ""

echo "Checking for other resources..."
echo ""

# NAT Gateways
echo "NAT Gateways:"
aws ec2 describe-nat-gateways --profile $PROFILE --query 'NatGateways[?State==`available`].[NatGatewayId]' --output text 2>/dev/null || echo "None found"

# Elastic IPs (unattached)
echo ""
echo "Unattached Elastic IPs:"
aws ec2 describe-addresses --profile $PROFILE --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' --output text 2>/dev/null || echo "None found"

# S3 Buckets (showing count only)
echo ""
echo "S3 Buckets:"
aws s3 ls --profile $PROFILE 2>/dev/null | wc -l | xargs echo "Count:" || echo "Could not list"

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "✓ DRY RUN COMPLETE - No resources were stopped"
    echo ""
    echo "To actually stop resources:"
    echo "1. Edit this script"
    echo "2. Change DRY_RUN=false"
    echo "3. Run again"
    echo ""
else
    echo "✓ EMERGENCY STOP COMPLETE"
    echo ""
    echo "All major resources have been stopped/deleted."
    echo ""
    echo "Note: You may still see charges for:"
    echo "- Data transfer that occurred before shutdown"
    echo "- Stopped RDS instances (still charged for storage)"
    echo "- EBS volumes (delete manually if not needed)"
    echo "- Elastic IPs (release manually)"
    echo "- NAT Gateways (delete manually)"
    echo ""
    echo "To avoid future charges, consider:"
    echo "1. Use Vercel + Supabase (FREE)"
    echo "2. See: docs/ZERO-COST-DEPLOYMENT.md"
    echo ""
fi

echo "Check current costs: ./scripts/check-aws-costs.sh"
echo ""
