"""Test script for email alert system."""
import asyncio
import httpx


BASE_URL = "http://localhost:8000/api"


async def test_email_system():
    """Test the email alert system."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=" * 60)
        print("Testing ResQ-Earth Email Alert System")
        print("=" * 60)
        
        # 1. Get subscribers
        print("\n1. Fetching subscribers...")
        try:
            response = await client.get(f"{BASE_URL}/alerts/subscribers")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Found {data['count']} subscribers")
                for sub in data['subscribers'][:3]:
                    print(f"  - {sub['name']} ({sub['email']}) - {sub['location']}")
            else:
                print(f"✗ Error: {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # 2. Send test alert
        print("\n2. Sending test alert...")
        try:
            response = await client.post(
                f"{BASE_URL}/alerts/test",
                params={"email": "test@example.com"}  # Change to your email
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Test alert sent successfully")
                print(f"  - Emails sent: {data.get('sent_count', 0)}")
                print(f"  - Failed: {data.get('failed_count', 0)}")
            else:
                print(f"✗ Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # 3. Send manual alert
        print("\n3. Sending manual disaster alert...")
        try:
            alert_data = {
                "disaster_type": "flood",
                "severity": "moderate",
                "location": "Sacramento, CA",
                "description": "Test flood alert - Moderate flooding expected in the next 24 hours. This is a test.",
                "probability": 45.5,
                "latitude": 38.5816,
                "longitude": -121.4944
            }
            response = await client.post(
                f"{BASE_URL}/alerts/manual",
                json=alert_data
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Manual alert sent successfully")
                print(f"  - Emails sent: {data.get('sent_count', 0)}")
                print(f"  - Failed: {data.get('failed_count', 0)}")
            else:
                print(f"✗ Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # 4. Check for real disasters
        print("\n4. Checking for real disasters...")
        try:
            response = await client.post(f"{BASE_URL}/alerts/check-and-send")
            if response.status_code == 200:
                data = response.json()
                summary = data.get('summary', {})
                print(f"✓ Monitoring cycle complete")
                print(f"  - Disasters detected: {summary.get('disasters_detected', 0)}")
                print(f"  - Alerts sent: {summary.get('alerts_sent', 0)}")
                print(f"  - Total emails: {summary.get('total_emails_sent', 0)}")
            else:
                print(f"✗ Error: {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # 5. Get alert history
        print("\n5. Fetching alert history...")
        try:
            response = await client.get(f"{BASE_URL}/alerts/history?limit=5")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Found {data['count']} recent alerts")
                for alert in data['history']:
                    disaster = alert['disaster']
                    print(f"  - {disaster['type']} at {disaster['location']} "
                          f"({disaster['severity']}) - {alert['sent_count']} emails")
            else:
                print(f"✗ Error: {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        print("\n" + "=" * 60)
        print("Testing complete!")
        print("=" * 60)


if __name__ == "__main__":
    print("\nMake sure the backend server is running:")
    print("  cd backend && uvicorn app.main:app --reload\n")
    
    try:
        asyncio.run(test_email_system())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nTest failed: {e}")
