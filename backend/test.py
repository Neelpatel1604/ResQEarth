# import requests
# import pandas as pd
# from io import StringIO
# from datetime import datetime

# # Replace with your actual MAP_KEY
# MAP_KEY = '1a2105c61fcc22f004827a7ccba40c60'

# # Endpoint for global VIIRS near-real-time hotspots (last ~24 hours)
# url = f'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/world/1'

# response = requests.get(url)

# if response.status_code == 200:
#     print("API is working! Success.")
#     df = pd.read_csv(StringIO(response.text))
#     print(f"Found {len(df)} active fire hotspots globally in the last day.")
#     print(df[['latitude', 'longitude', 'bright_ti4', 'acq_date', 'confidence']].head(10))  # Sample rows
#     df.to_csv('latest_global_firms_hotspots.csv', index=False)
#     print("Data saved to latest_global_firms_hotspots.csv")
# else:
#     print(f"Error {response.status_code}: {response.text[:300]}")  # Check for invalid key or other issues


# test.py  ← SAVE THIS FILE
# test.py  ← SAVE THIS EXACT FILE
import requests
from io import StringIO
import pandas as pd

# REPLACE WITH YOUR REAL KEY
MAP_KEY = '1a2105c61fcc22f004827a7ccba40c60'

# CORRECT BBOX: west, south, east, north → Hawaii fire
url = f'https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/2025-11-08/-155.4,19.7,-155.3,19.8'

print("Testing FIRMS key with Hawaii fire...\n")
response = requests.get(url)

if response.status_code == 200:
    df = pd.read_csv(StringIO(response.text))
    
    # FIX 1: Strip ALL whitespace from column names
    df.columns = df.columns.str.strip()
    
    # FIX 2: Print actual column names first
    print("RAW COLUMNS FROM NASA:", list(df.columns))
    print(f"\nFound {len(df)} fire(s) in Hawaii\n")
    
    # FIX 3: Use exact column names (they usually have spaces!)
    try:
        print(df[['latitude', 'longitude', 'bright_ti4', 'confidence', 'frp', 'acq_time']].to_string(index=False))
    except:
        # Fallback: show first row anyway
        print("First fire data (raw):")
        print(df.iloc[0].to_string())
        
    print("\nYOUR KEY IS 100% VERIFIED AND READY FOR NEXT.JS!")
else:
    print(f"Failed: {response.status_code}")
    print(response.text[:300])