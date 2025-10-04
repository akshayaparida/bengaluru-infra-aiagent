# Complete AI Tweet Code Flow - With All Changes

## 🔄 Full Flow Diagram

```
User Submits Report
    ↓
POST /api/reports (route.ts)
    ↓
[1] Save to Database
    ↓
[2] Auto-classify with AI (MCP Gateway)
    ↓
[3] Trigger notify endpoint
    ↓
POST /api/reports/{id}/notify (notify/route.ts)
    ↓
[4] Send Email (AI-generated)
    ↓
[5] Check AUTO_TWEET=true? 
    ↓ YES
POST /api/reports/{id}/tweet (tweet/route.ts)
    ↓
[6] Check SIMULATE_TWITTER?
    ├─ TRUE → Simulated Tweet (Skip to [14])
    └─ FALSE → Real Tweet Flow
         ↓
[7] 🆕 Check Daily Limit (Our New Code!)
    ├─ Over limit? → Return 429 error
    └─ Under limit? → Continue
         ↓
[8] Build Tweet Text with AI
    ├─ Call MCP Gateway (Cerebras Llama 3.3 70B)
    ├─ Get reverse geocoding (location name)
    └─ Get AI-generated tweet with:
        • Category emoji (🕳️💡🚨)
        • Description
        • 📍 Location emoji + location name
        • 🗺️ Map emoji + Google Maps link
        • @GBA_office @ICCCBengaluru handles
         ↓
[9] Upload Photo to Twitter (v1 API)
    ├─ Success → Get mediaId
    └─ Failure → Continue without photo
         ↓
[10] Post Tweet to Twitter (v2 API)
     With: text + mediaId + reply_settings
         ↓
[11] 🆕 Enhanced Error Handling (Our New Code!)
     ├─ Success → Get tweetId
     ├─ Error 429 → Log rate limit details
     └─ Other Error → Log and return error
         ↓
[12] Update Database
     Set: tweetedAt, tweetId
         ↓
[13] Return Success Response
         ↓
[14] UI Updates (DashboardView.tsx)
     Show: "Tweeted ✓ (view)" with link
```

## 📝 Step-by-Step Code Walkthrough

### [1] User Submits Report
**File:** `src/app/api/reports/route.ts`

```typescript
// User fills form and submits
const formData = {
  description: "Pothole blocking lane",
  lat: 12.9716,
  lng: 77.5946,
  photoPath: "upload-123.jpg"
};

// POST /api/reports
// Saves to database
```

### [2-3] Auto-classify and Notify
**File:** `src/app/api/reports/[id]/notify/route.ts`

```typescript
// Line 158-162
const shouldAutoTweet = String(process.env.AUTO_TWEET).toLowerCase() === 'true';
if (shouldAutoTweet) {
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  fetch(`${base}/api/reports/${id}/tweet`, { method: 'POST' }).catch(() => {});
}
```

**Environment:**
```bash
AUTO_TWEET=true          # Auto-tweet after email
APP_BASE_URL=http://localhost:3000
```

### [6] Check Simulation Mode ⚡ NEW
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 88-95)

```typescript
const simulate = String(process.env.SIMULATE_TWITTER).toLowerCase() !== 'false';
const text = await buildTweetText(...); // Generate AI tweet text

if (simulate) {
  // SIMULATION MODE - Don't post to real Twitter
  const simId = `sim-${Date.now()}`;  // Fake tweet ID
  await prisma.report.update({ 
    where: { id }, 
    data: { tweetedAt: new Date(), tweetId: simId } 
  });
  return NextResponse.json({ 
    ok: true, 
    simulated: true, 
    text,              // Show AI-generated text
    tweetId: simId 
  }, { status: 202 });
}
```

**Environment:**
```bash
SIMULATE_TWITTER=true   # For development
SIMULATE_TWITTER=false  # For real tweets (after reset!)
```

**What happens in simulation:**
- ✅ AI generates tweet text
- ✅ Database updated (tweetedAt, tweetId=sim-123...)
- ✅ UI shows "Tweeted ✓ (simulated)"
- ❌ Does NOT call Twitter API
- ❌ Does NOT consume rate limit

### [7] Daily Limit Check ⚡ NEW CODE
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 97-118)

```typescript
// Smart rate limiting: Check daily tweet count (Free tier: 17/day)
const dailyLimit = parseInt(process.env.TWITTER_DAILY_LIMIT || '15');
const today = new Date();
today.setHours(0, 0, 0, 0);  // Midnight IST

// Count real tweets today (exclude simulated)
const todayTweets = await prisma.report.count({
  where: {
    tweetedAt: { gte: today },
    tweetId: { not: { startsWith: 'sim-' } }
  }
});

// Check if we've hit limit
if (todayTweets >= dailyLimit) {
  console.warn(`[Twitter] Daily limit reached: ${todayTweets}/${dailyLimit} tweets today`);
  return NextResponse.json({
    ok: false,
    reason: 'daily_limit_reached',
    detail: `Daily tweet limit (${dailyLimit}) reached. Resets at midnight IST.`,
    tweetsToday: todayTweets,
    limit: dailyLimit
  }, { status: 429 });
}
```

