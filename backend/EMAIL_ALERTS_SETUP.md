# Email Alert System Setup Guide

## Overview
The ResQ-Earth PREVENT system now includes automated mass email notifications for natural disaster detection using **Twilio SendGrid**.

## Features
- ✅ Automated disaster monitoring (checks every 30 minutes)
- ✅ Mass email notifications via Twilio SendGrid
- ✅ CSV-based subscriber management
- ✅ Disaster type and location filtering
- ✅ Beautiful HTML email templates
- ✅ Manual alert triggering
- ✅ Alert history tracking

## Setup Instructions

### 1. Get Twilio SendGrid API Key

1. Sign up for a free SendGrid account at https://signup.sendgrid.com/
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Choose "Full Access" or "Restricted Access" (with Mail Send permissions)
5. Copy your API key

### 2. Configure Environment Variables

Add these to your `backend/.env.local` file:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=alerts@yourdomain.com
SENDGRID_FROM_NAME=ResQ-Earth Alert System
```

**Important:** You must verify your sender email in SendGrid:
- Go to Settings > Sender Authentication
- Verify a single sender email OR authenticate your domain

### 3. Manage Subscribers

Edit `backend/subscribers.csv` to add/remove subscribers:

```csv
email,name,location,disaster_types
john@example.com,John Doe,California,"flood,wildfire,earthquake"
jane@example.com,Jane Smith,Texas,"flood,hurricane"
```

**CSV Format:**
- `email`: Subscriber email address
- `name`: Subscriber name
- `location`: Geographic location (for filtering)
- `disaster_types`: Comma-separated list of disaster types to receive alerts for

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Start the Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The automated monitoring will start automatically and check for disasters every 30 minutes.

## API Endpoints

### Send Test Alert
```bash
POST /api/alerts/test
```

Send a test email to verify configuration.

### Manual Alert
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

### Check and Send Alerts
```bash
POST /api/alerts/check-and-send
```

Manually trigger a monitoring cycle.

### Get Subscribers
```bash
GET /api/alerts/subscribers
```

View all subscribers from CSV.

### Get Alert History
```bash
GET /api/alerts/history?limit=50
```

View recent alert history.

## How It Works

### Automated Monitoring
1. **Scheduler** runs every 30 minutes (configurable)
2. **Disaster Monitor** checks NOAA flood data for high-risk locations
3. **Email Service** sends alerts to relevant subscribers
4. **Deduplication** prevents duplicate alerts within 6 hours

### Email Filtering
Emails are automatically filtered by:
- **Disaster Type**: Only subscribers interested in that disaster type
- **Location**: Matches subscriber location with disaster location

### Alert Thresholds
```python
flood:
  - critical: 50%+ probability of major flooding
  - high: 30-50% probability of major flooding
  - moderate: 20-30% probability of moderate flooding
```

## Customization

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
        'major': 40.0,  # Lower threshold = more alerts
        'moderate': 25.0,
        'minor': 15.0
    }
}
```

### Customize Email Template
Edit `backend/app/services/email_service.py` in the `_build_html_content()` method.

## Testing

### 1. Test Email Configuration
```bash
curl -X POST http://localhost:8000/api/alerts/test?email=your@email.com
```

### 2. Test Manual Alert
```bash
curl -X POST http://localhost:8000/api/alerts/manual \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "moderate",
    "location": "Test Location",
    "description": "This is a test alert",
    "probability": 45.0
  }'
```

### 3. Check Monitoring
```bash
curl -X POST http://localhost:8000/api/alerts/check-and-send
```

## Troubleshooting

### No Emails Sent
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Ensure subscribers.csv exists and has valid emails
- Check server logs for errors

### Emails Going to Spam
- Authenticate your domain in SendGrid
- Use a professional sender email
- Avoid spam trigger words in content

### Too Many/Few Alerts
- Adjust alert thresholds in disaster_monitor.py
- Change monitoring interval
- Modify deduplication window (default: 6 hours)

## Production Recommendations

1. **Use a verified domain** for sender email
2. **Set up SPF, DKIM, and DMARC** records
3. **Monitor SendGrid usage** (free tier: 100 emails/day)
4. **Implement rate limiting** for manual alerts
5. **Add unsubscribe functionality**
6. **Store alert history in database** instead of memory
7. **Add webhook for delivery tracking**

## Support

For issues or questions:
- SendGrid Docs: https://docs.sendgrid.com/
- Twilio Support: https://support.twilio.com/
