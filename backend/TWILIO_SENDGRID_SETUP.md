# Twilio SendGrid Setup for Email Alerts

## Quick Start

### 1. Create SendGrid Account
1. Go to https://signup.sendgrid.com/
2. Sign up for a free account (100 emails/day)
3. Complete email verification

### 2. Get API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it "ResQ-Earth Alerts"
5. Select **Full Access** (or Restricted with Mail Send permission)
6. Copy the API key (you'll only see it once!)

### 3. Verify Sender Email
**Important:** SendGrid requires sender verification

#### Option A: Single Sender Verification (Easiest)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email details
4. Check your email and click verification link
5. Use this email as `SENDGRID_FROM_EMAIL`

#### Option B: Domain Authentication (Production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions
4. Use any email from your domain as `SENDGRID_FROM_EMAIL`

### 4. Configure Environment
Add to `backend/.env.local`:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SENDGRID_FROM_NAME=ResQ-Earth Alert System
```

### 5. Test the Setup
```bash
# Start the backend server
cd backend
uvicorn app.main:app --reload

# In another terminal, send a test email
curl -X POST "http://localhost:8000/api/alerts/test?email=your@email.com"
```

## Managing Subscribers

Edit `backend/subscribers.csv`:

```csv
email,name,location,disaster_types
john@example.com,John Doe,California,"flood,wildfire,earthquake"
jane@example.com,Jane Smith,Texas,"flood,hurricane"
bob@example.com,Bob Johnson,Florida,"hurricane,flood"
```

**Disaster Types:**
- `flood` - Flood alerts
- `wildfire` - Wildfire alerts
- `earthquake` - Earthquake alerts
- `hurricane` - Hurricane alerts
- `tornado` - Tornado alerts

## API Endpoints

### Test Email
```bash
POST /api/alerts/test?email=test@example.com
```

### Manual Alert
```bash
POST /api/alerts/manual
{
  "disaster_type": "flood",
  "severity": "high",
  "location": "Sacramento, CA",
  "description": "Major flooding expected",
  "probability": 75.5
}
```

### Check for Disasters
```bash
POST /api/alerts/check-and-send
```

### View Subscribers
```bash
GET /api/alerts/subscribers
```

### Alert History
```bash
GET /api/alerts/history?limit=50
```

## Automated Monitoring

The system automatically:
- ✅ Checks for disasters every 30 minutes
- ✅ Sends emails to relevant subscribers
- ✅ Filters by disaster type and location
- ✅ Prevents duplicate alerts (6-hour window)

## Free Tier Limits

SendGrid Free Plan:
- **100 emails/day**
- **2,000 contacts**
- Single sender verification

For higher volume, upgrade to paid plan.

## Troubleshooting

### "Forbidden" Error
- Verify your sender email in SendGrid
- Check API key has Mail Send permission

### Emails Not Arriving
- Check spam folder
- Verify recipient email is valid
- Check SendGrid Activity Feed for delivery status

### "No subscribers found"
- Ensure `subscribers.csv` exists in `backend/` folder
- Check CSV format matches example
- Verify disaster types match alert type

## Production Tips

1. **Authenticate your domain** for better deliverability
2. **Monitor usage** in SendGrid dashboard
3. **Set up webhooks** for delivery tracking
4. **Add unsubscribe links** (required for compliance)
5. **Use email templates** in SendGrid for easier management

## Support

- SendGrid Docs: https://docs.sendgrid.com/
- API Reference: https://docs.sendgrid.com/api-reference/mail-send/mail-send
- Support: https://support.twilio.com/
