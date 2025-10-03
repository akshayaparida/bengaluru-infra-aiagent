#!/bin/bash
# USB Debugging Setup Script for Bengaluru Infra AI Agent
# This script automates the setup process for testing on Android device

set -e

echo "=========================================="
echo "USB Debugging Setup for Android Testing"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if ADB is installed
echo -e "${BLUE}[1/7]${NC} Checking ADB installation..."
if ! command -v adb &> /dev/null; then
    echo -e "${RED}✗ ADB not found!${NC}"
    echo "Install with: sudo apt-get install android-tools-adb android-tools-fastboot"
    exit 1
fi
echo -e "${GREEN}✓ ADB installed: $(which adb)${NC}"
echo ""

# Step 2: Check if Next.js is running
echo -e "${BLUE}[2/7]${NC} Checking Next.js server..."
if ! ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${YELLOW}⚠ Next.js not running on port 3000${NC}"
    echo "Start it with: pnpm dev"
    read -p "Do you want to start it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting Next.js in background..."
        pnpm dev > logs/nextjs.log 2>&1 &
        echo "Waiting 5 seconds for server to start..."
        sleep 5
    else
        echo -e "${RED}✗ Please start Next.js first${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Next.js running on port 3000${NC}"
echo ""

# Step 3: Check PostgreSQL
echo -e "${BLUE}[3/7]${NC} Checking PostgreSQL database..."
if ! docker ps | grep -q postgres; then
    echo -e "${YELLOW}⚠ PostgreSQL not running${NC}"
    echo "Start it with: docker compose up -d postgres"
    read -p "Do you want to start it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose up -d postgres
        echo "Waiting 3 seconds for database to start..."
        sleep 3
    else
        echo -e "${YELLOW}⚠ Continuing without database (some features may not work)${NC}"
    fi
else
    echo -e "${GREEN}✓ PostgreSQL running${NC}"
fi
echo ""

# Step 4: Check for connected devices
echo -e "${BLUE}[4/7]${NC} Checking for connected Android devices..."
adb kill-server > /dev/null 2>&1 || true
adb start-server > /dev/null 2>&1

DEVICE_COUNT=$(adb devices | grep -c "device$" || true)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No Android devices detected${NC}"
    echo ""
    echo "Please follow these steps:"
    echo "1. Enable Developer Options on your phone:"
    echo "   - Go to Settings > About Phone"
    echo "   - Tap Build Number 7 times"
    echo "2. Enable USB Debugging:"
    echo "   - Settings > System > Developer Options"
    echo "   - Enable USB Debugging"
    echo "3. Connect phone via USB cable"
    echo "4. Select 'File Transfer' mode on phone"
    echo "5. Allow USB debugging on phone screen"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✓ Found $DEVICE_COUNT Android device(s)${NC}"
adb devices -l
echo ""

# Check for unauthorized devices
if adb devices | grep -q "unauthorized"; then
    echo -e "${YELLOW}⚠ Device is unauthorized${NC}"
    echo "Please check your phone screen and tap 'Allow' on the USB debugging dialog"
    echo "Make sure to check 'Always allow from this computer'"
    read -p "Press Enter after allowing..." 
    echo ""
fi

# Step 5: Set up port forwarding
echo -e "${BLUE}[5/7]${NC} Setting up port forwarding..."

# Remove any existing forwards
adb reverse --remove-all > /dev/null 2>&1 || true

# Forward Next.js port
echo "  → Forwarding port 3000 (Next.js)..."
if adb reverse tcp:3000 tcp:3000; then
    echo -e "  ${GREEN}✓ Port 3000 forwarded${NC}"
else
    echo -e "  ${RED}✗ Failed to forward port 3000${NC}"
    exit 1
fi

# Forward PostgreSQL port
echo "  → Forwarding port 5432 (PostgreSQL)..."
if adb reverse tcp:5432 tcp:5432; then
    echo -e "  ${GREEN}✓ Port 5432 forwarded${NC}"
else
    echo -e "  ${YELLOW}⚠ Failed to forward port 5432 (database may not work)${NC}"
fi

# Forward MCP Gateway port (if running)
if ss -tlnp 2>/dev/null | grep -q ":8008"; then
    echo "  → Forwarding port 8008 (MCP Gateway)..."
    if adb reverse tcp:8008 tcp:8008; then
        echo -e "  ${GREEN}✓ Port 8008 forwarded${NC}"
    else
        echo -e "  ${YELLOW}⚠ Failed to forward port 8008 (AI features may not work)${NC}"
    fi
fi

echo ""
echo "Active port forwards:"
adb reverse --list
echo ""

# Step 6: Open app on phone
echo -e "${BLUE}[6/7]${NC} Opening app on phone..."
if adb shell am start -a android.intent.action.VIEW -d "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ App opened in Chrome on phone${NC}"
else
    echo -e "${YELLOW}⚠ Failed to open app automatically${NC}"
    echo "Please open Chrome on your phone and navigate to: http://localhost:3000"
fi
echo ""

# Step 7: Instructions for DevTools
echo -e "${BLUE}[7/7]${NC} Remote debugging setup..."
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. On your phone:"
echo "   → App should be open in Chrome at http://localhost:3000"
echo "   → Grant location and camera permissions when prompted"
echo ""
echo "2. On your laptop:"
echo "   → Open Chrome browser"
echo "   → Navigate to: chrome://inspect#devices"
echo "   → Click 'Inspect' under the localhost:3000 tab"
echo "   → You can now debug the mobile app from your laptop!"
echo ""
echo "=========================================="
echo "Testing Checklist:"
echo "=========================================="
echo ""
echo "Test these features on your phone:"
echo "  □ Click 'Report Issue'"
echo "  □ Click 'Detect My Location' (grant permission)"
echo "  □ Wait for GPS lock (10-30 seconds)"
echo "  □ Verify location name appears"
echo "  □ Click 'Take Photo' or 'Upload Photo'"
echo "  □ Take/select a photo"
echo "  □ Enter description"
echo "  □ Submit report"
echo "  □ Check AI classification"
echo "  □ View report in dashboard"
echo ""
echo "=========================================="
echo "Useful Commands:"
echo "=========================================="
echo ""
echo "  adb devices              → List connected devices"
echo "  adb reverse --list       → Show active port forwards"
echo "  adb logcat | grep Chrome → View phone logs"
echo "  adb shell screencap -p > screenshot.png → Take screenshot"
echo ""
echo "To stop port forwarding:"
echo "  adb reverse --remove-all"
echo ""
echo "For troubleshooting, see: USB_DEBUGGING_GUIDE.md"
echo ""
