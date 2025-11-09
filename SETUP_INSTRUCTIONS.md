# 🚀 How to Run the Email Alert System

## Step 1: Get SendGrid API Key

1. **Sign up for SendGrid** (free tier - 100 emails/day)
   - Go to: https://signup.sendgrid.com/
   - Create a free account

2. **Create API Key**
   - Log in to SendGrid dashboard
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it: "ResQ-Earth Alerts"
   - Choose **Full Access** (or Restricted with Mail Send permission)
   - **Copy the API key** (you'll only see it once!)

3. **Verify Your Sender Email** (REQUIRED!)
   - Go to **Settings** → **Sender Authentication**
   - Click **Verify a Single Sender**
   - Enter your email address
   - Check your email and click the verification link
   - This email will be used to send alerts

## Step 2: Configure Environment

Open `backend/.env.local` and add these lines:

```bash
# Twilio SendGrid Configuration (for email alerts)
SENDGRID_API_KEY=SG.paste_your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SENDGRID_FROM_NAME=ResQ-Earth Alert System
```

**Replace:**
- `SG.paste_your_api_key_here` with your actual SendGrid API key
- `your-verified-email@example.com` with the email you verified in SendGrid

## Step 3: Install Dependencies

```bash
cd backend
pip install sendgrid apscheduler
```

Or install all dependencies:
```bash
pip install -r requirements.txt
```

## Step 4: Edit Subscribers (Optional)

Edit `backend/subscribers.csv` to add real email addresses:

```csv
email,name,location,disaster_types
your@email.com,Your Name,California,"flood,wildfire,earthquake"
friend@email.com,Friend Name,Texas,"flood,hurricane"
```

## Step 5: Start the Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

You should see:
```
Disaster monitoring scheduler started (checking every 30 minutes)
```

## Step 6: Test It!

### Option A: Use the Test Script
```bash
cd backend
python test_email_alerts.py
```

### Option B: Use curl
```bash
# Send a test email to yourself
curl -X POST "http://localhost:8000/api/alerts/test?email=your@email.com"
```

### Option C: Use the Admin Dashboard
1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open: http://localhost:3000/alerts
3. Click "Send Test Alert"

## Step 7: Check Your Email!

You should receive a test disaster alert email. Check your inbox (and spam folder just in case).

## 🎉 That's It!

The system is now:
- ✅ Running and monitoring for disasters every 30 minutes
- ✅ Ready to send email alerts
- ✅ Tracking alert history

## 📝 What Happens Next?

Every 30 minutes, the system will:
1. Check NOAA for flood risks
2. If any high-risk floods are detected
3. Send emails to subscribers who signed up for flood alerts in that location

## 🧪 Manual Testing

### Send a Manual Alert
```bash
curl -X POST "http://localhost:8000/api/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "high",
    "location": "Sacramento, CA",
    "description": "Test flood alert - Major flooding expected",
    "probability": 75.5
  }'
```

### Check for Real Disasters Now
```bash
curl -X POST "http://localhost:8000/api/alerts/check-and-send"
```

### View Alert History
```bash
curl -X GET "http://localhost:8000/api/alerts/history"
```

## 🔧 Troubleshooting

### "Forbidden" Error
- Make sure you verified your sender email in SendGrid
- Check that your API key has Mail Send permissions

### No Emails Received
- Check spam folder
- Verify SendGrid API key is correct
- Make sure sender email is verified
- Check backend logs for errors

### "Module not found" Error
```bash
pip install sendgrid apscheduler
```

## 📊 Monitor the System

Watch the backend terminal - you'll see logs like:
```
[2024-11-08T10:30:00] Starting disaster monitoring cycle...
Monitoring cycle complete: 3 disasters detected, 15 emails sent
```

## 🎯 Next Steps

1. **Add real subscribers** to `subscribers.csv`
2. **Customize email templates** in `backend/app/services/email_service.py`
3. **Adjust monitoring interval** in `backend/app/main.py`
4. **Set up domain authentication** in SendGrid for better deliverability

## 📚 More Info

- Full docs: `DISASTER_ALERT_SYSTEM.md`
- API examples: `backend/API_EXAMPLES.sh`
- SendGrid setup: `backend/TWILIO_SENDGRID_SETUP.md`
