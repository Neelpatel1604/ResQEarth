# 🚀 Quick Start - Email Alert System

## 5-Minute Setup

### 1. Get SendGrid API Key (2 min)
```
1. Go to https://signup.sendgrid.com/
2. Settings → API Keys → Create API Key
3. Copy the key
```

### 2. Verify Email (1 min)
```
1. Settings → Sender Authentication
2. Verify a Single Sender
3. Check your email and verify
```

### 3. Configure (1 min)
Add to `backend/.env.local`:
```bash
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=your-verified@email.com
SENDGRID_FROM_NAME=ResQ-Earth Alerts
```

### 4. Install & Run (1 min)
```bash
cd backend
pip install sendgrid apscheduler
uvicorn app.main:app --reload
```

### 5. Test
```bash
curl -X POST "http://localhost:8000/api/alerts/test?email=your@email.com"
```

## ✅ Done!

The system is now:
- ✓ Monitoring for disasters every 30 minutes
- ✓ Sending emails to subscribers in `subscribers.csv`
- ✓ Tracking alert history

## 📝 Edit Subscribers

Edit `backend/subscribers.csv`:
```csv
email,name,location,disaster_types
john@example.com,John Doe,California,"flood,wildfire"
```

## 🎛️ Admin Dashboard

Visit: `http://localhost:3000/alerts`

## 📚 Full Documentation

- `EMAIL_ALERTS_SETUP.md` - Complete setup guide
- `TWILIO_SENDGRID_SETUP.md` - SendGrid details
- `DISASTER_ALERT_SYSTEM.md` - Full system documentation

## 🆘 Help

**No emails?**
- Check SendGrid API key
- Verify sender email in SendGrid
- Check `subscribers.csv` exists

**Emails in spam?**
- Authenticate your domain in SendGrid
- Use professional sender email

## 🎯 API Endpoints

```bash
# Test email
POST /api/alerts/test?email=test@example.com

# Manual alert
POST /api/alerts/manual
{
  "disaster_type": "flood",
  "severity": "high",
  "location": "Sacramento, CA",
  "description": "Flooding expected",
  "probability": 75.5
}

# Check for disasters
POST /api/alerts/check-and-send

# View subscribers
GET /api/alerts/subscribers

# Alert history
GET /api/alerts/history
```

## 🔧 Configuration

**Change check interval** (default: 30 min):
```python
# backend/app/main.py
disaster_scheduler.start(interval_minutes=15)
```

**Adjust alert threshold** (default: 20%):
```python
# backend/app/services/disaster_monitor.py
self.alert_thresholds = {
    'flood': {
        'major': 40.0,  # Lower = more alerts
        'moderate': 25.0,
        'minor': 15.0
    }
}
```

## 📊 Free Tier Limits

SendGrid Free:
- 100 emails/day
- 2,000 contacts
- Single sender verification

Upgrade for more volume.

---

**Ready to go!** 🎉
