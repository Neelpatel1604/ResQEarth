"""NOAA Water API service for flood prediction data."""
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.services.cache_service import cache_service


class NOAAWaterService:
    """Service for interacting with NOAA Water API."""
    
    BASE_URL = "https://api.water.noaa.gov/hefs/v1"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def get_forecast_locations(
        self,
        state: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get available forecast locations.
        
        Args:
            state: Filter by state code (e.g., 'CA', 'TX')
            limit: Maximum number of results
            
        Returns:
            List of forecast location data
        """
        try:
            params = {"limit": limit}
            if state:
                params["state"] = state
            
            response = await self.client.get(
                f"{self.BASE_URL}/locations",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error fetching NOAA locations: {e}")
            return []
    
    async def get_streamflow_forecast(
        self,
        location_id: str,
        forecast_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get streamflow forecast for a specific location.
        
        Args:
            location_id: NOAA location identifier
            forecast_date: Date in YYYY-MM-DD format (defaults to latest)
            
        Returns:
            Forecast data including ensemble predictions
        """
        try:
            params = {}
            if forecast_date:
                params["forecast_date"] = forecast_date
            
            response = await self.client.get(
                f"{self.BASE_URL}/forecasts/{location_id}",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error fetching NOAA forecast: {e}")
            return {}
    
    async def get_flood_thresholds(
        self,
        location_id: str
    ) -> Dict[str, Any]:
        """
        Get flood stage thresholds for a location.
        
        Args:
            location_id: NOAA location identifier
            
        Returns:
            Flood threshold data (action, minor, moderate, major stages)
        """
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/locations/{location_id}/thresholds"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error fetching flood thresholds: {e}")
            return {}
    
    async def analyze_flood_risk(
        self,
        location_id: str
    ) -> Dict[str, Any]:
        """
        Analyze flood risk by comparing forecast to thresholds.
        
        Args:
            location_id: NOAA location identifier
            
        Returns:
            Risk analysis with probability and severity
        """
        forecast = await self.get_streamflow_forecast(location_id)
        thresholds = await self.get_flood_thresholds(location_id)
        
        if not forecast or not thresholds:
            return {
                "location_id": location_id,
                "risk_level": "unknown",
                "error": "Unable to fetch data"
            }
        
        # Analyze ensemble forecast against thresholds
        # This is a simplified analysis - production would be more sophisticated
        try:
            ensemble_data = forecast.get("ensemble", [])
            flood_stage = thresholds.get("flood_stage", {})
            
            minor_stage = flood_stage.get("minor")
            moderate_stage = flood_stage.get("moderate")
            major_stage = flood_stage.get("major")
            
            # Calculate probability of exceeding flood stages
            exceedance_count = {
                "minor": 0,
                "moderate": 0,
                "major": 0
            }
            
            for member in ensemble_data:
                max_flow = max(member.get("values", [0]))
                if minor_stage and max_flow >= minor_stage:
                    exceedance_count["minor"] += 1
                if moderate_stage and max_flow >= moderate_stage:
                    exceedance_count["moderate"] += 1
                if major_stage and max_flow >= major_stage:
                    exceedance_count["major"] += 1
            
            total_members = len(ensemble_data)
            
            return {
                "location_id": location_id,
                "forecast_date": forecast.get("forecast_date"),
                "probability": {
                    "minor_flooding": (exceedance_count["minor"] / total_members * 100) if total_members > 0 else 0,
                    "moderate_flooding": (exceedance_count["moderate"] / total_members * 100) if total_members > 0 else 0,
                    "major_flooding": (exceedance_count["major"] / total_members * 100) if total_members > 0 else 0,
                },
                "thresholds": flood_stage,
                "ensemble_members": total_members
            }
        except Exception as e:
            return {
                "location_id": location_id,
                "risk_level": "error",
                "error": str(e)
            }


# Singleton instance
noaa_service = NOAAWaterService()


    async def get_all_flood_risks(
        self,
        state: Optional[str] = None,
        min_risk_threshold: float = 10.0,
        max_concurrent: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get flood risk analysis for all locations (or filtered by state).
        
        Args:
            state: Optional state code filter
            min_risk_threshold: Minimum risk percentage to include in results
            max_concurrent: Maximum concurrent API requests
            
        Returns:
            List of locations with flood risk data
        """
        # Check cache first (5 minute TTL)
        cache_key = f"flood_risks:{state or 'all'}:{min_risk_threshold}"
        cached = await cache_service.get(cache_key)
        if cached is not None:
            return cached
        
        # Get all locations
        locations = await self.get_forecast_locations(state=state, limit=500)
        
        if not locations:
            return []
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def fetch_risk_with_limit(location: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            """Fetch risk data with concurrency limit."""
            async with semaphore:
                try:
                    location_id = location.get("id") or location.get("location_id")
                    if not location_id:
                        return None
                    
                    risk = await self.analyze_flood_risk(location_id)
                    
                    # Add location metadata
                    risk["location_name"] = location.get("name")
                    risk["state"] = location.get("state")
                    risk["latitude"] = location.get("latitude")
                    risk["longitude"] = location.get("longitude")
                    
                    # Filter by risk threshold
                    max_probability = max(
                        risk.get("probability", {}).get("minor_flooding", 0),
                        risk.get("probability", {}).get("moderate_flooding", 0),
                        risk.get("probability", {}).get("major_flooding", 0)
                    )
                    
                    if max_probability >= min_risk_threshold:
                        return risk
                    
                    return None
                except Exception as e:
                    print(f"Error fetching risk for location: {e}")
                    return None
        
        # Fetch all risks concurrently
        tasks = [fetch_risk_with_limit(loc) for loc in locations]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None values and exceptions
        flood_risks = [
            r for r in results 
            if r is not None and not isinstance(r, Exception)
        ]
        
        # Sort by highest risk
        flood_risks.sort(
            key=lambda x: max(
                x.get("probability", {}).get("major_flooding", 0),
                x.get("probability", {}).get("moderate_flooding", 0),
                x.get("probability", {}).get("minor_flooding", 0)
            ),
            reverse=True
        )
        
        # Cache the results for 5 minutes
        await cache_service.set(cache_key, flood_risks, ttl_seconds=300)
        
        return flood_risks
    
    async def get_high_risk_locations(
        self,
        min_major_flood_probability: float = 30.0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get locations with high risk of major flooding.
        
        Args:
            min_major_flood_probability: Minimum probability for major flooding
            limit: Maximum number of results
            
        Returns:
            List of high-risk locations
        """
        all_risks = await self.get_all_flood_risks(min_risk_threshold=min_major_flood_probability)
        
        # Filter for major flooding risk
        high_risk = [
            r for r in all_risks
            if r.get("probability", {}).get("major_flooding", 0) >= min_major_flood_probability
        ]
        
        return high_risk[:limit]
