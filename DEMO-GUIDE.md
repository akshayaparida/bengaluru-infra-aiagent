# Demo Guide - AI Tweet Generation

## Recording Demo on Smartphone (Tomorrow)

### Pre-Demo Checklist

#### 1. Start Services
```bash
cd ~/bengaluru-infra-aiagent

# Start database
docker start bia-postgres

# Start MCP Gateway (Cerebras AI)
docker start bia-mcp

# Start Next.js app
pnpm dev
```

#### 2. Verify Everything is Running
```bash
# Check database
docker ps | grep bia-postgres

# Check AI Gateway
curl http://localhost:8008/health
# Should return: {"status":"ok","service":"mcp-gateway","cerebras":"connected"}

# Check Next.js
curl http://localhost:3000
# Should return HTML
```

#### 3. Access on Smartphone
- Open browser on smartphone
- Go to: `http://<your-laptop-ip>:3000`
- Find laptop IP: `ip addr show | grep "inet " | grep -v 127.0.0.1`

---

## Demo Flow (What to Show)

### Step 1: Submit Report
1. Fill in description: "Large dangerous pothole causing accidents"
2. Select category (or let AI classify)
3. Upload photo of pothole
4. Get GPS location
5. Click **Submit Report**

### Step 2: AI Processing (Auto-happens)
You'll see these appear automatically:
- ✅ Report submitted
- 🤖 AI Classification: "pothole / high"
- 📧 Email sent (AI-generated formal email)

### Step 3: Manual Tweet (YOUR CONTROL)
- 📱 Button appears: "Ready to post AI-generated tweet?"
- **Click "Post AI Tweet to Twitter"** (this is your recording moment!)
- Watch loading: "Generating AI Tweet..."
- ✅ Tweet posted!

### Step 4: Verify on Dashboard
- Scroll to dashboard on right
- See your report with:
  - "Emailed ✓" badge
  - "Tweeted ✓" badge
  - Link to view tweet on Twitter

---

## What Makes This Demo Great

### AI Features to Highlight:
1. **Cerebras LLaMA 3.3 70B** - Sponsor tech, fastest AI
2. **Auto-Classification** - Pothole, severity detected by AI
3. **AI-Written Email** - Formal, professional language
4. **AI-Enhanced Tweet** - With emojis, urgency, location, handles

### Example AI Tweet Output:
```
🕳️ URGENT: Large dangerous pothole causing accidents - major traffic hazard 📍 Koramangala 🗺️ https://maps.google.com/?q=12.9352,77.6245 @GBA_office @ICCCBengaluru
```

---

## Current Configuration

### Twitter API Limits Saved ✅
- Cron monitor: STOPPED (no automatic API calls)
- Auto-tweet: DISABLED (manual control only)
- You have ~96 API calls available for demo

### AI Generation Status ✅
- MCP Gateway: Running with updated code
- Cerebras API: Connected
- Model: llama3.3-70b (latest, best)
- Real AI content: Working

---

## Recording Tips

### Good Recording Sequence:
1. **Start recording before clicking tweet button**
2. Show the "Post AI Tweet" button clearly
3. Click and show "Generating AI Tweet..." loading
4. Wait for "✅ Tweet posted"
5. Switch to Twitter app/browser
6. Show the actual tweet appeared on Twitter
7. Point out AI features: emoji, urgency, location, handles

### What to Say During Recording:
- "AI automatically classified this as high-severity pothole"
- "Cerebras LLaMA generated professional email in seconds"
- "Now posting AI-enhanced tweet with one click"
- "Notice the AI added urgency tag, emojis, and proper formatting"
- "Tweet appears instantly on Twitter with civic authority handles"

---

## Troubleshooting

### If AI Generation Fails:
```bash
# Check MCP Gateway logs
docker logs bia-mcp --tail 50

# Restart if needed
docker restart bia-mcp
```

### If Tweet Button Doesn't Appear:
- Make sure email sent successfully first
- Check browser console (F12) for errors
- Refresh page if needed

### If Tweet Fails:
- Check Twitter API rate limits
- Verify `SIMULATE_TWITTER=false` in .env.local (if you want real posts)
- Check Twitter credentials are valid

---

## After Demo

### To Review Generated Content:
```bash
# Check recent reports in database
docker exec -it bia-postgres psql -U postgres -d bengaluru_infra -c "SELECT id, description, category, severity, emailed_at, tweeted_at, tweet_id FROM reports ORDER BY created_at DESC LIMIT 5;"
```

### To View Tweets:
- Dashboard shows "Tweeted ✓ (view)" link
- Click to see on Twitter: `https://x.com/i/web/status/<tweet_id>`

---

## Important Notes

1. **Demo Mode**: Currently set to manual tweet control
2. **Real Twitter**: Tweets will actually post to Twitter (not simulated)
3. **API Limits**: You have enough for 3-5 demo reports safely
4. **Best Practice**: Test once before recording to ensure everything works

---

## Mobile Optimization

The UI is mobile-responsive:
- ✅ Touch-friendly buttons
- ✅ Large text for readability
- ✅ Smooth animations
- ✅ Proper spacing for fingers
- ✅ Status messages clearly visible

---

## Success Criteria

Your demo is successful if you show:
1. ✅ Photo upload from smartphone
2. ✅ GPS location captured
3. ✅ AI classification automatic
4. ✅ AI-generated email
5. ✅ Manual tweet button click
6. ✅ Loading animation during AI generation
7. ✅ Tweet appears on Twitter
8. ✅ Dashboard updates with badges

---

## Tech Stack to Mention (Interview/Presentation)

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **AI**: Cerebras LLaMA 3.3 70B (hackathon sponsor)
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 17.5
- **Maps**: Leaflet with OpenStreetMap
- **Twitter**: twitter-api-v2
- **Deployment**: Docker, AWS-ready

---

Good luck with your demo! 🎉

Remember: You now have FULL CONTROL over tweeting for demo purposes!
