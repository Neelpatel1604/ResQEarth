# System Flow Diagram

## Automated Disaster Alert Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Lifespan Manager (main.py)                   │  │
│  │                                                            │  │
│  │  On Startup:                                              │  │
│  │  └─> Start Disaster Scheduler (every 30 min)             │  │
│  │                                                            │  │
│  │  On Shutdown:                                             │  │
│  │  └─> Stop Scheduler                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Disaster Scheduler                            │
│                    (scheduler.py)                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  APScheduler - Interval Trigger (30 minutes)           │    │
│  │                                                          │    │
│  │  Every 30 minutes:                                      │    │
│  │  └─> Run Monitoring Cycle                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Disaster Monitor                                │
│                  (disaster_monitor.py)                           │
│                                                                   │
│  Step 1: Check for Disasters                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Query NOAA Water API for flood risks                │    │
│  │  • Get high-risk locations (>20% probability)          │    │
│  │  • Calculate severity (critical/high/moderate/low)     │    │
│  │  • Build disaster data objects                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                              ▼                                    │
│  Step 2: Filter & Deduplicate                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Check if already alerted (6-hour window)            │    │
│  │  • Skip if recently alerted                            │    │
│  │  • Continue with new disasters                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                              ▼                                    │
│  Step 3: Send Alerts                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • For each disaster:                                   │    │
│  │    └─> Call Email Service                              │    │
│  │  • Record in alert history                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Email Service                                 │
│                    (email_service.py)                            │
│                                                                   │
│  Step 1: Load Subscribers                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Read subscribers.csv                                 │    │
│  │  • Parse disaster types and locations                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                              ▼                                    │
│  Step 2: Filter Subscribers                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Filter by disaster type (flood, wildfire, etc.)     │    │
│  │  • Filter by location (partial match)                  │    │
│  │  • Return relevant subscribers only                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                              ▼                                    │
│  Step 3: Build Email Content                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Generate subject line                                │    │
│  │  • Build HTML email (with color coding)                │    │
│  │  • Build plain text fallback                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                              ▼                                    │
│  Step 4: Send via SendGrid                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • For each subscriber:                                 │    │
│  │    └─> Send email via SendGrid API                     │    │
│  │  • Track success/failure                               │    │
│  │  • Return results                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Twilio SendGrid                               │
│                                                                   │
│  • Delivers emails to subscribers                               │
│  • Handles bounce/spam filtering                                │
│  • Tracks delivery status                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    📧 Subscribers Receive Alerts
```

## Manual Alert Flow

```
┌─────────────────┐
│  Admin/User     │
│  Dashboard      │
│  or API Call    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /api/alerts/manual                │
│  {                                       │
│    "disaster_type": "flood",            │
│    "severity": "high",                  │
│    "location": "Sacramento, CA",        │
│    "description": "...",                │
│    "probability": 75.5                  │
│  }                                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Email Service                          │
│  • Load & filter subscribers            │
│  • Build email content                  │
│  • Send via SendGrid                    │
└────────┬────────────────────────────────┘
         │
         ▼
    📧 Emails Sent
```

## Data Flow

```
NOAA API
   │
   │ Flood forecast data
   ▼
Disaster Monitor
   │
   │ Disaster objects
   ▼
Email Service
   │
   │ Filtered subscribers
   ▼
SendGrid API
   │
   │ Email delivery
   ▼
Subscribers
```

## File Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + lifespan
│   ├── scheduler.py               # APScheduler setup
│   ├── config.py                  # Environment config
│   ├── routes/
│   │   └── alerts.py              # API endpoints
│   └── services/
│       ├── disaster_monitor.py    # Monitoring logic
│       ├── email_service.py       # SendGrid integration
│       ├── noaa_service.py        # NOAA API client
│       └── cache_service.py       # Caching
└── subscribers.csv                # Email list
```

## Key Components

### 1. Scheduler (APScheduler)
- Runs in background
- Interval trigger (30 minutes)
- Async job execution

### 2. Disaster Monitor
- Checks NOAA flood data
- Calculates risk levels
- Manages alert history
- Prevents duplicates

### 3. Email Service
- Loads CSV subscribers
- Filters by type/location
- Builds HTML emails
- Sends via SendGrid

### 4. NOAA Service
- Queries flood forecasts
- Gets location data
- Analyzes thresholds
- Caches results

## Configuration Points

```python
# Monitoring interval
disaster_scheduler.start(interval_minutes=30)

# Alert thresholds
alert_thresholds = {
    'flood': {
        'major': 50.0,
        'moderate': 30.0,
        'minor': 20.0
    }
}

# Deduplication window
def _recently_alerted(self, disaster, hours: int = 6)

# SendGrid config
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...
```

## API Endpoints

```
GET  /api/alerts/subscribers       # List subscribers
POST /api/alerts/test              # Send test email
POST /api/alerts/manual            # Manual alert
POST /api/alerts/check-and-send    # Trigger monitoring
GET  /api/alerts/history           # Alert history
```

## Error Handling

```
Scheduler Error
   └─> Logs error, continues running

NOAA API Error
   └─> Returns empty list, no alerts sent

SendGrid Error
   └─> Tracks failed emails, continues with others

CSV Not Found
   └─> Returns empty subscriber list
```

## Monitoring Points

1. **Scheduler Status**: Check if running
2. **Alert Count**: Track alerts sent
3. **Email Success Rate**: Monitor failures
4. **API Response Times**: NOAA/SendGrid latency
5. **Subscriber Count**: Track list size

## Performance

- **Concurrent NOAA Requests**: Max 10 simultaneous
- **Email Sending**: Sequential (SendGrid handles batching)
- **Caching**: 5-minute TTL for flood risks
- **Deduplication**: In-memory (6-hour window)

## Security

- API key in environment variables
- No authentication on endpoints (add in production)
- Rate limiting recommended
- Sender email verification required
