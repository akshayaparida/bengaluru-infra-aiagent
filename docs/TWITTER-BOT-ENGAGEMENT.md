# Twitter Bot - Social Listening & Engagement

## 🤖 AI Bot Capabilities

### **What the Bot Can Do:**

1. **Monitor Twitter for Infrastructure Complaints**
   - Search for keywords: "pothole", "streetlight", "garbage", "BBMP", "Bengaluru infra"
   - Track mentions of @BBMPCOMM
   - Monitor location-tagged tweets from Bengaluru

2. **AI Analysis**
   - Classify complaint type (pothole, streetlight, etc.)
   - Detect severity (high, medium, low)
   - Extract location from tweet text
   - Understand sentiment (angry, concerned, urgent)

3. **Engage Like a Human (But Disclose It's AI)**
   - Reply to complaints with helpful information
   - Ask for more details (photo, exact location)
   - Tag @BBMPCOMM for serious issues
   - Provide report ID for tracking
   - Thank users for reporting

4. **Aggregate Similar Complaints**
   - Group complaints about same location
   - Create summary threads
   - Show patterns to authorities

---

## 📋 Implementation Plan

### **Phase 1: Social Listening (Search & Monitor)**

```typescript
// Listen for infrastructure complaints
const searchQuery = `
  (pothole OR streetlight OR "broken road" OR garbage OR "water leak") 
  (Bengaluru OR Bangalore OR BBMP) 
  -is:retweet 
  lang:en
`;

// Or monitor mentions of BBMP
const mentionQuery = `@BBMPCOMM -is:retweet`;
```

### **Phase 2: AI Analysis**

Each tweet gets analyzed:
```
Input: "Huge pothole near Koramangala 5th block, very dangerous #Bangalore"

AI Analysis:
- Category: Pothole
- Severity: High (keyword: "dangerous")
- Location: Koramangala 5th block
- Sentiment: Concerned
- Action: Tag authority, offer to file report
```

### **Phase 3: Engagement Strategy**

Bot replies:
```
🤖 Hi! I'm BLR Infra AI Bot. I can help report this to @BBMPCOMM.

Could you share:
📷 A photo of the pothole?
📍 Exact location/pin?

I'll create an official report with tracking ID. 
This helps authorities prioritize!

[Automated Bot - Powered by AI]
```

### **Phase 4: Authority Tagging**

For serious issues:
```
@BBMPCOMM - Multiple citizens reporting large pothole at Koramangala 
5th Block junction. High severity - safety risk. 

Reports:
• Tweet by @citizen1 (with photo)
• Tweet by @citizen2 (confirmed)
• Tweet by @citizen3 (traffic affected)

Aggregate report created: ID #BIA-2025-001
Location: 12.9352, 77.6245

Please prioritize repair. #BengaluruInfra
```

---

## 🔧 Technical Implementation

### **1. Twitter Streaming API**

```typescript
// Stream tweets in real-time
const stream = await client.v2.searchStream({
  'tweet.fields': ['geo', 'created_at', 'author_id'],
  expansions: ['author_id', 'geo.place_id']
});

for await (const tweet of stream) {
  // AI analyzes each tweet
  const analysis = await analyzeComplaint(tweet.data.text);
  
  if (analysis.isInfraIssue) {
    await engageWithUser(tweet, analysis);
  }
}
```

### **2. AI Analysis with Cerebras**

```typescript
async function analyzeComplaint(tweetText: string) {
  const prompt = `Analyze this tweet for Bengaluru infrastructure issues:

"${tweetText}"

Is this an infrastructure complaint? If yes, extract:
- Category: pothole/streetlight/garbage/water/other
- Severity: low/medium/high
- Location: if mentioned
- Sentiment: angry/concerned/informational
- Should tag authority: yes/no

Respond with JSON.`;

  const response = await cerebrasAPI(prompt);
  return JSON.parse(response);
}
```

### **3. Engagement Templates**

```typescript
const engagementTemplates = {
  pothole: {
    high: `🤖 I've detected a high-severity pothole report. Tagging @BBMPCOMM for urgent attention.
    
Can you share:
📷 Photo of the damage
📍 Exact location/Google Maps pin

This helps authorities respond faster! Reply to this thread.

[AI Bot - Not monitored for DMs]`,
    
    medium: `🤖 Thanks for reporting this pothole! I can help escalate to @BBMPCOMM.

Could you provide:
📷 A clear photo
📍 Precise location

I'll create a tracked report. Usually addressed within 7 days.

[Automated Bot]`,
  },
  
  streetlight: {
    high: `🤖 Multiple streetlight outages affect safety. Escalating to @BBMPCOMM.
    
Details needed:
📍 Exact street/area
🕐 How long has it been out?
📊 How many lights affected?

[AI Infrastructure Bot]`,
  },
  
  aggregate: `🤖 SUMMARY: 5 reports about potholes near Koramangala received.

@BBMPCOMM - Pattern detected requiring attention:

1. Tweet by @user1 - 12.9352, 77.6245
2. Tweet by @user2 - Same location confirmed
3. Tweet by @user3 - With photo evidence
4. Tweet by @user4 - Traffic delays reported
5. Tweet by @user5 - Safety concern

Aggregate Report ID: #BIA-2025-042
Priority: HIGH (multiple reports + photo evidence)

[Automated Analysis - BLR Infra AI Bot]`,
};
```

### **4. Rate Limiting & Ethics**

```typescript
// Respect Twitter limits
const rateLimiter = {
  replies: 50, // per day
  mentions: 100, // per day
  cooldown: 3600 // seconds between same user interaction
};

// Don't spam users
const interactionHistory = new Map();

async function canEngageWithUser(userId: string): Promise<boolean> {
  const lastInteraction = interactionHistory.get(userId);
  if (lastInteraction) {
    const timeSince = Date.now() - lastInteraction;
    return timeSince > rateLimiter.cooldown * 1000;
  }
  return true;
}
```

---

## 🎯 Example Interactions

### **Scenario 1: Single User Complaint**

**User Tweet:**
```
@BBMPCOMM there's a huge pothole on Indiranagar 100ft road. 
Been there for weeks! Someone will get hurt. #FixOurRoads
```

**Bot Reply (within 5 mins):**
```
🤖 Hi! I'm BLR Infra AI Bot - I help escalate infrastructure issues.

I see you've already tagged @BBMPCOMM - great! To improve response:

📷 Can you reply with a photo?
📍 Confirm location: Indiranagar 100ft Road, near which cross?

I'll create a tracked report with your details. Authorities typically 
respond to photo-verified reports 2x faster.

Report will get ID for tracking.

[Automated Bot - Powered by Cerebras AI]
```

**If user replies with photo:**
```
🤖 ✅ Report filed!

Report ID: #BIA-2025-043
Category: Road Damage (Pothole)
Severity: High
Location: Indiranagar 100ft Road
Photo: Attached
Status: Sent to @BBMPCOMM

You can track at: https://blr-infra-agent.local/reports/BIA-2025-043

Typically resolved within 7-14 days. I'll monitor and follow up if needed.

[Automated Infrastructure Bot]
```

---

### **Scenario 2: Multiple Users, Same Issue**

**After 3+ tweets about same pothole:**

**Bot creates aggregate thread:**
```
🤖 ALERT: Multiple citizens reporting same issue

@BBMPCOMM - High-priority pothole at Koramangala 5th Block junction

📊 Data:
• 5 reports in 24 hours
• 2 photo confirmations
• Average severity: High
• Traffic affected: Yes

🔗 Reports:
1. @user1 (photo attached)
2. @user2 (confirmed same spot)
3. @user3 (near-miss accident)
4. @user4 (measuring ~3ft deep)
5. @user5 (affecting ambulance route)

📍 Location: 12.9352, 77.6245
Aggregate ID: #BIA-AGG-2025-008

This requires immediate attention. Citizens are waiting for update.

[BLR Infra AI Bot - Automated Analysis]
```

---

### **Scenario 3: Grateful Citizen**

**User:**
```
@BengaluruInfraBot Thanks! The pothole on MG Road was fixed!
Report #BIA-2025-015
```

**Bot Reply:**
```
🤖 🎉 That's wonderful news!

Marking Report #BIA-2025-015 as RESOLVED.

Thanks for confirming! This data helps:
• Track @BBMPCOMM response times
• Show government efficiency  
• Encourage more reporting

Your feedback makes Bengaluru better. 🙏

Keep reporting issues - together we build better infrastructure!

[Automated Bot - Community Powered]
```

---

## ⚠️ Important: Ethics & Transparency

### **Always Disclose It's a Bot:**

Every tweet MUST include:
- 🤖 Bot emoji
- "Automated Bot" or "AI Bot" in reply
- "[Not monitored for DMs]" or similar
- Link to GitHub/about page

### **Don't:**
- ❌ Pretend to be human
- ❌ Engage in arguments
- ❌ Make promises authorities can't keep
- ❌ Spam users
- ❌ Reply to political content
- ❌ Store personal data unnecessarily

### **Do:**
- ✅ Be helpful and factual
- ✅ Respect rate limits
- ✅ Provide value (report IDs, tracking)
- ✅ Tag authorities appropriately
- ✅ Learn from interactions
- ✅ Thank users for reporting

---

## 🚀 Implementation Steps

### **For Your Demo:**

**Phase 1** (Tomorrow): 
- ✅ Bot posts reports automatically
- ✅ Show tweet with @BBMPCOMM tagging
- ✅ Explain future capability

**Phase 2** (Post-Demo):
- Monitor Twitter for keywords
- Analyze with AI
- Reply to select users
- Aggregate similar complaints

**Phase 3** (Production):
- Full social listening
- Pattern detection
- Authority escalation
- Community engagement

---

## 💡 Demo Script Addition

**When showing Twitter features, say:**

> "Right now, the bot automatically posts when citizens report through our app. 
> 
> But we're building Phase 2: **Social Listening**. The bot will monitor Twitter 
> for infrastructure complaints, analyze them with AI, and engage citizens - 
> asking for photos, confirming locations, and aggregating similar issues.
> 
> If 5 people tweet about the same pothole, the bot creates one consolidated 
> report to @BBMPCOMM with all evidence. This prevents duplicate reports and 
> shows patterns authorities might miss.
> 
> The bot will always disclose it's AI - transparent, helpful, and ethical."

---

## 📊 Value Proposition

### **Why This Matters:**

1. **Reach More Citizens**
   - Many people tweet, not all use apps
   - Meet citizens where they are
   - Lower barrier to reporting

2. **Better Data**
   - Aggregate similar complaints
   - Show patterns and hotspots
   - Photo evidence collection

3. **Faster Response**
   - Real-time monitoring
   - Immediate authority tagging
   - 24/7 availability

4. **Community Building**
   - Citizens see action happening
   - Transparency increases trust
   - Positive feedback loop

---

## ✅ For Your Hackathon:

This feature shows:
- 🤖 **Advanced AI usage** (NLP, sentiment analysis)
- 🌐 **Social listening** (real-world data)
- 💬 **Natural language engagement**
- 📊 **Data aggregation** (pattern detection)
- 🎯 **Civic impact** (reaching more people)

**This makes your project stand out as truly intelligent and impactful!**

---

Want me to implement Phase 1 (monitoring and basic replies) before the demo?
