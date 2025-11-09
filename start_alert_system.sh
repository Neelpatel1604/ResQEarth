#!/bin/bash

echo "=================================="
echo "ResQ-Earth Email Alert System"
echo "=================================="
echo ""

# Check if in backend directory
if [ ! -f "backend/app/main.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if SendGrid API key is configured
if ! grep -q "SENDGRID_API_KEY=SG\." backend/.env.local 2>/dev/null; then
    echo "⚠️  SendGrid API key not configured!"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Sign up at: https://signup.sendgrid.com/"
    echo "2. Create an API key: Settings → API Keys → Create API Key"
    echo "3. Verify your sender email: Settings → Sender Authentication"
    echo "4. Add to backend/.env.local:"
    echo ""
    echo "   SENDGRID_API_KEY=SG.your_key_here"
    echo "   SENDGRID_FROM_EMAIL=your-verified@email.com"
    echo "   SENDGRID_FROM_NAME=ResQ-Earth Alert System"
    echo ""
    echo "See SETUP_INSTRUCTIONS.md for detailed steps"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

# Check if dependencies are installed
echo "Checking dependencies..."
if ! python3 -c "import sendgrid" 2>/dev/null; then
    echo "📦 Installing sendgrid..."
    pip install sendgrid
fi

if ! python3 -c "import apscheduler" 2>/dev/null; then
    echo "📦 Installing apscheduler..."
    pip install apscheduler
fi

echo "✅ Dependencies installed"
echo ""

# Check if subscribers.csv exists
if [ ! -f "backend/subscribers.csv" ]; then
    echo "⚠️  subscribers.csv not found, creating sample file..."
    cat > backend/subscribers.csv << 'EOF'
email,name,location,disaster_types
user1@example.com,John Doe,California,"flood,wildfire,earthquake"
user2@example.com,Jane Smith,Texas,"flood,hurricane"
EOF
    echo "✅ Created backend/subscribers.csv (edit this file to add real emails)"
    echo ""
fi

echo "=================================="
echo "Starting Backend Server..."
echo "=================================="
echo ""
echo "The system will:"
echo "  ✓ Monitor for disasters every 30 minutes"
echo "  ✓ Send email alerts to subscribers"
echo "  ✓ Track alert history"
echo ""
echo "API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""
echo "To test, run in another terminal:"
echo "  curl -X POST 'http://localhost:8000/api/alerts/test?email=your@email.com'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "=================================="
echo ""

cd backend
uvicorn app.main:app --reload --port 8000
