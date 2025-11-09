# 🚨 Disaster Alert System - Complete Setup Guide

## Overview
A comprehensive mass email notification system that automatically detects natural disasters and sends alerts to subscribers via **Twilio SendGrid**.

## ✨ Features

### Automated Monitoring
- ✅ Checks for disasters every 30 minutes (configurable)
- ✅ Monitors NOAA flood data for high-risk locations
- ✅ Automatic alert deduplication (6-hour window)
- ✅ Background scheduler with FastAPI lifespan management

### Email Notifications
- ✅ Mass email via Twilio SendGrid
- ✅ Beautiful HTML email templates
- ✅ Plain text fallback
- ✅ Subscriber filtering by disaster type and location
- ✅ Severity-based color coding

### Subscriber Management
- ✅ CSV-based subscriber list
- ✅ Filter by disaster type (flood, wildfire, earthquake, etc.)
- ✅ Location-based filtering
- ✅ Easy to add/remove subscribers

### API & Frontend
- ✅ RESTful API endpoints
- ✅ Manual alert triggering
- ✅ Test email functionality
- ✅ Alert history tracking
- ✅ Admin dashboard (Next.js)

## 📁 Project Structure

```
backend/
├── app/
│   ├── routes/
│   │   └── alerts.py              # Alert API endpoints
│   ├── services/
│   │   ├── email_service.py       # SendGrid email service
│   │   ├── disaster_monitor.py    # Disaster detection logic
│   │   └── noaa_service.py        # NOAA flood data
│   ├── scheduler.py               # Background scheduler
│   ├── main.py                    # FastAPI app with lifespan
│   └── config.py                  # Configuration
├── subscribers.csv                # Email subscriber list
├── test_email_alerts.py          # Test script
├── EMAIL_ALERTS_SETUP.md         # Detailed setup guide
└── TWILIO_SENDGRID_SETUP.md      # SendGrid-specific guide

frontend/
└── app/
    └── alerts/
        └── page.tsx               # Admin dashboard
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `sendgrid==6.11.0` - Twilio SendGrid Python SDK
- `apscheduler==3.10.4` - Background task scheduler

### 2. Get SendGrid API Key

1. Sign up at https://signup.sendgrid.com/ (free tier: 100 emails/day)
2. Go to **Settings** → **API Keys** → **Create API Key**
3. Copy the API key

### 3. Verify Sender Email

**Important:** SendGrid requires sender verification

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email and verify it
4. Use this email as `SENDGRID_FROM_EMAIL`

### 4. Configure Environment

Add to `backend/.env.local`:

```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SENDGRID_FROM_NAME=ResQ-Earth Alert System
```

### 5. Add Subscribers

Edit `backend/subscribers.csv`:

```csv
email,name,location,disaster_types
john@example.com,John Doe,California,"flood,wildfire,earthquake"
jane@example.com,Jane Smith,Texas,"flood,hurricane"
bob@example.com,Bob Johnson,Florida,"hurricane,flood"
```

### 6. Start the Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The automated monitoring starts automatically! 🎉

### 7. Test the System

```bash
# Run the test script
python test_email_alerts.py

# Or use curl
curl -X POST "http://localhost:8000/api/alerts/test?email=your@email.com"
```

## 📡 API Endpoints

### Get Subscribers
```bash
GET /api/alerts/subscribers
```

Returns all subscribers from CSV.

### Send Test Alert
```bash
POST /api/alerts/test?email=test@example.com
```

Sends a test email to verify configuration.

### Send Manual Alert
```bash
POST /api/alerts/manual
Content-Type: application/json

{
  "disaster_type": "flood",
  "severity": "high",
  "location": "Sacramento, CA",
  "description": "Major flooding expected in the next 24 hours",
  "probability": 75.5,
  "latitude": 38.5816,
  "longitude": -121.4944
}
```

### Check for Disasters
```bash
POST /api/alerts/check-and-send
```

Manually trigger a monitoring cycle.

### Get Alert History
```bash
GET /api/alerts/history?limit=50
```

Returns recent alert history.

## 🎨 Admin Dashboard

Access the admin dashboard at: `http://localhost:3000/alerts`

Features:
- View all subscribers
- Send test alerts
- Trigger manual disaster checks
- Send custom alerts
- View alert history

## ⚙️ Configuration

### Change Monitoring Interval

Edit `backend/app/main.py`:

```python
disaster_scheduler.start(interval_minutes=15)  # Check every 15 minutes
```

### Adjust Alert Thresholds

Edit `backend/app/services/disaster_monitor.py`:

