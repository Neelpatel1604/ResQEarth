# ResQ-Earth Backend API

FastAPI backend server for ResQ-Earth PREVENT disaster prediction and prevention system.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /api/health` - Check if backend is running

### Disasters
- `GET /api/disasters` - List all disaster threats
- `GET /api/disasters/{threat_id}` - Get specific disaster details
- `GET /api/disasters/count/total` - Get total count of active threats

### Prevention
- `POST /api/prevention/calculate` - Calculate prevention plan
- `POST /api/prevention/simulate` - Run 72-hour simulation

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration management
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py        # Health check endpoints
│   │   ├── disasters.py    # Disaster endpoints
│   │   └── prevention.py    # Prevention endpoints
│   └── services/
│       ├── __init__.py
│       └── ai_service.py    # AI/genetic algorithm service
├── requirements.txt
├── .env.example
└── README.md
```

## Development

The backend uses:
- **FastAPI** for the web framework
- **Pydantic** for data validation
- **Uvicorn** as the ASGI server
- **Supabase** for database (when configured)

## Testing the Connection

1. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:8000/api/health
   ```

3. Start the frontend and verify CORS is working correctly.

