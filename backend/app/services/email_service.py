"""Email notification service using Twilio SendGrid."""
import csv
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, Content
from app.config import settings


class EmailService:
    """Service for sending mass email notifications via Twilio SendGrid."""
    
    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = settings.SENDGRID_FROM_EMAIL
        self.from_name = settings.SENDGRID_FROM_NAME
        self.client = None
        
        if self.api_key:
            self.client = SendGridAPIClient(self.api_key)
    
    def load_subscribers(self, csv_path: str = "subscribers.csv") -> List[Dict[str, Any]]:
        """
        Load subscribers from CSV file.
        
        Args:
            csv_path: Path to CSV file (relative to backend folder)
            
        Returns:
            List of subscriber dictionaries
        """
        subscribers = []
        full_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), csv_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Parse disaster types from comma-separated string
                    disaster_types = [dt.strip() for dt in row.get('disaster_types', '').split(',')]
                    subscribers.append({
                        'email': row.get('email', '').strip(),
                        'name': row.get('name', '').strip(),
                        'location': row.get('location', '').strip(),
                        'disaster_types': disaster_types
                    })
        except FileNotFoundError:
            print(f"Subscriber CSV file not found: {full_path}")
        except Exception as e:
            print(f"Error loading subscribers: {e}")
        
        return subscribers
    
    def filter_subscribers(
        self,
        subscribers: List[Dict[str, Any]],
        disaster_type: Optional[str] = None,
        location: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter subscribers based on disaster type and location.
        
        Args:
            subscribers: List of all subscribers
            disaster_type: Filter by disaster type (e.g., 'flood', 'wildfire')
            location: Filter by location (e.g., 'California')
            
        Returns:
            Filtered list of subscribers
        """
        filtered = subscribers
        
        if disaster_type:
            filtered = [
                sub for sub in filtered
                if disaster_type.lower() in [dt.lower() for dt in sub.get('disaster_types', [])]
            ]
        
        if location:
            filtered = [
                sub for sub in filtered
                if location.lower() in sub.get('location', '').lower()
            ]
        
        return filtered
    
    async def send_disaster_alert(
        self,
        disaster_data: Dict[str, Any],
        subscribers: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Send disaster alert email to subscribers.
        
        Args:
            disaster_data: Dictionary containing disaster information
            subscribers: Optional list of subscribers (loads from CSV if not provided)
            
        Returns:
            Result dictionary with success status and details
        """
        if not self.client:
            return {
                "success": False,
                "error": "SendGrid API key not configured",
                "sent_count": 0
            }
        
        # Load subscribers if not provided
        if subscribers is None:
            all_subscribers = self.load_subscribers()
            # Filter by disaster type and location
            subscribers = self.filter_subscribers(
                all_subscribers,
                disaster_type=disaster_data.get('type'),
                location=disaster_data.get('location')
            )
        
        if not subscribers:
            return {
                "success": False,
                "error": "No subscribers found",
                "sent_count": 0
            }
        
        # Build email content
        subject = self._build_subject(disaster_data)
        html_content = self._build_html_content(disaster_data)
        text_content = self._build_text_content(disaster_data)
        
        sent_count = 0
        failed_count = 0
        errors = []
        
        # Send emails (batch sending for efficiency)
        for subscriber in subscribers:
            try:
                message = Mail(
                    from_email=(self.from_email, self.from_name),
                    to_emails=subscriber['email'],
                    subject=subject,
                    html_content=html_content,
                    plain_text_content=text_content
                )
                
                response = self.client.send(message)
                
                if response.status_code in [200, 201, 202]:
                    sent_count += 1
                else:
                    failed_count += 1
                    errors.append(f"{subscriber['email']}: Status {response.status_code}")
                    
            except Exception as e:
                failed_count += 1
                errors.append(f"{subscriber['email']}: {str(e)}")
        
        return {
            "success": sent_count > 0,
            "sent_count": sent_count,
            "failed_count": failed_count,
            "total_subscribers": len(subscribers),
            "errors": errors[:10],  # Limit error list
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _build_subject(self, disaster_data: Dict[str, Any]) -> str:
        """Build email subject line."""
        disaster_type = disaster_data.get('type', 'Natural Disaster').title()
        severity = disaster_data.get('severity', 'moderate').upper()
        location = disaster_data.get('location', 'your area')
        
        return f"🚨 {severity} {disaster_type} Alert - {location}"
    
    def _build_html_content(self, disaster_data: Dict[str, Any]) -> str:
        """Build HTML email content."""
        disaster_type = disaster_data.get('type', 'Natural Disaster').title()
        severity = disaster_data.get('severity', 'moderate')
        location = disaster_data.get('location', 'your area')
        description = disaster_data.get('description', 'A natural disaster has been detected.')
        probability = disaster_data.get('probability', 0)
        detected_at = disaster_data.get('detected_at', datetime.utcnow().isoformat())
        
        # Severity color coding
        severity_colors = {
            'low': '#FFA500',
            'moderate': '#FF8C00',
            'high': '#FF4500',
            'critical': '#DC143C'
        }
        color = severity_colors.get(severity.lower(), '#FF8C00')
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Disaster Alert</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: {color}; margin-top: 0;">{disaster_type} - {severity.upper()}</h2>
                
                <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>Location:</strong> {location}</p>
                    <p><strong>Severity:</strong> <span style="color: {color}; font-weight: bold;">{severity.upper()}</span></p>
                    <p><strong>Probability:</strong> {probability}%</p>
                    <p><strong>Detected:</strong> {detected_at}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #333;">Description:</h3>
                    <p>{description}</p>
                </div>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #856404;">Safety Recommendations:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Stay informed through official channels</li>
                        <li>Follow local emergency management instructions</li>
                        <li>Prepare emergency supplies and evacuation plan</li>
                        <li>Check on vulnerable neighbors and family members</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated alert from ResQ-Earth PREVENT System<br>
                        Stay safe and follow official emergency guidelines
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _build_text_content(self, disaster_data: Dict[str, Any]) -> str:
        """Build plain text email content."""
        disaster_type = disaster_data.get('type', 'Natural Disaster').title()
        severity = disaster_data.get('severity', 'moderate')
        location = disaster_data.get('location', 'your area')
        description = disaster_data.get('description', 'A natural disaster has been detected.')
        probability = disaster_data.get('probability', 0)
        detected_at = disaster_data.get('detected_at', datetime.utcnow().isoformat())
        
        text = f"""
DISASTER ALERT - {disaster_type.upper()}

Location: {location}
Severity: {severity.upper()}
Probability: {probability}%
Detected: {detected_at}

Description:
{description}

SAFETY RECOMMENDATIONS:
- Stay informed through official channels
- Follow local emergency management instructions
- Prepare emergency supplies and evacuation plan
- Check on vulnerable neighbors and family members

---
This is an automated alert from ResQ-Earth PREVENT System
Stay safe and follow official emergency guidelines
        """
        
        return text.strip()


# Singleton instance
email_service = EmailService()