**Environment:**
```bash
TWITTER_DAILY_LIMIT=15  # Conservative (real limit is 17)
```

**Why this is important:**
- ✅ Checks DB before calling Twitter API
- ✅ Prevents wasting failed API calls
- ✅ Fails fast with clear error message
- ✅ Conservative (15 vs 17) to stay safe

### [8] Build AI Tweet Text
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 9-78)

#### Step 8a: Get Location Name
```typescript
// Reverse geocoding to get human-readable location
const geoRes = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
  { headers: { 'User-Agent': 'BengaluruInfraAgent/1.0' } }
);

const geoData = await geoRes.json();
const addr = geoData.address || {};

// Build location string
if (addr.road && addr.suburb) {
  locationName = `${addr.road}, ${addr.suburb}`;  // "MG Road, Ashok Nagar"
}
```

#### Step 8b: Call MCP Gateway for AI Tweet ⚡ UPDATED
```typescript
const aiRes = await fetch(`${mcpBaseUrl}/tools/generate.tweet`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    description: desc,                    // "Pothole blocking lane"
    category: category,                   // "pothole"
    severity: severity,                   // "high"
    locationName: locationName,           // "MG Road, Ashok Nagar"
    landmark: landmark,                   // "MG Road"
    lat: lat,                            // 12.9716
    lng: lng,                            // 77.5946
    mapsLink: mapsLink,                  // "https://maps.google.com/?q=12.9716,77.5946"
    civicHandle: civicHandle,            // "@GBA_office"
    icccHandle: icccHandle,              // "@ICCCBengaluru"
  }),
  signal: AbortSignal.timeout(5000),
});

const data = await aiRes.json();
return data.tweet;  // Returns AI-generated tweet text
```

**MCP Gateway processes this** (we upgraded today):
```javascript
// File: mcp-gateway/server.js (Line 162-189)

// 1. Uses Llama 3.3 70B (upgraded from 3.1 8B)
model: 'llama3.3-70b'

// 2. Has 300 max_tokens (upgraded from 200)
max_tokens: 300

// 3. Smart template fallback if AI returns empty
if (tweetText.length < 30) {
  tweetText = `${emoji} ${description} 📍 ${location}`;
}

// 4. Ensures location emoji
if (!tweetText.includes('📍')) {
  tweetText = tweetText.replace(location, `📍 ${location}`);
}

// 5. Ensures map link
if (!tweetText.includes(mapsLink)) {
  tweetText = tweetText + ` 🗺️ ${mapsLink}`;
}

// 6. Ensures both handles
if (!tweetText.includes(handle)) {
  tweetText = tweetText + ' ' + handle;
}
if (!tweetText.includes(iccc)) {
  tweetText = tweetText + ' ' + iccc;
}
```

**AI-Generated Tweet Example:**
```
🕳️ Pothole blocking lane on MG Road 📍 MG Road, Ashok Nagar 🗺️ https://maps.google.com/?q=12.9716,77.5946 @GBA_office @ICCCBengaluru
```

### [9] Upload Photo to Twitter
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 133-145)

```typescript
// Upload photo as media attachment
let mediaId: string | undefined;
try {
  const photoPath = path.join(storageDir, report.photoPath);
  const mediaData = await fs.readFile(photoPath);
  
  // Use Twitter v1 API for media upload
  const upload = await client.v1.uploadMedia(mediaData, { 
    mimeType: 'image/jpeg' 
  });
  mediaId = upload;  // Get mediaId for tweet
} catch (photoErr) {
  console.warn('Photo upload to Twitter failed:', photoErr);
  // Continue without photo
}
```

### [10] Post Tweet to Twitter
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 147-159)

```typescript
// Post tweet with or without media
const tweetPayload: any = { 
  text,                           // AI-generated tweet text
  reply_settings: 'everyone'      // ⚡ Ensures appears in "Posts" not "Replies"
};

if (mediaId) {
  tweetPayload.media = { 
    media_ids: [mediaId]           // Attach photo
  };
}

// Call Twitter API v2
const result = await v2.tweet(tweetPayload);
const twId = result.data?.id || '';  // Get real tweet ID
```

**Why `reply_settings: 'everyone'`?**
- Without this: Tweet appears in "Replies" section (hidden)
- With this: Tweet appears in main "Posts" section (visible)
- This was a bug we fixed earlier!

### [11] Enhanced Error Handling ⚡ NEW CODE
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 161-185)

