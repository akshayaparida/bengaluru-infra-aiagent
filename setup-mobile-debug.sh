#!/bin/bash
# USB Debugging Setup for Bengaluru Infra AI Agent
# For testing app on Android phone via USB

echo "🔧 Setting up USB debugging..."

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Installing..."
    sudo apt update
    sudo apt install -y android-tools-adb android-tools-fastboot
fi

echo "✅ ADB version:"
adb version | head -1

echo ""
echo "📱 Checking connected devices..."
adb devices -l

# Count devices
DEVICE_COUNT=$(adb devices | grep -c "device$")

if [ $DEVICE_COUNT -eq 0 ]; then
    echo "❌ No devices connected!"
    echo ""
    echo "📋 Steps to connect your phone:"
    echo "1. Enable Developer Options on your phone:"
    echo "   Settings → About Phone → Tap 'Build Number' 7 times"
    echo ""
    echo "2. Enable USB Debugging:"
    echo "   Settings → Developer Options → USB Debugging (ON)"
    echo ""
    echo "3. Connect phone via USB cable"
    echo ""
    echo "4. On phone: Tap 'Allow' when USB debugging prompt appears"
    echo ""
    echo "5. Run this script again"
    exit 1
fi

echo "✅ Device connected!"

echo ""
echo "🔌 Setting up port forwarding..."

# Forward Next.js dev server (3000)
adb reverse tcp:3000 tcp:3000
if [ $? -eq 0 ]; then
    echo "✅ Port 3000 (Next.js) → Phone"
else
    echo "❌ Failed to forward port 3000"
fi

# Forward MCP Gateway (8008)
adb reverse tcp:8008 tcp:8008
if [ $? -eq 0 ]; then
    echo "✅ Port 8008 (MCP Gateway) → Phone"
else
    echo "❌ Failed to forward port 8008"
fi

# Forward Mailpit (1025, 8025)
adb reverse tcp:8025 tcp:8025 2>/dev/null
adb reverse tcp:1025 tcp:1025 2>/dev/null

# Forward PostgreSQL (5432) - optional
adb reverse tcp:5432 tcp:5432 2>/dev/null

echo ""
echo "📋 Active port forwards:"
adb reverse --list

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 On your phone, open Chrome and go to:"
echo "   http://localhost:3000"
echo ""
echo "🎯 To test GPS features:"
echo "   1. Allow location permissions when prompted"
echo "   2. Tap 'Get GPS location' button"
echo "   3. Submit a test report with photo"
echo ""
echo "🔍 To debug:"
echo "   Chrome DevTools: chrome://inspect"
echo "   ADB logs: adb logcat | grep -i bengaluru"
echo ""
echo "🛑 To disconnect:"
echo "   adb reverse --remove-all"
