"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routes import health, disasters, prevention, alerts, reports
from app.scheduler import disaster_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Start the disaster monitoring scheduler
    disaster_scheduler.start(interval_minutes=30)  # Check every 30 minutes
    yield
    # Shutdown: Stop the scheduler
    disaster_scheduler.stop()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API for ResQ-Earth PREVENT - Disaster prediction and prevention system",
    lifespan=lifespan
)

# Configure CORS
# Parse CORS_ORIGINS from string to list
cors_origins = settings.get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["health"])
app.include_router(disasters.router, prefix=settings.API_V1_PREFIX, tags=["disasters"])
app.include_router(prevention.router, prefix=settings.API_V1_PREFIX, tags=["prevention"])
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX, tags=["alerts"])
app.include_router(reports.router, prefix=settings.API_V1_PREFIX, tags=["reports"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "ResQ-Earth PREVENT API",
        "version": settings.VERSION,
        "docs": "/docs",
    }

