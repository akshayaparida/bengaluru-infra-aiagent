# MCP Gateway - What It Is & Why It's Offline

## Quick Answer

**MCP Gateway = AI-powered microservice for generating smart content**

It's currently **OFFLINE** but your app **still works** - it just uses fallback templates instead of AI-generated content.

---

## What is MCP Gateway?

### Definition
**MCP (Model Context Protocol) Gateway** is a small HTTP server that wraps Cerebras AI API calls. It provides AI-powered features to your infrastructure reporting app.

### Why It Exists
For the **hackathon**, Cerebras LLaMA is a **sponsored technology** (one of your "lifeline" techs to win). The MCP Gateway makes it easy to use Cerebras AI throughout your app.

---

## What Does It Do? (AI Features)

The MCP Gateway provides **3 AI-powered endpoints**:

### 1. **Report Classification** (`/tools/classify.report`)
**Purpose:** Automatically categorize and assess severity of reports

**Input:**
```json
{
  "description": "Large pothole near metro station causing accidents"
}
```

**AI-Generated Output:**
```json
{
  "category": "pothole",
  "severity": "high",
  "simulated": false
}
```

**Real-world example:**
- User reports: "Street light not working near school"
- AI classifies: category="streetlight", severity="medium"

---

### 2. **Email Generation** (`/tools/generate.email`)
**Purpose:** Create professional civic emails to authorities

**Input:**
```json
{
  "description": "Pothole on MG Road",
  "category": "pothole",
  "severity": "high",
  "lat": 12.9716,
  "lng": 77.5946
}
```

**AI-Generated Output:**
```json
{
  "subject": "Urgent: Pothole Repair Required on MG Road",
  "body": "Dear Civic Authority, We wish to bring to your attention a high-severity pothole at MG Road (12.9716, 77.5946). This poses significant safety risks to motorists and pedestrians. We request immediate inspection and repair work. Thank you for your attention to this matter."
}
```

**Without AI (Fallback):**
```
Subject: "🚨 Infrastructure Report: Pothole on MG Road"
Body: "Basic template with coordinates and description"
```

---

### 3. **Tweet Generation** (`/tools/generate.tweet`)
**Purpose:** Create engaging, professional tweets for civic awareness

**Input:**
```json
{
  "description": "Pothole blocking lane",
  "category": "pothole",
  "severity": "high",
  "locationName": "MG Road, Ashok Nagar",
  "landmark": "MG Road",
  "lat": 12.9716,
  "lng": 77.5946,
  "mapsLink": "https://maps.google.com/?q=12.9716,77.5946",
  "civicHandle": "@GBA_office"
}
```

**AI-Generated Output:**
```
🕳️ Pothole blocking lane on MG Road causing severe traffic delays and safety risks
📍 MG Road, Ashok Nagar
🗺️ https://maps.google.com/?q=12.9716,77.5946
@GBA_office please address urgently!
```

**Without AI (Fallback):**
```
🚨 pothole issue: Pothole blocking lane
📍 12.971600, 77.594600
🗺️ https://maps.google.com/?q=12.9716,77.5946
@GBA_office please address urgently!
```

---

## Why Is It Offline?

### Current Status
```bash
# MCP Gateway is NOT running
# Check with:
curl http://localhost:8008/health
# Returns: Connection refused
```

### Reasons It Might Be Offline

1. **Not Started**
   - MCP Gateway server is not running
   - Need to start it manually

2. **Port Conflict**
   - `.env.local` has `MCP_BASE_URL=http://localhost:8009`
   - But server defaults to port `8008`
   - Port mismatch!

3. **Cerebras API Key**
   - MCP Gateway requires `CEREBRAS_API_KEY`
   - Already in your `.env` file: ✅
   - But MCP Gateway reads it separately

---

## Impact of MCP Gateway Being Offline

### ✅ **Still Works:**
- Email sending ✅ (uses fallback templates)
- Tweet posting ✅ (uses fallback templates)
- Report submission ✅
- All core features ✅

### ❌ **Missing AI Features:**
- No AI-generated email subject/body (uses template)
- No AI-generated tweets (uses template)
- No automatic classification (would need manual category)

### **Comparison:**

| Feature | With MCP Gateway | Without (Current) |
|---------|------------------|-------------------|
| Email Subject | "Urgent: Pothole Repair on MG Road" | "🚨 Infrastructure Report: Pothole..." |
| Email Body | Professional, contextual | Generic template |
| Tweet | Engaging, with landmark | Basic with coordinates |
| Classification | Auto-detected | Manual/default |
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (functional) |

---

## How to Start MCP Gateway

### Option 1: Start Manually

**Step 1: Check your port configuration**
```bash
# In .env.local:
grep MCP_BASE_URL ~/.env.local
# If it shows port 8009, change it to 8008 OR
# Set PORT=8009 when starting the server
```

**Step 2: Start the MCP Gateway**
```bash
cd /home/akshayaparida/bengaluru-infra-aiagent

# Start on default port 8008
CEREBRAS_API_KEY=csk-e4wfwnd698n9ft8p25r9958c4e4w89kym9y6w8fc2c2cmcxr node mcp-gateway/server.js &

# OR start on port 8009 (to match .env.local)
PORT=8009 CEREBRAS_API_KEY=csk-e4wfwnd698n9ft8p25r9958c4e4w89kym9y6w8fc2c2cmcxr node mcp-gateway/server.js &
```

