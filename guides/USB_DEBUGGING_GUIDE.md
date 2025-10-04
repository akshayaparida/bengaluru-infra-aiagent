# USB Debugging Setup for Real Device Testing

## What We're Testing
- Real GPS location from phone
- Camera photo capture
- Touch interactions
- Performance on actual hardware
- Network requests over USB

## Current Status
✅ ADB installed: `/usr/bin/adb`
✅ Next.js running on port 3000
✅ Ready for USB debugging setup

---

## Step 1: Enable Developer Options on Your Android Phone

### On Your Phone:
1. Go to **Settings** > **About Phone**
2. Find **Build Number** (might be under "Software Information")
3. Tap **Build Number** 7 times rapidly
4. You'll see "You are now a developer!" message
5. Go back to **Settings** > **System** > **Developer Options**
6. Enable **USB Debugging**
7. Enable **Stay Awake** (keeps screen on while charging)

---

## Step 2: Connect Phone to Computer via USB

### Physical Connection:
1. Use a data-capable USB cable (not charge-only)
2. Plug phone into your Ubuntu laptop
3. On phone, select **File Transfer** or **MTP** mode when prompted

### Verify Connection:
```bash
# Check if phone is detected
adb devices
```

Expected output:
```
List of devices attached
ABC123XYZ    device
```

If you see "unauthorized", check your phone screen for permission dialog and tap "Allow".

---

## Step 3: Set Up Port Forwarding

This makes localhost:3000 accessible on your phone as localhost:3000.

```bash
# Forward port 3000 from laptop to phone
adb reverse tcp:3000 tcp:3000

# Verify forwarding
adb reverse --list
```

Expected output:
```
tcp:3000 tcp:3000
```

---

## Step 4: Test Database Connection (PostgreSQL)

Your app needs database access. Two options:

### Option A: Forward PostgreSQL Port (Recommended for Testing)
```bash
# Forward PostgreSQL port
adb reverse tcp:5432 tcp:5432

# Verify
adb reverse --list
```

### Option B: Use Network IP (If Option A doesn't work)
```bash
# Get your laptop's IP on local network
ip addr show | grep "inet " | grep -v 127.0.0.1

# Update DATABASE_URL in .env.local to use your IP instead of localhost
# Example: postgresql://user:password@192.168.1.100:5432/infra
```

---

## Step 5: Open App on Phone

### Method 1: Chrome Browser (Recommended)
1. Open **Chrome** on your phone
2. Navigate to: `http://localhost:3000`
3. You should see your Bengaluru Infra Agent app!

### Method 2: Launch via ADB
```bash
# Open Chrome with the URL
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3000"
```

---

## Step 6: Enable Chrome DevTools (Desktop Debugging)

Debug the mobile app from your laptop:

1. On **laptop**, open Chrome browser
2. Navigate to: `chrome://inspect#devices`
3. You'll see your phone listed
4. Click **Inspect** under the localhost:3000 tab
5. Now you can:
   - View console logs
   - Inspect network requests
   - Debug JavaScript
   - Test responsive design

---

## Step 7: Test App Features

### GPS Testing:
1. Open the app on phone
2. Click "Report Issue"
3. Click "Detect My Location"
4. Grant location permission when prompted
5. Wait for GPS lock (may take 10-30 seconds)
6. Verify location shows: "Near [road name], Bengaluru"

### Camera Testing:
1. Click "Take Photo" or "Upload Photo"
2. Grant camera permission when prompted
3. Take a photo of a pothole/issue
4. Verify photo preview appears

### Full Workflow Test:
1. Detect location (GPS)
2. Take photo (Camera)
3. Enter description
4. Submit report
5. Check if AI classification works
6. Verify email/tweet generation

---

## Troubleshooting

### Problem: `adb devices` shows "no permissions"
**Solution:**
```bash
# Fix udev rules
sudo usermod -aG plugdev $USER
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="*", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# Restart adb
adb kill-server
adb start-server
adb devices
```

### Problem: `adb devices` shows "unauthorized"
**Solution:**
1. Check phone screen for "Allow USB Debugging?" dialog
2. Tap "Always allow from this computer"
3. Tap "Allow"
4. Run `adb devices` again

### Problem: App doesn't load (ERR_CONNECTION_REFUSED)
**Solution:**
```bash
# Verify Next.js is running
curl http://localhost:3000

# Re-establish port forwarding
adb reverse --remove-all
adb reverse tcp:3000 tcp:3000
adb reverse tcp:5432 tcp:5432

# Check forwarding
adb reverse --list
```

### Problem: GPS not working
**Solution:**
1. Make sure location is enabled on phone
2. Grant location permission to Chrome
3. Try opening phone Settings > Location > App permissions > Chrome > Allow
4. Test outside or near a window for better GPS signal

### Problem: Camera not working
**Solution:**
1. Grant camera permission to Chrome
2. Phone Settings > Apps > Chrome > Permissions > Camera > Allow
3. Use HTTPS or localhost (camera requires secure context)

