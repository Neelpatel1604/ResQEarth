"""Twilio SMS service for sending notifications."""
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from ..config import settings


class TwilioService:
    """Service for sending SMS notifications via Twilio."""
    
    def __init__(self):
        """Initialize Twilio client."""
        if not all([
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
            settings.TWILIO_MESSAGING_SERVICE_SID
        ]):
            raise ValueError("Twilio credentials not configured")
        
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
        self.messaging_service_sid = settings.TWILIO_MESSAGING_SERVICE_SID
    
    def send_sms(self, to: str, body: str) -> Optional[str]:
        """
        Send an SMS message.
        
        Args:
            to: Phone number to send to (E.164 format)
            body: Message body
            
        Returns:
            Message SID if successful, None otherwise
        """
        try:
            message = self.client.messages.create(
                messaging_service_sid=self.messaging_service_sid,
                body=body,
                to=to
            )
            return message.sid
        except TwilioRestException as e:
            print(f"Twilio error: {e}")
            return None
    
    def send_alert(self, to: str, alert_type: str, location: str) -> Optional[str]:
        """
        Send a disaster alert SMS.
        
        Args:
            to: Phone number to send to
            alert_type: Type of disaster (e.g., "Wildfire", "Flood")
            location: Location of the disaster
            
        Returns:
            Message SID if successful, None otherwise
        """
        body = f"🚨 {alert_type} Alert\n\nLocation: {location}\n\nStay safe and follow local emergency guidelines."
        return self.send_sms(to, body)


# Singleton instance
twilio_service: Optional[TwilioService] = None


def get_twilio_service() -> Optional[TwilioService]:
    """Get or create Twilio service instance."""
    global twilio_service
    if twilio_service is None:
        try:
            twilio_service = TwilioService()
        except ValueError:
            return None
    return twilio_service