**Step 3: Verify it's running**
```bash
curl http://localhost:8009/health
# Should return: {"status":"ok","service":"mcp-gateway","cerebras":"connected"}
```

### Option 2: Start as Background Service

```bash
cd /home/akshayaparida/bengaluru-infra-aiagent

# Start in background with logs
nohup node mcp-gateway/server.js > /tmp/mcp-gateway.log 2>&1 &

# Check logs
tail -f /tmp/mcp-gateway.log
```

---

## Testing MCP Gateway

### Test 1: Health Check
```bash
curl http://localhost:8009/health
```

Expected:
```json
{"status":"ok","service":"mcp-gateway","cerebras":"connected"}
```

### Test 2: Classification
```bash
curl -X POST http://localhost:8009/tools/classify.report \
  -H "Content-Type: application/json" \
  -d '{"description":"Large pothole near metro causing accidents"}'
```

Expected:
```json
{"category":"pothole","severity":"high","simulated":false}
```

### Test 3: Email Generation
```bash
curl -X POST http://localhost:8009/tools/generate.email \
  -H "Content-Type: application/json" \
  -d '{
    "description":"Pothole on MG Road",
    "category":"pothole",
    "severity":"high",
    "lat":12.9716,
    "lng":77.5946
  }'
```

Expected:
```json
{
  "subject":"Urgent: Pothole Repair Required on MG Road",
  "body":"Professional civic email..."
}
```

### Test 4: Tweet Generation
```bash
curl -X POST http://localhost:8009/tools/generate.tweet \
  -H "Content-Type: application/json" \
  -d '{
    "description":"Pothole blocking lane",
    "category":"pothole",
    "severity":"high",
    "locationName":"MG Road, Ashok Nagar",
    "landmark":"MG Road",
    "lat":12.9716,
    "lng":77.5946,
    "mapsLink":"https://maps.google.com/?q=12.9716,77.5946",
    "civicHandle":"@GBA_office"
  }'
```

Expected:
```json
{
  "tweet":"🕳️ Pothole blocking lane on MG Road...\n📍 MG Road, Ashok Nagar\n..."
}
```

---

## Technical Details

### Architecture
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Next.js    │ HTTP  │ MCP Gateway  │ HTTPS │  Cerebras    │
│   App        │──────▶│  (Node.js)   │──────▶│  LLaMA API   │
│ (Port 3000)  │       │ (Port 8008)  │       │  (Cloud)     │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Why Separate Service?

1. **Hackathon Requirement:** Cerebras is a sponsored tech
2. **Modularity:** Easy to swap AI providers
3. **Rate Limiting:** Control API calls in one place
4. **Caching:** Could add response caching
5. **Testing:** Easy to mock AI responses

### Tech Stack
- **Runtime:** Node.js (plain JavaScript)
- **HTTP Server:** Native Node.js `http` module
- **AI Model:** Cerebras LLaMA 3.1 8B
- **API:** Cerebras Chat Completions API

---

## Do You Need It?

### For Development: **Optional**
- App works fine without it
- Fallback templates are functional
- Good for quick testing

### For Hackathon Demo: **RECOMMENDED**
- Shows AI integration (sponsor requirement)
- Better quality content
- Impressive demo factor
- Fulfills "Cerebras LLaMA" requirement

### For Production: **REQUIRED**
- Better user experience
- Professional output
- Automatic classification
- Scalable AI features

---

## Summary

### What MCP Gateway Does:
✅ AI-powered report classification  
✅ Professional email generation  
✅ Engaging tweet composition  
✅ Uses Cerebras LLaMA (hackathon sponsor)  

### Current Status:
❌ Offline (not running)  
✅ App still works (fallback templates)  
✅ Cerebras API key configured  
⚠️ Port mismatch (8008 vs 8009)  

### To Enable AI Features:
1. Fix port in `.env.local` OR set PORT when starting
2. Start MCP Gateway: `PORT=8009 node mcp-gateway/server.js &`
3. Verify: `curl http://localhost:8009/health`
4. Test report submission - emails/tweets will be AI-generated!

### Interview/Production Context:
- **Microservices Architecture:** Separate AI concerns
- **Graceful Degradation:** App works even if AI is down
- **Hackathon Strategy:** Use sponsored tech (Cerebras) to win
- **Scalability:** Easy to add more AI features
- **Cost Management:** Control API usage centrally

---

## Quick Start (TL;DR)

```bash
# Fix port in .env.local
sed -i 's/MCP_BASE_URL=http:\/\/localhost:8008/MCP_BASE_URL=http:\/\/localhost:8009/' /home/akshayaparida/bengaluru-infra-aiagent/.env.local

# Start MCP Gateway
cd /home/akshayaparida/bengaluru-infra-aiagent
PORT=8009 CEREBRAS_API_KEY=csk-e4wfwnd698n9ft8p25r9958c4e4w89kym9y6w8fc2c2cmcxr nohup node mcp-gateway/server.js > /tmp/mcp-gateway.log 2>&1 &

# Test
curl http://localhost:8009/health

# Now submit a report - emails will be AI-generated! 🤖
```

Want me to start it for you?