```python
self.alert_thresholds = {
    'flood': {
        'major': 40.0,    # Lower = more alerts
        'moderate': 25.0,
        'minor': 15.0
    }
}
```

### Customize Email Template

Edit `backend/app/services/email_service.py` in the `_build_html_content()` method.

### Change Deduplication Window

Edit `backend/app/services/disaster_monitor.py`:

```python
def _recently_alerted(self, disaster, hours: int = 3):  # 3 hours instead of 6
```

## 🔍 How It Works

### Automated Flow

1. **Scheduler** runs every 30 minutes
2. **Disaster Monitor** checks NOAA flood data
3. **Risk Analysis** calculates flood probabilities
4. **Filtering** matches disasters to subscribers
5. **Email Service** sends alerts via SendGrid
6. **Deduplication** prevents repeat alerts

### Email Filtering

Emails are automatically filtered by:
- **Disaster Type**: Only subscribers interested in that type
- **Location**: Partial match with subscriber location
- **Severity**: All severities are sent (configurable)

### Alert Thresholds

```
Flood Alerts:
├── Critical: 50%+ probability of major flooding
├── High: 30-50% probability of major flooding
├── Moderate: 20-30% probability of moderate flooding
└── Low: <20% probability
```

## 📊 Monitoring & Logs

The system logs to console:

```
[2024-11-08T10:30:00] Starting disaster monitoring cycle...
Monitoring cycle complete: 3 disasters detected, 15 emails sent
```

View logs in the terminal where the server is running.

## 🧪 Testing

### Test Script

```bash
python backend/test_email_alerts.py
```

Tests:
1. Fetch subscribers
2. Send test alert
3. Send manual alert
4. Check for real disasters
5. View alert history

### Manual Testing

```bash
# Test email configuration
curl -X POST "http://localhost:8000/api/alerts/test?email=your@email.com"

# Send manual alert
curl -X POST "http://localhost:8000/api/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "moderate",
    "location": "Test Location",
    "description": "This is a test",
    "probability": 45.0
  }'

# Check for disasters
curl -X POST "http://localhost:8000/api/alerts/check-and-send"
```

## 🚨 Troubleshooting

### No Emails Sent
- ✓ Verify SendGrid API key is correct
- ✓ Check sender email is verified in SendGrid
- ✓ Ensure `subscribers.csv` exists with valid emails
- ✓ Check server logs for errors

### Emails Going to Spam
- ✓ Authenticate your domain in SendGrid
- ✓ Use a professional sender email
- ✓ Avoid spam trigger words

### "Forbidden" Error
- ✓ Verify sender email in SendGrid
- ✓ Check API key has Mail Send permission

### Too Many/Few Alerts
- ✓ Adjust alert thresholds
- ✓ Change monitoring interval
- ✓ Modify deduplication window

## 📈 Production Recommendations

1. **Domain Authentication**
   - Set up SPF, DKIM, and DMARC records
   - Use a verified domain for sender email

2. **Upgrade SendGrid Plan**
   - Free tier: 100 emails/day
   - Paid plans for higher volume

3. **Database Storage**
   - Store subscribers in database instead of CSV
   - Track alert history in database

4. **Unsubscribe Functionality**
   - Add unsubscribe links (required for compliance)
   - Implement preference management

5. **Monitoring**
   - Set up SendGrid webhooks for delivery tracking
   - Monitor API usage and rate limits
   - Add error alerting (e.g., Sentry)

6. **Rate Limiting**
   - Implement rate limiting for manual alerts
   - Add authentication for API endpoints

7. **Batch Sending**
   - Use SendGrid batch API for efficiency
   - Implement retry logic for failed sends

## 📚 Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [NOAA Water API](https://api.water.noaa.gov/)
- [APScheduler Documentation](https://apscheduler.readthedocs.io/)

## 🎯 Next Steps

1. **Add More Disaster Types**
   - Integrate wildfire data (FIRMS API)
   - Add earthquake monitoring (USGS)
   - Include hurricane tracking (NHC)

2. **SMS Alerts**
   - Add Twilio SMS notifications
   - Implement multi-channel alerts

3. **User Portal**
   - Self-service subscription management
   - Preference settings
   - Alert history for users

4. **Advanced Filtering**
   - Radius-based location filtering
   - Severity preferences
   - Time-based preferences (quiet hours)

5. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - Analyze alert effectiveness

## 📝 License

Part of the ResQ-Earth PREVENT system.

## 🤝 Support

For issues or questions:
- Check the troubleshooting section
- Review SendGrid documentation
- Contact Twilio support

---

**Status:** ✅ Fully Functional
**Last Updated:** November 8, 2024
