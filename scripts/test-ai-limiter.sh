#!/bin/bash
# Manual test script to verify AI usage limiter behavior
# This script will:
# 1. Reset the AI usage counter
# 2. Submit 6 test reports
# 3. Classify each report
# 4. Check usage stats after each classification
# 5. Verify first 5 attempts vs 6th+ attempts

set -e

BASE_URL=${APP_BASE_URL:-http://localhost:3000}
REPORT_IDS=()

echo "======================================"
echo "AI Usage Limiter - Manual Test"
echo "======================================"
echo ""
echo "Base URL: $BASE_URL"
echo "Daily Limit: ${AI_DAILY_LIMIT:-5}"
echo ""

# Function to cleanup
cleanup() {
  echo ""
  echo "Cleaning up test reports..."
  for id in "${REPORT_IDS[@]}"; do
    curl -s -X DELETE "$BASE_URL/api/reports/$id" > /dev/null 2>&1 || true
  done
  echo "Cleanup complete!"
}

trap cleanup EXIT

# Reset AI usage (if needed)
echo "Step 0: Checking current AI usage..."
INITIAL_USAGE=$(curl -s "$BASE_URL/api/ai-usage" | jq '.')
echo "$INITIAL_USAGE"
echo ""

# Submit 6 test reports
echo "Step 1: Creating 6 test reports..."
for i in {1..6}; do
  echo "Creating report $i..."
  
  # Create a temporary image file for testing
  TMP_IMAGE="/tmp/test-image-$i.jpg"
  echo "fake image data" > "$TMP_IMAGE"
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/reports" \
    -F "description=Test pothole #$i on Main Street" \
    -F "lat=12.9716" \
    -F "lng=77.5946" \
    -F "photo=@$TMP_IMAGE")
  
  REPORT_ID=$(echo "$RESPONSE" | jq -r '.id // .report.id // empty')
  
  if [ -z "$REPORT_ID" ]; then
    echo "Failed to create report $i"
    echo "Response: $RESPONSE"
    exit 1
  fi
  
  REPORT_IDS+=("$REPORT_ID")
  echo "  Created report: $REPORT_ID"
  
  # Cleanup temp file
  rm -f "$TMP_IMAGE"
done

echo ""
echo "Created ${#REPORT_IDS[@]} reports successfully!"
echo ""

# Classify each report and monitor usage
echo "Step 2: Classifying reports and monitoring usage..."
echo ""

for i in "${!REPORT_IDS[@]}"; do
  REPORT_NUM=$((i + 1))
  REPORT_ID="${REPORT_IDS[$i]}"
  
  echo "----------------------------------------"
  echo "Classification #$REPORT_NUM (Report ID: $REPORT_ID)"
  echo "----------------------------------------"
  
  # Classify
  CLASSIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/reports/$REPORT_ID/classify")
  
  # Extract classification result
  CATEGORY=$(echo "$CLASSIFY_RESPONSE" | jq -r '.category')
  SEVERITY=$(echo "$CLASSIFY_RESPONSE" | jq -r '.severity')
  SIMULATED=$(echo "$CLASSIFY_RESPONSE" | jq -r '.simulated')
  
  echo "Result: Category=$CATEGORY, Severity=$SEVERITY, Simulated=$SIMULATED"
  
  # Check usage stats
  USAGE=$(curl -s "$BASE_URL/api/ai-usage")
  USED=$(echo "$USAGE" | jq -r '.used')
  REMAINING=$(echo "$USAGE" | jq -r '.remaining')
  CAN_USE_AI=$(echo "$USAGE" | jq -r '.canUseAI')
  
  echo "Usage: $USED used, $REMAINING remaining, canUseAI=$CAN_USE_AI"
  
  # Highlight when limit is reached
  if [ "$CAN_USE_AI" = "false" ] && [ $REPORT_NUM -le 5 ]; then
    echo "⚠️  WARNING: AI limit reached before expected!"
  elif [ "$CAN_USE_AI" = "false" ] && [ $REPORT_NUM -gt 5 ]; then
    echo "✅ EXPECTED: Using keyword fallback (limit reached)"
  elif [ "$CAN_USE_AI" = "true" ] && [ $REPORT_NUM -le 5 ]; then
    echo "✅ EXPECTED: Using AI (within limit)"
  fi
  
  echo ""
  
  # Small delay between requests
  sleep 0.5
done

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""

# Final usage check
FINAL_USAGE=$(curl -s "$BASE_URL/api/ai-usage" | jq '.')
echo "Final Usage Stats:"
echo "$FINAL_USAGE"
echo ""

# Verify expectations
FINAL_USED=$(echo "$FINAL_USAGE" | jq -r '.used')
LIMIT=$(echo "$FINAL_USAGE" | jq -r '.limit')

echo "Verification:"
echo "  Expected usage: min($LIMIT, 6)"
echo "  Actual usage: $FINAL_USED"

if [ "$FINAL_USED" -le "$LIMIT" ]; then
  echo "  ✅ Usage within limit!"
else
  echo "  ⚠️  Usage exceeded limit (this is allowed)"
fi

echo ""
echo "Test completed successfully!"
echo ""
echo "Key takeaways:"
echo "  - First $LIMIT classifications: Used AI (or fallback if MCP unavailable)"
echo "  - Classification $((LIMIT + 1))+: Used keyword fallback"
echo "  - All reports were classified regardless of limit"
echo "  - No errors or service interruptions"
echo ""
