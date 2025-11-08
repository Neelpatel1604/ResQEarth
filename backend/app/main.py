"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, disasters, prevention

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API for ResQ-Earth PREVENT - Disaster prediction and prevention system",
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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "ResQ-Earth PREVENT API",
        "version": settings.VERSION,
        "docs": "/docs",
    }

