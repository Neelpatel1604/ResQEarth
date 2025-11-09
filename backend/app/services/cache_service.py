"""Simple in-memory cache for API responses."""
from typing import Optional, Any, Dict
from datetime import datetime, timedelta
import asyncio


class CacheService:
    """Simple in-memory cache with TTL."""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        async with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            if datetime.utcnow() > entry["expires_at"]:
                # Expired, remove it
                del self._cache[key]
                return None
            
            return entry["value"]
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value in cache with TTL."""
        async with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds)
            }
    
    async def clear(self):
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()
    
    async def delete(self, key: str):
        """Delete specific cache entry."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]


# Singleton instance
cache_service = CacheService()
