#!/bin/bash
# API Examples for Disaster Alert System
# Make sure the backend server is running: uvicorn app.main:app --reload

API_URL="http://localhost:8000/api"

echo "=================================="
echo "Disaster Alert System - API Examples"
echo "=================================="
echo ""

# 1. Get Subscribers
echo "1. Get all subscribers:"
echo "   curl -X GET \"$API_URL/alerts/subscribers\""
echo ""
curl -X GET "$API_URL/alerts/subscribers" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 2. Send Test Alert
echo "2. Send test alert:"
echo "   curl -X POST \"$API_URL/alerts/test?email=test@example.com\""
echo ""
curl -X POST "$API_URL/alerts/test?email=test@example.com" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 3. Send Manual Flood Alert
echo "3. Send manual flood alert:"
cat << 'EOF'
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "high",
    "location": "Sacramento, CA",
    "description": "Major flooding expected in the Sacramento River basin. Water levels are rising rapidly. Residents in low-lying areas should prepare to evacuate.",
    "probability": 75.5,
    "latitude": 38.5816,
    "longitude": -121.4944
  }'
EOF
echo ""
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "flood",
    "severity": "high",
    "location": "Sacramento, CA",
    "description": "Major flooding expected in the Sacramento River basin. Water levels are rising rapidly. Residents in low-lying areas should prepare to evacuate.",
    "probability": 75.5,
    "latitude": 38.5816,
    "longitude": -121.4944
  }' | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 4. Send Manual Wildfire Alert
echo "4. Send manual wildfire alert:"
cat << 'EOF'
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "wildfire",
    "severity": "critical",
    "location": "Los Angeles County, CA",
    "description": "Fast-moving wildfire threatening residential areas. Mandatory evacuations in effect for zones A, B, and C. High winds expected to continue.",
    "probability": 90.0,
    "latitude": 34.0522,
    "longitude": -118.2437
  }'
EOF
echo ""
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "wildfire",
    "severity": "critical",
    "location": "Los Angeles County, CA",
    "description": "Fast-moving wildfire threatening residential areas. Mandatory evacuations in effect for zones A, B, and C. High winds expected to continue.",
    "probability": 90.0,
    "latitude": 34.0522,
    "longitude": -118.2437
  }' | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 5. Send Manual Hurricane Alert
echo "5. Send manual hurricane alert:"
cat << 'EOF'
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "hurricane",
    "severity": "critical",
    "location": "Miami-Dade County, FL",
    "description": "Category 4 hurricane approaching. Expected landfall in 24 hours. Storm surge of 10-15 feet predicted. Evacuate immediately if in evacuation zones.",
    "probability": 95.0,
    "latitude": 25.7617,
    "longitude": -80.1918
  }'
EOF
echo ""
curl -X POST "$API_URL/alerts/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_type": "hurricane",
    "severity": "critical",
    "location": "Miami-Dade County, FL",
    "description": "Category 4 hurricane approaching. Expected landfall in 24 hours. Storm surge of 10-15 feet predicted. Evacuate immediately if in evacuation zones.",
    "probability": 95.0,
    "latitude": 25.7617,
    "longitude": -80.1918
  }' | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 6. Check for Real Disasters
echo "6. Check for real disasters (NOAA data):"
echo "   curl -X POST \"$API_URL/alerts/check-and-send\""
echo ""
curl -X POST "$API_URL/alerts/check-and-send" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# 7. Get Alert History
echo "7. Get alert history (last 10):"
echo "   curl -X GET \"$API_URL/alerts/history?limit=10\""
echo ""
curl -X GET "$API_URL/alerts/history?limit=10" | jq '.'
echo ""

echo "=================================="
echo "All examples completed!"
echo "=================================="