### Problem: Database connection failed
**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify port forwarding
adb reverse --list | grep 5432

# Test connection from laptop
psql $DATABASE_URL -c "SELECT 1;"
```

### Problem: Device not detected in `chrome://inspect`
**Solution:**
1. Enable "Discover USB devices" in chrome://inspect
2. On phone: Developer Options > "USB debugging" should be ON
3. Unplug and replug USB cable
4. Try a different USB port
5. Restart adb: `adb kill-server && adb start-server`

---

## Useful ADB Commands

```bash
# List connected devices
adb devices -l

# View device info
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# View phone logs in real-time
adb logcat | grep -i "chrome\|browser"

# Take screenshot from phone
adb exec-out screencap -p > phone-screenshot.png

# Install APK (if you build one later)
adb install -r app.apk

# View phone's IP (if needed)
adb shell ip addr show wlan0

# Open Developer Options on phone
adb shell am start -n com.android.settings/.DevelopmentSettings

# Clear Chrome cache
adb shell pm clear com.android.chrome

# Restart phone
adb reboot
```

---

## Testing Checklist

- [ ] Phone detected: `adb devices` shows device
- [ ] Port forwarding active: `adb reverse --list` shows ports
- [ ] App loads: Chrome shows http://localhost:3000
- [ ] GPS works: Location detected with street name
- [ ] Camera works: Can take photo
- [ ] Photo upload works: Can select from gallery
- [ ] Report submission works: Form submits successfully
- [ ] AI classification works: Category/severity detected
- [ ] Network tab in DevTools shows API calls
- [ ] No console errors in DevTools

---

## Performance Testing

### Check Network Speed:
1. Open DevTools (chrome://inspect)
2. Go to Network tab
3. Reload page
4. Check:
   - Page load time < 3 seconds
   - API responses < 1 second
   - Image uploads < 5 seconds

### Check Memory Usage:
1. DevTools > Performance tab
2. Record a full workflow
3. Check for memory leaks
4. Verify smooth 60fps scrolling

### Check Battery Impact:
1. Use app for 10 minutes
2. Check battery drain in phone settings
3. Should be minimal (<5% for 10 min usage)

---

## Production Testing Notes

### Real-World Scenarios to Test:
1. **Poor GPS Signal**: Test indoors vs outdoors
2. **Slow Network**: Enable 3G mode in Developer Options
3. **Low Storage**: Fill phone storage to 90%
4. **Low Battery**: Test with <20% battery
5. **Interruptions**: Test with incoming calls/notifications
6. **App Switching**: Background/foreground the app
7. **Orientation**: Test portrait and landscape modes

### Location Testing:
Test at actual Bengaluru locations:
- MG Road
- Koramangala
- Whitefield
- Indiranagar

Verify reverse geocoding shows correct area names.

---

## Security Notes

⚠️ **USB Debugging Security:**
- Only enable when needed for development
- Disable before giving phone to others
- "Always allow" authorization is per-computer (secure)
- USB debugging won't work if phone is locked (secure)

⚠️ **Port Forwarding:**
- Only forwards to your phone (not network-wide)
- Removed when USB disconnected (automatic cleanup)
- Can be manually cleared: `adb reverse --remove-all`

---

## Next Steps After Testing

If everything works:
1. Document test results in TEST_RESULTS.md
2. Take screenshots of working features
3. Record demo video for hackathon
4. Note any bugs or improvements needed
5. Test with multiple phones if available (different Android versions)

If issues found:
1. Check console logs in DevTools
2. Review network requests
3. Fix bugs and retest
4. Update this guide with solutions

---

## Quick Start Commands

```bash
# Complete setup (run these in order)
adb devices                              # 1. Check phone connected
adb reverse tcp:3000 tcp:3000           # 2. Forward web app port
adb reverse tcp:5432 tcp:5432           # 3. Forward database port
adb reverse --list                       # 4. Verify forwarding
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3000"  # 5. Open app

# Open DevTools on laptop
# Navigate to: chrome://inspect#devices
```

---

## Why This Approach Works

**Technical Explanation:**

1. **ADB Reverse Port Forwarding**: 
   - Maps phone's localhost:3000 to laptop's localhost:3000
   - TCP tunnel over USB connection
   - Much faster than WiFi (480 Mbps USB 2.0 vs ~100 Mbps WiFi)

2. **Chrome DevTools Remote Debugging**:
   - Uses Chrome DevTools Protocol (CDP)
   - Communicates over USB ADB connection
   - Full debugging capabilities without network overhead

3. **Why Not Just WiFi?**:
   - USB is faster and more stable
   - No network configuration needed
   - Works without WiFi/mobile data
   - More secure (no network exposure)

4. **Production Readiness**:
   - Tests real device hardware (GPS, camera)
   - Real touch interactions
   - Actual performance metrics
   - Battery and memory impact

This is standard industry practice for mobile web development and used by companies like Google, Facebook, and Uber for testing Progressive Web Apps (PWAs).
