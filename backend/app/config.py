"""Configuration management for the backend application."""
import os
from typing import Optional, Union
try:
    from pydantic_settings import BaseSettings
    from pydantic import field_validator
except ImportError:
    # Fallback for older pydantic versions
    from pydantic import BaseSettings, validator as field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "ResQ-Earth PREVENT API"
    VERSION: str = "0.1.0"
    
    # CORS Configuration - stored as string, parsed to list
    # Default value as comma-separated string for .env compatibility
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from string or list."""
        if v is None:
            return "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
        if isinstance(v, list):
            # If it's already a list, convert to comma-separated string
            return ",".join(str(origin) for origin in v)
        # If it's a string, return as is (will be parsed later)
        return str(v) if v else "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    
    def get_cors_origins(self) -> list[str]:
        """Get CORS origins as a list."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        # Parse comma-separated string
        origins_str = str(self.CORS_ORIGINS)
        if not origins_str:
            return ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
        return [origin.strip() for origin in origins_str.split(',') if origin.strip()]
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    # External API Keys (for satellite data)
    NASA_API_KEY: Optional[str] = None
    MAPBOX_API_KEY: Optional[str] = None
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

