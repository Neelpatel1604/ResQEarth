"""Background service for monitoring disasters and sending alerts."""
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.email_service import email_service
from app.services.noaa_service import noaa_service


class DisasterMonitor:
    """Monitor for natural disasters and trigger email alerts."""
    
    def __init__(self):
        self.alert_history = []
        self.alert_thresholds = {
            'flood': {
                'major': 50.0,  # 50% probability
                'moderate': 30.0,
                'minor': 20.0
            },
            'wildfire': {
                'high': 70.0,
                'moderate': 50.0,
                'low': 30.0
            }
        }
    
    async def check_flood_risks(self) -> List[Dict[str, Any]]:
        """
        Check for flood risks and return detected disasters.
        
        Returns:
            List of disaster data dictionaries
        """
        disasters = []
        
        try:
            # Get high-risk flood locations
            high_risk_locations = await noaa_service.get_high_risk_locations(
                min_major_flood_probability=self.alert_thresholds['flood']['minor']
            )
            
            for location in high_risk_locations:
                probability = location.get('probability', {})
                major_flood_prob = probability.get('major_flooding', 0)
                moderate_flood_prob = probability.get('moderate_flooding', 0)
                
                # Determine severity
                if major_flood_prob >= self.alert_thresholds['flood']['major']:
                    severity = 'critical'
                    prob = major_flood_prob
                elif major_flood_prob >= self.alert_thresholds['flood']['moderate']:
                    severity = 'high'
                    prob = major_flood_prob
                elif moderate_flood_prob >= self.alert_thresholds['flood']['moderate']:
                    severity = 'moderate'
                    prob = moderate_flood_prob
                else:
                    severity = 'low'
                    prob = max(major_flood_prob, moderate_flood_prob)
                
                disaster = {
                    'type': 'flood',
                    'severity': severity,
                    'location': f"{location.get('location_name', 'Unknown')}, {location.get('state', '')}",
                    'latitude': location.get('latitude'),
                    'longitude': location.get('longitude'),
                    'probability': round(prob, 1),
                    'description': f"Flood risk detected with {prob:.1f}% probability of major flooding. "
                                 f"Location: {location.get('location_name')}. "
                                 f"Forecast date: {location.get('forecast_date', 'N/A')}.",
                    'detected_at': datetime.utcnow().isoformat(),
                    'location_id': location.get('location_id'),
                    'raw_data': location
                }
                
                disasters.append(disaster)
        
        except Exception as e:
            print(f"Error checking flood risks: {e}")
        
        return disasters
    
    async def send_alerts_for_disasters(
        self,
        disasters: List[Dict[str, Any]],
        force: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Send email alerts for detected disasters.
        
        Args:
            disasters: List of disaster data
            force: Force sending even if recently alerted
            
        Returns:
            List of alert results
        """
        results = []
        
        for disaster in disasters:
            # Check if we've already alerted for this disaster recently
            if not force and self._recently_alerted(disaster):
                print(f"Skipping alert for {disaster['type']} at {disaster['location']} - recently alerted")
                continue
            
            # Send email alert
            result = await email_service.send_disaster_alert(disaster)
            result['disaster'] = disaster
            results.append(result)
            
            # Record in history
            if result.get('success'):
                self.alert_history.append({
                    'disaster': disaster,
                    'timestamp': datetime.utcnow().isoformat(),
                    'sent_count': result.get('sent_count', 0)
                })
        
        return results
    
    def _recently_alerted(self, disaster: Dict[str, Any], hours: int = 6) -> bool:
        """
        Check if we've recently sent an alert for this disaster.
        
        Args:
            disaster: Disaster data
            hours: Hours to check back
            
        Returns:
            True if recently alerted
        """
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        for alert in self.alert_history:
            alert_time = datetime.fromisoformat(alert['timestamp'])
            if alert_time < cutoff:
                continue
            
            # Check if same disaster type and location
            past_disaster = alert['disaster']
            if (past_disaster['type'] == disaster['type'] and
                past_disaster.get('location_id') == disaster.get('location_id')):
                return True
        
        return False
    
    async def run_monitoring_cycle(self) -> Dict[str, Any]:
        """
        Run a complete monitoring cycle.
        
        Returns:
            Summary of monitoring results
        """
        print(f"[{datetime.utcnow().isoformat()}] Starting disaster monitoring cycle...")
        
        # Check for floods
        flood_disasters = await self.check_flood_risks()
        
        # TODO: Add other disaster types (wildfires, earthquakes, etc.)
        
        all_disasters = flood_disasters
        
        # Send alerts
        alert_results = await self.send_alerts_for_disasters(all_disasters)
        
        summary = {
            'timestamp': datetime.utcnow().isoformat(),
            'disasters_detected': len(all_disasters),
            'alerts_sent': len(alert_results),
            'total_emails_sent': sum(r.get('sent_count', 0) for r in alert_results),
            'disasters': all_disasters,
            'alert_results': alert_results
        }
        
        print(f"Monitoring cycle complete: {summary['disasters_detected']} disasters detected, "
              f"{summary['total_emails_sent']} emails sent")
        
        return summary


# Singleton instance
disaster_monitor = DisasterMonitor()
