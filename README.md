# 🎥 YouTube Live Auto Streamer

Automate daily live streaming of pre-recorded 3-hour yoga (or similar) videos hosted on Google Drive to YouTube Live, at fixed times (6 AM & 5 PM), automatically starting the stream 10 minutes before each slot — with a simple web UI to select that day's video.

## 🎯 Features

- ✅ **Fixed Schedule Streaming**: Two daily streams (Morning 6 AM, Evening 5 PM)
- ✅ **Auto-Start**: Streams begin 10 minutes before scheduled time
- ✅ **Google Drive Integration**: Stream directly from Drive, no manual uploads
- ✅ **Simple Web UI**: Easy scheduling interface
- ✅ **100% Free**: Runs on Oracle Cloud Free Tier
- ✅ **Automated**: Set it and forget it with cron jobs

## 📋 Architecture

```
Google Drive Videos
        ↓
Web UI / API Backend (Node.js + Express)
        ↓
Supabase Database (Stores schedules)
        ↓
Oracle Cloud VM (FFmpeg + Cron)
        ↓
YouTube Live (RTMP Stream)
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Streaming**: FFmpeg
- **Hosting**: Oracle Cloud Free Tier
- **Process Manager**: PM2
- **Scheduler**: Cron

## 📦 Prerequisites

### On Your Local Machine:
- Git
- SSH access to Oracle Cloud VM

### On Oracle Cloud VM:
- Ubuntu 20.04+ (Free Tier)
- Node.js 16+
- FFmpeg
- Port 3000 open (for web UI)

### Required Accounts:
1. **YouTube Channel** with live streaming enabled
2. **Google Drive** account with videos
3. **Supabase** account (free tier)
4. **Oracle Cloud** account (free tier)

## 🚀 Installation

### Step 1: Set Up Oracle Cloud VM

1. Create an Oracle Cloud Free Tier account
2. Launch an Ubuntu VM instance (Always Free eligible)
3. Configure security rules to allow port 3000
4. SSH into your VM

### Step 2: Clone and Setup

```bash
# SSH into your Oracle VM
ssh ubuntu@your-vm-ip

# Clone the repository (or upload files via SCP)
git clone https://github.com/yourusername/yt-streamer.git
cd yt-streamer

# Run the setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Install FFmpeg, Node.js, and dependencies
- Set up the project structure
- Create necessary directories
- Configure environment variables
- Install PM2 for process management
- Set up cron jobs
- Start the backend server

### Step 3: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project
3. Navigate to SQL Editor
4. Copy and paste the contents of `backend/supabase_migration.sql`
5. Run the migration to create the `schedules` table

### Step 4: Get Your YouTube Stream Key

