# NOAA Water API Usage Guide

## Mass Pull for Entire Map

### Quick Start

**Get all high-risk flood locations:**
```bash
curl http://localhost:8000/api/noaa/flood-risks/high-risk
```

**Get all flood risks for a specific state:**
```bash
curl "http://localhost:8000/api/noaa/flood-risks/all?state=CA&min_risk=10"
```

**Get all flood risks nationwide (may take 30-60 seconds):**
```bash
curl "http://localhost:8000/api/noaa/flood-risks/all?min_risk=15&max_concurrent=20"
```

## API Endpoints

### 1. Mass Pull - All Flood Risks
`GET /api/noaa/flood-risks/all`

**Query Parameters:**
- `state` (optional): Filter by state code (e.g., CA, TX, FL)
- `min_risk` (default: 10.0): Minimum risk percentage (0-100)
- `max_concurrent` (default: 10): Concurrent API requests (1-50)

**Response:**
```json
{
  "flood_risks": [
    {
      "location_id": "PTSA2",
      "location_name": "Peters Creek",
      "state": "AK",
      "latitude": 61.234,
      "longitude": -149.876,
      "forecast_date": "2025-11-08",
      "probability": {
        "minor_flooding": 45.2,
        "moderate_flooding": 23.1,
        "major_flooding": 8.5
      },
      "thresholds": {
        "minor": 1500,
        "moderate": 2000,
        "major": 2500
      },
      "ensemble_members": 51
    }
  ],
  "count": 42,
  "filter": {
    "state": "AK",
    "min_risk_percentage": 10.0
  }
}
```

### 2. High-Risk Locations Only
`GET /api/noaa/flood-risks/high-risk`

**Query Parameters:**
- `min_probability` (default: 30.0): Minimum major flood probability
- `limit` (default: 50): Maximum results (1-200)

**Use Case:** Get only the most critical locations for dashboard alerts

### 3. Individual Location
`GET /api/noaa/flood-risk/{location_id}`

**Use Case:** Get detailed risk for a specific location when user clicks on map

### 4. Clear Cache
`POST /api/noaa/cache/clear`

**Use Case:** Force fresh data from NOAA API (cache is 5 minutes by default)

## Frontend Integration Example

### React/Next.js Hook
```typescript
// hooks/useFloodRisks.ts
import { useState, useEffect } from 'react';

interface FloodRisk {
  location_id: string;
  location_name: string;
  state: string;
  latitude: number;
  longitude: number;
  probability: {
    minor_flooding: number;
    moderate_flooding: number;
    major_flooding: number;
  };
}

export function useFloodRisks(state?: string, minRisk: number = 15) {
  const [risks, setRisks] = useState<FloodRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRisks() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          min_risk: minRisk.toString(),
          max_concurrent: '20'
        });
        
        if (state) {
          params.append('state', state);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/noaa/flood-risks/all?${params}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch flood risks');
        
        const data = await response.json();
        setRisks(data.flood_risks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchRisks();
  }, [state, minRisk]);

  return { risks, loading, error };
}
```

### Display on Map
```typescript
// components/FloodMap.tsx
import { useFloodRisks } from '@/hooks/useFloodRisks';
import { MapboxMap } from './MapboxMap';

export function FloodMap() {
  const { risks, loading } = useFloodRisks();

  if (loading) return <div>Loading flood data...</div>;

  return (
    <MapboxMap>
      {risks.map((risk) => (
        <Marker
          key={risk.location_id}
          latitude={risk.latitude}
          longitude={risk.longitude}
          color={getColorByRisk(risk.probability.major_flooding)}
        >
          <Popup>
            <h3>{risk.location_name}</h3>
            <p>Major Flood Risk: {risk.probability.major_flooding.toFixed(1)}%</p>
            <p>Moderate: {risk.probability.moderate_flooding.toFixed(1)}%</p>
            <p>Minor: {risk.probability.minor_flooding.toFixed(1)}%</p>
          </Popup>
        </Marker>
      ))}
    </MapboxMap>
  );
}

function getColorByRisk(probability: number): string {
  if (probability >= 50) return '#dc2626'; // red
  if (probability >= 30) return '#f59e0b'; // orange
  if (probability >= 15) return '#fbbf24'; // yellow
  return '#3b82f6'; // blue
}
```

## Performance Tips

1. **Use caching**: Results are cached for 5 minutes automatically
2. **Filter by state**: Reduces API calls significantly
3. **Adjust min_risk**: Higher threshold = fewer locations = faster response
4. **Increase max_concurrent**: Up to 20-30 for faster bulk pulls
5. **Use high-risk endpoint**: For dashboard alerts, only fetch critical locations

## Rate Limiting

The NOAA API is public but may have rate limits. The service:
- Limits concurrent requests (default: 10)
- Caches results for 5 minutes
- Handles errors gracefully

If you hit rate limits, reduce `max_concurrent` or increase cache TTL.

## State Codes

Common state codes for filtering:
- CA (California)
- TX (Texas)
- FL (Florida)
- LA (Louisiana)
- AK (Alaska)
- WA (Washington)
- OR (Oregon)
- NY (New York)

Use 2-letter postal codes.
