#!/bin/bash

##############################################
# YouTube Live Streamer - Setup Script
# For Oracle Cloud Free Tier VM
##############################################

set -e  # Exit on any error

echo "================================================"
echo "YouTube Live Streamer - Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}Please do not run this script as root${NC}"
  exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

echo ""
echo -e "${GREEN}Step 2: Installing required packages...${NC}"
sudo apt install -y ffmpeg nodejs npm git curl

echo ""
echo -e "${GREEN}Step 3: Checking installations...${NC}"
echo "FFmpeg version: $(ffmpeg -version | head -n1)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo ""
echo -e "${GREEN}Step 4: Creating project directory...${NC}"
PROJECT_DIR="$HOME/yt-streamer"

if [ -d "$PROJECT_DIR" ]; then
  echo -e "${YELLOW}Project directory already exists at $PROJECT_DIR${NC}"
  read -p "Do you want to remove it and start fresh? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$PROJECT_DIR"
    echo "Removed existing directory"
  else
    echo "Keeping existing directory. Skipping git clone."
    cd "$PROJECT_DIR"
  fi
else
  echo "Creating new project directory at $PROJECT_DIR"
fi

echo ""
echo -e "${GREEN}Step 5: Setting up project files...${NC}"

# If we need to clone from git (modify this based on your needs)
# git clone https://github.com/yourrepo/yt-streamer.git "$PROJECT_DIR"
# For now, assume files are already in place

cd "$PROJECT_DIR/backend"

echo ""
echo -e "${GREEN}Step 6: Installing Node.js dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}Step 7: Creating logs directory...${NC}"
mkdir -p "$PROJECT_DIR/logs"
chmod 755 "$PROJECT_DIR/logs"

echo ""
echo -e "${GREEN}Step 8: Setting up environment variables...${NC}"

if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  echo "Please enter your configuration details:"
  
  read -p "Supabase URL: " SUPABASE_URL
  read -p "Supabase Key: " SUPABASE_KEY
  read -p "YouTube Stream Key: " YT_KEY
  
  cat > "$PROJECT_DIR/backend/.env" << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_KEY=$SUPABASE_KEY
YT_KEY=$YT_KEY
PORT=3000
EOF
  
  echo -e "${GREEN}.env file created successfully${NC}"
else
  echo -e "${YELLOW}.env file already exists. Skipping...${NC}"
fi

echo ""
echo -e "${GREEN}Step 9: Setting up cron jobs...${NC}"
sudo cp "$PROJECT_DIR/ytstreamer.cron" /etc/cron.d/ytstreamer
sudo chmod 644 /etc/cron.d/ytstreamer
sudo service cron restart
echo "Cron jobs installed successfully"

echo ""
echo -e "${GREEN}Step 10: Installing PM2 for process management...${NC}"
sudo npm install -g pm2

echo ""
echo -e "${GREEN}Step 11: Starting the backend server with PM2...${NC}"
cd "$PROJECT_DIR/backend"
pm2 delete yt-streamer 2>/dev/null || true  # Delete if exists
pm2 start index.js --name yt-streamer
pm2 save
pm2 startup | tail -n 1 | bash

echo ""
echo -e "${GREEN}Step 12: Running Supabase migration...${NC}"
echo -e "${YELLOW}Please run the following SQL in your Supabase SQL Editor:${NC}"
echo "File location: $PROJECT_DIR/backend/supabase_migration.sql"
echo ""
echo -e "${YELLOW}Or copy and paste this command in Supabase SQL Editor:${NC}"
cat "$PROJECT_DIR/backend/supabase_migration.sql"

echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Run the migration SQL in Supabase SQL Editor"
echo "2. Access your web UI at: http://$(curl -s ifconfig.me):3000"
echo "3. Check server status: pm2 status"
echo "4. View logs: pm2 logs yt-streamer"
echo "5. View stream logs: tail -f $PROJECT_DIR/logs/morning.log"
echo ""
echo "Useful commands:"
echo "- Restart server: pm2 restart yt-streamer"
echo "- Stop server: pm2 stop yt-streamer"
echo "- View all processes: pm2 list"
echo "- Monitor: pm2 monit"
echo ""
echo -e "${GREEN}Happy Streaming! 🎥${NC}"