1. Go to [YouTube Studio](https://studio.youtube.com)
2. Navigate to **Create** → **Go Live**
3. Select **Stream** (not Webcam)
4. Copy your **Stream Key**
5. Add it to your `.env` file

### Step 5: Update Environment Variables

Edit `/home/ubuntu/yt-streamer/backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
YT_KEY=your-youtube-stream-key
PORT=3000
```

### Step 6: Restart Services

```bash
cd ~/yt-streamer/backend
pm2 restart yt-streamer
pm2 save
```

## 🎬 Usage

### Access the Web UI

Open your browser and navigate to:
```
http://your-vm-ip:3000
```

### Schedule a Stream

1. **Select Date**: Choose a date from the date picker
2. **Select Time Slot**: Choose Morning (6 AM) or Evening (5 PM)
3. **Enter Video URL**: Use the Google Drive direct download format:
   ```
   https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
   ```
4. Click **Save Schedule**

### Getting Google Drive File ID

1. Upload your video to Google Drive
2. Right-click → Get link → Change to "Anyone with the link"
3. Copy the link: `https://drive.google.com/file/d/FILE_ID/view`
4. Format as: `https://drive.google.com/uc?export=download&id=FILE_ID`

### View Schedules

The UI automatically displays all scheduled streams with:
- Date and time
- Slot (Morning/Evening)
- Stream start time (10 minutes before)
- Status (Pending, Streaming, Completed, Failed)

## ⏰ Stream Schedule

| Slot | Start Time | Live Time | Description |
|------|------------|-----------|-------------|
| Morning | 5:50 AM | 6:00 AM | 10-minute buffer before going live |
| Evening | 4:50 PM | 5:00 PM | 10-minute buffer before going live |

## 📁 Project Structure

```
yt-streamer/
├── backend/
│   ├── index.js                 # Express server & API
│   ├── stream.js                # FFmpeg streaming logic
│   ├── supabaseClient.js        # Supabase connection
│   ├── supabase_migration.sql   # Database schema
│   ├── package.json             # Dependencies
│   └── .env                     # Environment variables
├── frontend/
│   ├── index.html               # Web UI
│   ├── styles.css               # Styling
│   └── script.js                # Frontend logic
├── logs/
│   ├── morning.log              # Morning stream logs
│   └── evening.log              # Evening stream logs
├── ytstreamer.cron              # Cron job configuration
├── setup.sh                     # Automated setup script
└── README.md                    # This file
```

## 🔧 API Endpoints

### POST /schedule
Create or update a schedule

**Request Body:**
```json
{
  "date": "2025-10-21",
  "slot": "morning",
  "video_url": "https://drive.google.com/uc?export=download&id=FILE_ID"
}
```

**Response:**
```json
{
  "message": "Schedule created successfully!",
  "data": {
    "id": 1,
    "date": "2025-10-21",
    "slot": "morning",
    "video_url": "...",
    "status": "pending",
    "created_at": "2025-10-20T10:30:00Z"
  }
}
```

### GET /schedules
Get all schedules

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-10-21",
      "slot": "morning",
      "video_url": "...",
      "status": "pending",
      "created_at": "2025-10-20T10:30:00Z"
    }
  ]
}
```

## 📊 Database Schema

```sql
schedules (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  slot VARCHAR(10) CHECK (slot IN ('morning', 'evening')),
  video_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, slot)
)
```

## 🐛 Troubleshooting

### Check Server Status
```bash
pm2 status
pm2 logs yt-streamer
```

### Check Stream Logs
```bash
tail -f ~/yt-streamer/logs/morning.log
tail -f ~/yt-streamer/logs/evening.log
```

### Test Cron Jobs
```bash
# List cron jobs
crontab -l
sudo cat /etc/cron.d/ytstreamer

# Check cron service
sudo service cron status

# Test stream manually
cd ~/yt-streamer/backend
node stream.js morning
```

### Restart Everything
```bash
# Restart backend
pm2 restart yt-streamer

# Restart cron
sudo service cron restart

# Reboot VM (if needed)
sudo reboot
```

### Common Issues

**Issue**: Stream doesn't start
- Check if video URL is accessible
- Verify YouTube stream key is correct
- Check FFmpeg is installed: `ffmpeg -version`
- Review logs: `tail -f ~/yt-streamer/logs/morning.log`

**Issue**: Can't access web UI
- Verify server is running: `pm2 status`
- Check firewall rules allow port 3000
- Try accessing locally: `curl http://localhost:3000`

**Issue**: Database connection error
- Verify Supabase credentials in `.env`
- Check migration was run successfully
- Test connection from Supabase dashboard

## 📚 Monitoring

### View All PM2 Processes
```bash
pm2 list
```

### Monitor in Real-Time
```bash
pm2 monit
```

### View Detailed Logs
```bash
pm2 logs yt-streamer --lines 100
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

## 💰 Cost Breakdown

| Component | Platform | Cost |
|-----------|----------|------|
| VM (1 OCPU, 1GB RAM) | Oracle Cloud | **FREE** |
| Database | Supabase | **FREE** |
| FFmpeg | Open Source | **FREE** |
| Storage | Google Drive | **FREE** (15GB) |
| Streaming | YouTube Live | **FREE** |
| **Total** | | **₹0/month** |

## 🔒 Security

- Never commit `.env` file to Git
- Keep YouTube stream key secure
- Use Supabase Row Level Security (RLS) for production
- Consider adding authentication to the web UI for production use
- Regularly update packages: `npm audit fix`

## 🚀 Future Enhancements

- [ ] Add authentication to web UI
- [ ] Support for multiple YouTube channels
- [ ] Email notifications for stream status
- [ ] Stream analytics dashboard
- [ ] Bulk schedule upload via CSV
- [ ] Stream health monitoring
- [ ] Automatic retry on failure

## 📝 License

MIT License - Feel free to use this project for your own streaming needs!

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Support

For issues and questions, please open a GitHub issue or contact the maintainer.

---

**Built with ❤️ for automated streaming**

Happy Streaming! 🎥✨
