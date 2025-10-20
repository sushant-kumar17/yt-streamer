#!/bin/bash

##############################################
# YouTube Live Streamer - Test Setup Script
# Verify your installation is working
##############################################

echo "================================================"
echo "YouTube Live Streamer - Setup Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track overall status
ERRORS=0

# Function to check command exists
check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 is installed"
    return 0
  else
    echo -e "${RED}✗${NC} $1 is NOT installed"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 does NOT exist"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

echo "1. Checking required commands..."
check_command node
check_command npm
check_command ffmpeg
check_command pm2

echo ""
echo "2. Checking project structure..."
PROJECT_DIR="$HOME/yt-streamer"

if [ -d "$PROJECT_DIR" ]; then
  echo -e "${GREEN}✓${NC} Project directory exists at $PROJECT_DIR"
else
  echo -e "${YELLOW}⚠${NC} Project directory not found at $PROJECT_DIR"
  PROJECT_DIR="$(pwd)"
  echo "   Using current directory: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

check_file "backend/index.js"
check_file "backend/stream.js"
check_file "backend/supabaseClient.js"
check_file "backend/package.json"
check_file "frontend/index.html"
check_file "frontend/styles.css"
check_file "frontend/script.js"
check_file "ytstreamer.cron"

echo ""
echo "3. Checking environment configuration..."
if check_file "backend/.env"; then
  # Check if .env has required variables
  if grep -q "SUPABASE_URL" backend/.env; then
    echo -e "${GREEN}✓${NC} SUPABASE_URL is set"
  else
    echo -e "${RED}✗${NC} SUPABASE_URL is missing"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "SUPABASE_KEY" backend/.env; then
    echo -e "${GREEN}✓${NC} SUPABASE_KEY is set"
  else
    echo -e "${RED}✗${NC} SUPABASE_KEY is missing"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "YT_KEY" backend/.env; then
    echo -e "${GREEN}✓${NC} YT_KEY is set"
  else
    echo -e "${RED}✗${NC} YT_KEY is missing"
    ERRORS=$((ERRORS + 1))
  fi
fi

echo ""
echo "4. Checking Node.js dependencies..."
cd backend
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules directory exists"
  
  # Check key dependencies
  if [ -d "node_modules/@supabase" ]; then
    echo -e "${GREEN}✓${NC} @supabase/supabase-js is installed"
  else
    echo -e "${YELLOW}⚠${NC} @supabase/supabase-js might not be installed"
  fi
  
  if [ -d "node_modules/express" ]; then
    echo -e "${GREEN}✓${NC} express is installed"
  else
    echo -e "${YELLOW}⚠${NC} express might not be installed"
  fi
else
  echo -e "${RED}✗${NC} node_modules not found. Run 'npm install' in backend/"
  ERRORS=$((ERRORS + 1))
fi

cd ..

echo ""
echo "5. Checking logs directory..."
if [ -d "logs" ]; then
  echo -e "${GREEN}✓${NC} logs directory exists"
else
  echo -e "${YELLOW}⚠${NC} logs directory not found. Creating..."
  mkdir -p logs
  echo -e "${GREEN}✓${NC} logs directory created"
fi

echo ""
echo "6. Checking cron setup (requires sudo)..."
if [ -f "/etc/cron.d/ytstreamer" ]; then
  echo -e "${GREEN}✓${NC} Cron job is installed"
else
  echo -e "${YELLOW}⚠${NC} Cron job not found. Run: sudo cp ytstreamer.cron /etc/cron.d/ytstreamer"
fi

echo ""
echo "7. Checking PM2 processes..."
if command -v pm2 &> /dev/null; then
  PM2_STATUS=$(pm2 list | grep yt-streamer || true)
  if [ ! -z "$PM2_STATUS" ]; then
    echo -e "${GREEN}✓${NC} PM2 process 'yt-streamer' is running"
    pm2 list | grep yt-streamer
  else
    echo -e "${YELLOW}⚠${NC} PM2 process 'yt-streamer' not found"
    echo "   Start it with: pm2 start backend/index.js --name yt-streamer"
  fi
fi

echo ""
echo "8. Testing Node.js syntax..."
cd backend
node -c index.js 2>/dev/null && echo -e "${GREEN}✓${NC} index.js syntax is valid" || { echo -e "${RED}✗${NC} index.js has syntax errors"; ERRORS=$((ERRORS + 1)); }
node -c stream.js 2>/dev/null && echo -e "${GREEN}✓${NC} stream.js syntax is valid" || { echo -e "${RED}✗${NC} stream.js has syntax errors"; ERRORS=$((ERRORS + 1)); }
node -c supabaseClient.js 2>/dev/null && echo -e "${GREEN}✓${NC} supabaseClient.js syntax is valid" || { echo -e "${RED}✗${NC} supabaseClient.js has syntax errors"; ERRORS=$((ERRORS + 1)); }

echo ""
echo "================================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Your setup looks good.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Make sure you've run the Supabase migration"
  echo "2. Start the server: pm2 start backend/index.js --name yt-streamer"
  echo "3. Access UI at: http://localhost:3000"
  echo "4. Test manually: node backend/stream.js morning"
else
  echo -e "${RED}❌ Found $ERRORS issue(s). Please fix them before proceeding.${NC}"
  exit 1
fi
echo "================================================"
