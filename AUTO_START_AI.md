# Auto-Start AI with Server

## ✅ Problem Solved!

Now the **MCP Gateway (AI)** starts automatically with your server - no manual steps needed!

---

## 🚀 Quick Start (Choose One Method)

### **Method 1: Using pnpm (Recommended)**

```bash
# Start everything (Next.js + AI)
pnpm dev:all

# Stop everything
pnpm stop
```

### **Method 2: Using bash scripts directly**

```bash
# Start everything
./start-all.sh

# Stop everything
./stop-all.sh
```

### **Method 3: Start services separately** (if needed)

```bash
# Terminal 1: Start AI only
pnpm dev:ai

# Terminal 2: Start Next.js only
pnpm dev
```

---

## 🎯 What Happens When You Run `pnpm dev:all`?

### **Step 1: Cleanup** 🧹
- Kills any existing Next.js or MCP Gateway processes
- Ensures clean start

### **Step 2: Start MCP Gateway (AI)** 🤖
- Starts on port **8009**
- Loads Cerebras API key from `.env` or `.env.local`
- Runs health check
- Logs to `logs/mcp-gateway.log`

### **Step 3: Start Next.js** ⚡
- Starts on port **3000**
- Waits until fully ready
- Logs to `logs/nextjs.log`

### **Step 4: Show Status** ✅
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All services started successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Next.js App:       http://localhost:3000
🤖 MCP Gateway (AI):  http://localhost:8009

📊 Service Status:
   MCP Gateway PID:   12345
   Next.js PID:       12346
```

---

## 📝 Viewing Logs

### **Live logs** (all services):
```bash
tail -f logs/nextjs.log logs/mcp-gateway.log
```

### **Separate logs:**
```bash
# Next.js logs
tail -f logs/nextjs.log

# MCP Gateway (AI) logs
tail -f logs/mcp-gateway.log
```

---

## 🛑 Stopping Services

### **Clean shutdown:**
```bash
pnpm stop
# OR
./stop-all.sh
```

### **Force kill:**
```bash
pkill -f "next dev"
pkill -f "mcp-gateway"
```

### **Stop individual services:**
```bash
# Stop Next.js only
pkill -f "next dev"

# Stop MCP Gateway only
pkill -f "node mcp-gateway"
```

---

## ✅ What's Improved?

### **Before (Manual):**
```bash
# Terminal 1
node mcp-gateway/server.js

# Terminal 2 (wait a few seconds)
pnpm dev

# Have to remember to start AI every time
# Have to manage 2 terminals
```

### **After (Automatic):**
```bash
# Just one command!
pnpm dev:all

# Both services start automatically
# AI is always available
# Easy to stop with pnpm stop
```

---

## 🔍 Troubleshooting

### **Issue: Port 3000 already in use**

**Solution:**
```bash
# Stop all services first
pnpm stop

# Then restart
pnpm dev:all
```

### **Issue: MCP Gateway health check fails**

**Check:**
1. Is `CEREBRAS_API_KEY` set in `.env` or `.env.local`?
2. View logs: `tail -f logs/mcp-gateway.log`
3. Test manually: `curl http://localhost:8009/health`

**Common causes:**
- Missing Cerebras API key
- Port 8009 already in use
- Network/firewall issues

### **Issue: AI features not working**

**Verify MCP Gateway is running:**
```bash
curl http://localhost:8009/health
```

**Expected response:**
```json
{"status":"ok","service":"mcp-gateway","cerebras":"connected"}
```

**If not working:**
```bash
# Check if it's running
ps aux | grep mcp-gateway

# Check logs
tail -50 logs/mcp-gateway.log

# Restart everything
pnpm stop && pnpm dev:all
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────┐
│         pnpm dev:all                    │
│         (start-all.sh)                  │
└─────────────────────────────────────────┘
           │
           ├─────────────┐
           │             │
           ▼             ▼
    ┌──────────┐  ┌──────────┐
    │ Next.js  │  │   MCP    │
    │  :3000   │  │ Gateway  │
    │          │──│  :8009   │──▶ Cerebras AI
    └──────────┘  └──────────┘
         │              │
         ▼              ▼
    logs/nextjs.log  logs/mcp-gateway.log
```

---

## 🎓 npm Scripts Reference

| Command | What It Does |
|---------|-------------|
| `pnpm dev:all` | Start Next.js + AI together |
| `pnpm dev` | Start Next.js only (old way) |
| `pnpm dev:ai` | Start AI service only |
| `pnpm stop` | Stop all services |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests |

---

## 🎯 Best Practices

### **For Development:**
✅ Always use `pnpm dev:all` (starts everything)  
✅ Stop with `pnpm stop` before closing terminal  
✅ Check logs if something doesn't work  

### **For Hackathon Demo:**
✅ Start services before demo: `pnpm dev:all`  
✅ Verify AI is working: `curl http://localhost:8009/health`  
✅ Test a report to ensure emails/tweets are AI-generated  

### **For Production:**
✅ Use PM2 or systemd for process management  
✅ Add monitoring/alerting  
✅ Scale MCP Gateway separately if needed  

---

## 💡 Pro Tips

### **Tip 1: Background Mode**
```bash
# Start in background and detach
nohup ./start-all.sh &

# Continue working in same terminal
```

### **Tip 2: Check Service Status**
```bash
# Quick health check
curl http://localhost:3000/api/health
curl http://localhost:8009/health
```

### **Tip 3: One-liner restart**
```bash
pnpm stop && sleep 1 && pnpm dev:all
```

### **Tip 4: Watch logs in real-time**
```bash
# In a separate terminal while services are running
tail -f logs/*.log
```

---

## 📚 Files Created

- `start-all.sh` - Main startup script
- `stop-all.sh` - Shutdown script  
- `logs/` - Directory for log files (auto-created)
- Updated `package.json` with new scripts

---

## 🎉 Summary

**Before:** Had to manually start MCP Gateway every time  
**After:** AI starts automatically with `pnpm dev:all`  

**Benefits:**
✅ One command to start everything  
✅ No manual steps  
✅ AI always available  
✅ Easy to stop/restart  
✅ Proper logging  
✅ Health checks included  

**Just run:** `pnpm dev:all` and you're ready! 🚀
