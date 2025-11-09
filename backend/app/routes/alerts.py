"""API routes for disaster alerts and email notifications."""
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from app.services.email_service import email_service
from app.services.disaster_monitor import disaster_monitor


router = APIRouter()


class ManualAlertRequest(BaseModel):
    """Request model for manual disaster alert."""
    disaster_type: str
    severity: str
    location: str
    description: str
    probability: Optional[float] = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SubscriberRequest(BaseModel):
    """Request model for adding a subscriber."""
    email: EmailStr
    name: str
    location: str
    disaster_types: List[str]


@router.get("/subscribers")
async def get_subscribers():
    """Get all subscribers from CSV."""
    subscribers = email_service.load_subscribers()
    return {
        "success": True,
        "count": len(subscribers),
        "subscribers": subscribers
    }


@router.post("/alerts/manual")
async def send_manual_alert(alert: ManualAlertRequest, background_tasks: BackgroundTasks):
    """
    Manually trigger a disaster alert email.
    
    This endpoint allows manual triggering of alerts for testing or emergency situations.
    """
    disaster_data = {
        'type': alert.disaster_type,
        'severity': alert.severity,
        'location': alert.location,
        'description': alert.description,
        'probability': alert.probability,
        'latitude': alert.latitude,
        'longitude': alert.longitude,
        'detected_at': None  # Will use current time
    }
    
    result = await email_service.send_disaster_alert(disaster_data)
    
    if not result.get('success'):
        raise HTTPException(status_code=500, detail=result.get('error', 'Failed to send alerts'))
    
    return result


@router.post("/alerts/check-and-send")
async def check_and_send_alerts(background_tasks: BackgroundTasks):
    """
    Check for disasters and send alerts if any are detected.
    
    This endpoint runs the monitoring cycle and sends alerts for detected disasters.
    """
    summary = await disaster_monitor.run_monitoring_cycle()
    
    return {
        "success": True,
        "summary": summary
    }


@router.get("/alerts/history")
async def get_alert_history(limit: int = 50):
    """Get recent alert history."""
    history = disaster_monitor.alert_history[-limit:]
    
    return {
        "success": True,
        "count": len(history),
        "history": history
    }


@router.post("/alerts/test")
async def send_test_alert(email: Optional[str] = None):
    """
    Send a test alert email.
    
    Args:
        email: Optional specific email to send to (otherwise sends to all subscribers)
    """
    test_disaster = {
        'type': 'flood',
        'severity': 'moderate',
        'location': 'Test Location, CA',
        'description': 'This is a test alert from the ResQ-Earth PREVENT system. '
                      'No action is required. This is only a test.',
        'probability': 45.0,
        'detected_at': None
    }
    
    subscribers = None
    if email:
        subscribers = [{
            'email': email,
            'name': 'Test User',
            'location': 'Test',
            'disaster_types': ['flood']
        }]
    
    result = await email_service.send_disaster_alert(test_disaster, subscribers=subscribers)
    
    if not result.get('success'):
        raise HTTPException(status_code=500, detail=result.get('error', 'Failed to send test alert'))
    
    return result


@router.post("/subscribers/upload-csv")
async def upload_subscribers_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file with subscriber data.
    
    Expected CSV format:
    email,name,location,disaster_types
    user@example.com,John Doe,California,"flood,wildfire"
    
    Returns:
        Success status and count of subscribers loaded
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    try:
        # Read file content
        contents = await file.read()
        result = email_service.save_subscribers_csv(contents)
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to process CSV'))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")