```typescript
} catch (err: any) {
  // Log detailed error for debugging (without secrets)
  console.error('[Twitter Error] Code:', err?.code);
  console.error('[Twitter Error] Message:', err?.message);
  console.error('[Twitter Error] Data:', JSON.stringify(err?.data || {}));
  console.error('[Twitter Error] RateLimit:', JSON.stringify(err?.rateLimit || {}));
  //                                                         ↑ Shows daily/monthly limits
  
  // Specific handling for rate limits
  const errorCode = String(err?.code || '');
  if (errorCode === '429' || err?.message?.includes('Too Many Requests')) {
    return NextResponse.json({ 
      ok: false, 
      reason: 'rate_limit_exceeded', 
      detail: err?.data?.detail || err?.message || 'Twitter rate limit exceeded',
      error: err?.data || {}
    }, { status: 429 });
  }
  
  // Generic error (don't leak secrets)
  return NextResponse.json({ 
    ok: false, 
    reason: 'twitter_post_failed', 
    detail: String(err?.code || err?.message || 'error'),
    hint: errorCode === '403' ? 'Check Twitter app permissions' : undefined
  }, { status: 502 });
}
```

**Rate limit error example:**
```json
{
  "rateLimit": {
    "day": {
      "limit": 17,
      "remaining": 0,        ← All used!
      "reset": 1759530271    ← Reset timestamp
    }
  }
}
```

### [12] Update Database
**File:** `src/app/api/reports/[id]/tweet/route.ts` (Line 159)

```typescript
// On success
await prisma.report.update({ 
  where: { id }, 
  data: { 
    tweetedAt: new Date(),        // Timestamp
    tweetId: twId                 // Real Twitter ID (not sim-...)
  } 
});
```

### [14] UI Display
**File:** `src/app/dashboard/DashboardView.tsx` (Line 167-173)

```typescript
{r.tweetedAt && (
  (r.tweetId && !r.tweetId.startsWith('sim-')) ? (
    // Real tweet - show link to Twitter
    <a href={`https://x.com/i/web/status/${r.tweetId}`} 
       target="_blank" 
       rel="noreferrer" 
       style={{ color: '#9ae6b4' }}>
      Tweeted ✓ (view)
    </a>
  ) : (
    // Simulated tweet
    <span style={{ color: '#9ae6b4' }}>
      Tweeted ✓ (simulated)
    </span>
  )
)}
```

## 🔑 Key Environment Variables

```bash
# MCP Gateway
MCP_BASE_URL=http://localhost:8008
CEREBRAS_API_KEY=csk-...

# Twitter Settings
SIMULATE_TWITTER=true              # false for real tweets
TWITTER_DAILY_LIMIT=15             # Conservative limit
AUTO_TWEET=true                    # Auto-tweet after email

# Twitter API Credentials
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
CIVIC_TWITTER_HANDLE=@GBA_office
```

## 📊 What Changed Today

| Component | Before | After |
|-----------|--------|-------|
| AI Model | Llama 3.1 8B | Llama 3.3 70B ⚡ |
| Max Tokens | 200 | 300 ⚡ |
| Location Emoji | Sometimes missing | Always included ⚡ |
| Map Link | Missing | Always included ⚡ |
| Daily Limit Check | None | Smart DB check ⚡ |
| Error Logging | Generic | Detailed rate limit info ⚡ |
| Simulation Mode | Basic | Enhanced with AI ⚡ |

## 🧪 Testing After Rate Limit Reset

### When reset happens (3:54 AM IST):

```bash
# 1. Enable real Twitter
cd /home/akshayaparida/bengaluru-infra-aiagent
sed -i 's/^SIMULATE_TWITTER=true/SIMULATE_TWITTER=false/' .env.local

# 2. Check settings
grep "SIMULATE_TWITTER\|TWITTER_DAILY_LIMIT" .env.local

# 3. Submit a test report at http://localhost:3000

# 4. Watch logs
tail -f .next-dev.log

# 5. Check database
docker exec biaiagent-postgres psql -U postgres -d infra -c \
  "SELECT description, \"tweetedAt\", \"tweetId\" FROM \"Report\" ORDER BY \"createdAt\" DESC LIMIT 1;"

# 6. Check your Twitter
# Go to https://x.com/akshayaparida28
# Should see new tweet!
```

## ✅ Success Indicators

**Database:**
```
tweetedAt: 2025-10-04 03:55:00      ← Real timestamp
tweetId: 1973860660099584001        ← Real Twitter ID (long number)
```

**API Response:**
```json
{
  "ok": true,
  "simulated": false,              ← Real tweet!
  "tweetId": "1973860660099584001",
  "hasMedia": true
}
```

**UI:**
```
Tweeted ✓ (view) ← Clickable link to Twitter
```

**Twitter:**
Tweet visible on your profile with:
- ✅ Category emoji
- ✅ Description
- ✅ 📍 Location emoji + name
- ✅ 🗺️ Map link
- ✅ Photo attached
- ✅ Both civic handles

---

**Status:** Ready for real tweets after 3:54 AM IST!  
**Time until reset:** ~28 minutes  
**Daily limit:** 15 tweets (conservative)  
**Monthly limit:** 500 writes
