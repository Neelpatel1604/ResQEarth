"""Background scheduler for automated disaster monitoring."""
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from app.services.disaster_monitor import disaster_monitor


class DisasterScheduler:
    """Scheduler for automated disaster monitoring and alerts."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
    
    def start(self, interval_minutes: int = 30):
        """
        Start the scheduler.
        
        Args:
            interval_minutes: How often to check for disasters (default: 30 minutes)
        """
        if self.is_running:
            print("Scheduler is already running")
            return
        
        # Add monitoring job
        self.scheduler.add_job(
            self._run_monitoring,
            trigger=IntervalTrigger(minutes=interval_minutes),
            id='disaster_monitoring',
            name='Disaster Monitoring and Alerts',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        print(f"Disaster monitoring scheduler started (checking every {interval_minutes} minutes)")
    
    def stop(self):
        """Stop the scheduler."""
        if not self.is_running:
            return
        
        self.scheduler.shutdown()
        self.is_running = False
        print("Disaster monitoring scheduler stopped")
    
    async def _run_monitoring(self):
        """Run the monitoring cycle."""
        try:
            print(f"\n{'='*60}")
            print(f"[{datetime.utcnow().isoformat()}] Running scheduled disaster check...")
            print(f"{'='*60}\n")
            
            summary = await disaster_monitor.run_monitoring_cycle()
            
            print(f"\n{'='*60}")
            print(f"Scheduled check complete:")
            print(f"  - Disasters detected: {summary['disasters_detected']}")
            print(f"  - Alerts sent: {summary['alerts_sent']}")
            print(f"  - Total emails: {summary['total_emails_sent']}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            print(f"Error in scheduled monitoring: {e}")


# Singleton instance
disaster_scheduler = DisasterScheduler()
