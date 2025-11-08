# Frontend-Backend Connection Setup Guide

## Quick Start

### 1. Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create environment file (optional):**
   ```bash
   cp env.example .env
   # Edit .env if needed (defaults work for local development)
   ```

3. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   
   The backend will run on `http://localhost:8000`

### 2. Frontend Setup

1. **Create environment file:**
   ```bash
   cd frontend
   cp env.local.example .env.local
   ```

2. **Edit `.env.local` and add:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:3000`

### 3. Test the Connection

1. **Open your browser** to `http://localhost:3000`
2. **Look for the "Backend Connection" card** on the main page
3. **Click "Test Connection"** - it should show:
   - ✅ Status: healthy
   - Service: ResQ-Earth PREVENT API
   - Timestamp of last check

### 4. Verify Backend is Running

- **Backend API Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`
- **Root Endpoint:** `http://localhost:8000/`

### 5. Test API Endpoints

You can test these endpoints from the frontend:

- **Health Check:**
  ```typescript
  import { api } from '@/lib/api/client'
  const health = await api.get('/api/health')
  ```

- **List Disasters:**
  ```typescript
  const disasters = await api.get('/api/disasters')
  ```

- **Get Specific Disaster:**
  ```typescript
  const disaster = await api.get('/api/disasters/threat-001')
  ```

## Troubleshooting

### Backend not connecting?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Check CORS configuration:**
   - Make sure `http://localhost:3000` is in the CORS_ORIGINS list
   - Check `backend/app/config.py`

3. **Check environment variables:**
   - Make sure `NEXT_PUBLIC_API_URL` is set in `frontend/.env.local`
   - Restart the frontend after changing `.env.local`

### CORS Errors?

If you see CORS errors in the browser console:
1. Make sure the backend is running
2. Check that the frontend URL matches one in `CORS_ORIGINS` in `backend/app/config.py`
3. Restart both servers

### Connection Timeout?

1. Check that both servers are running
2. Check the port numbers match (backend: 8000, frontend: 3000)
3. Try accessing the backend directly: `http://localhost:8000/api/health`

## Files Created

### Backend
- `backend/app/main.py` - FastAPI app with CORS
- `backend/app/routes/health.py` - Health check endpoint
- `backend/app/routes/disasters.py` - Disaster endpoints
- `backend/app/routes/prevention.py` - Prevention endpoints

### Frontend
- `frontend/lib/api/client.ts` - API client utility
- `frontend/hooks/useApi.ts` - React hooks for API calls
- `frontend/components/backend-connection.tsx` - Connection test component
- `frontend/app/api/health/route.ts` - Health check proxy route

## Next Steps

Once the connection is working:
1. Test the disaster endpoints
2. Test the prevention planning endpoints
3. Build out the UI components to use the API
4. Connect to Supabase for data persistence

