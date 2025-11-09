# ⚡ Quick Run Guide - 3 Steps to Get Started

## 🎯 What You Need (5 minutes)

### 1️⃣ Get SendGrid API Key

**Go to:** https://signup.sendgrid.com/

```
Sign Up (Free) → Settings → API Keys → Create API Key
```

**Copy the key** (starts with `SG.`)

### 2️⃣ Verify Your Email

```
Settings → Sender Authentication → Verify a Single Sender
```

Check your email and click the verification link.

### 3️⃣ Add to Configuration

Open `backend/.env.local` and add:

```bash
SENDGRID_API_KEY=SG.paste_your_key_here
SENDGRID_FROM_EMAIL=your-verified@email.com
SENDGRID_FROM_NAME=ResQ-Earth Alert System
```

---

## 🚀 Run It!

### Option 1: Use the Start Script (Easiest)

```bash
./start_alert_system.sh
```

### Option 2: Manual Start

```bash
cd backend
pip install sendgrid apscheduler
uvicorn app.main:app --reload --port 8000
```

---

## ✅ Test It!

### In another terminal:

```bash
# Send test email to yourself
curl -X POST "http://localhost:8000/api/alerts/test?email=YOUR_EMAIL@example.com"
```

**Check your email!** 📧

---

## 🎨 Use the Dashboard

```bash
# Start frontend (in another terminal)
cd frontend
npm run dev
```

**Open:** http://localhost:3000/alerts

---

## 📝 Add Real Subscribers

Edit `backend/subscribers.csv`:

```csv
email,name,location,disaster_types
your@email.com,Your Name,California,"flood,wildfire"
friend@email.com,Friend,Texas,"flood,hurricane"
```

---

## 🔄 What Happens Now?

The system automatically:
- ✅ Checks for disasters every 30 minutes
- ✅ Sends emails to matching subscribers
- ✅ Tracks alert history
- ✅ Prevents duplicate alerts

---

## 🧪 Test Commands

```bash
# Send test alert
curl -X POST "http://localhost:8000/api/alerts/test?email=test@example.com"

# Send manual flood alert
curl -X POST "http://localhost:8000/api/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "high",
    "location": "Sacramento, CA",
    "description": "Test alert - Major flooding expected",
    "probability": 75.5
  }'

# Check for real disasters now
curl -X POST "http://localhost:8000/api/alerts/check-and-send"

# View alert history
curl -X GET "http://localhost:8000/api/alerts/history"

# View subscribers
curl -X GET "http://localhost:8000/api/alerts/subscribers"
```

---

## 🐛 Troubleshooting

### "Forbidden" Error
→ Verify your sender email in SendGrid

### No Emails?
→ Check spam folder
→ Verify API key is correct
→ Check backend terminal for errors

### Module Not Found?
```bash
pip install sendgrid apscheduler
```

---

## 📚 Full Documentation

- **Setup Guide:** `SETUP_INSTRUCTIONS.md`
- **Full Docs:** `DISASTER_ALERT_SYSTEM.md`
- **SendGrid Setup:** `backend/TWILIO_SENDGRID_SETUP.md`
- **API Examples:** `backend/API_EXAMPLES.sh`

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start backend | `./start_alert_system.sh` |
| Start frontend | `cd frontend && npm run dev` |
| Test email | `curl -X POST "http://localhost:8000/api/alerts/test?email=YOUR_EMAIL"` |
| View API docs | http://localhost:8000/docs |
| Admin dashboard | http://localhost:3000/alerts |

---

**That's it!** 🎉 Your disaster alert system is running!
