import requests
import pandas as pd
from io import StringIO
from datetime import datetime

# Replace with your actual MAP_KEY
MAP_KEY = '1a2105c61fcc22f004827a7ccba40c60'

# Endpoint for global VIIRS near-real-time hotspots (last ~24 hours)
url = f'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/world/1'

response = requests.get(url)

if response.status_code == 200:
    print("API is working! Success.")
    df = pd.read_csv(StringIO(response.text))
    print(f"Found {len(df)} active fire hotspots globally in the last day.")
    print(df[['latitude', 'longitude', 'bright_ti4', 'acq_date', 'confidence']].head(10))  # Sample rows
    df.to_csv('latest_global_firms_hotspots.csv', index=False)
    print("Data saved to latest_global_firms_hotspots.csv")
else:
    print(f"Error {response.status_code}: {response.text[:300]}")  # Check for invalid key or other issues


# test.py  ← SAVE THIS FILE
# test.py  ← SAVE THIS EXACT FILE
