# 🚀 Quick Start Guide

Get your YouTube Live Auto Streamer up and running in minutes!

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Oracle Cloud account (Free Tier)
- [ ] Supabase account
- [ ] YouTube channel with live streaming enabled
- [ ] Google Drive with your video files
- [ ] SSH access to your Oracle Cloud VM

## ⚡ 5-Minute Setup

### Step 1: Prepare Your Credentials (2 min)

1. **Supabase**: Get your URL and API key from [supabase.com](https://supabase.com)
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: `eyJhbG...`

2. **YouTube**: Get your stream key from [YouTube Studio](https://studio.youtube.com)
   - Go to: Create → Go Live → Stream
   - Copy the Stream Key

3. **Google Drive**: Prepare your video file
   - Upload video to Drive
   - Share: "Anyone with the link"
   - Note the File ID from the URL

### Step 2: Upload Files to Oracle VM (1 min)

```bash
# From your local machine
cd /path/to/yt-streamer
scp -r * ubuntu@your-vm-ip:~/yt-streamer/
```

Or clone from Git:
```bash
# On Oracle VM
git clone https://github.com/yourusername/yt-streamer.git
cd yt-streamer
```

### Step 3: Run Setup Script (2 min)

```bash
# On Oracle VM
chmod +x setup.sh
./setup.sh
```

The script will ask for:
- Supabase URL
- Supabase Key
- YouTube Stream Key

### Step 4: Run Database Migration

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy contents of `backend/supabase_migration.sql`
3. Paste and run

### Step 5: Access Your Web UI

```
http://your-vm-ip:3000
```

## 🎬 Your First Stream

1. Open the web UI
2. Select today's date
3. Choose "Morning" or "Evening"
4. Enter your Google Drive URL:
   ```
   https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
   ```
5. Click "Save Schedule"

## ✅ Verification

Run the test script to verify everything is working:

```bash
./test-setup.sh
```

## 🧪 Test Manually

Test streaming without waiting for scheduled time:

```bash
cd ~/yt-streamer/backend
node stream.js morning
```

⚠️ **Warning**: This will start streaming immediately!

## 🔧 Common Commands

```bash
# View server status
pm2 status

# View server logs
pm2 logs yt-streamer

# View stream logs
tail -f ~/yt-streamer/logs/morning.log
tail -f ~/yt-streamer/logs/evening.log

# Restart server
pm2 restart yt-streamer

# Check cron jobs
sudo cat /etc/cron.d/ytstreamer
```

## 🐛 Troubleshooting

### Server won't start
```bash
cd ~/yt-streamer/backend
npm install
pm2 restart yt-streamer
```

### Can't access web UI
```bash
# Check if port 3000 is open
sudo ufw status
sudo ufw allow 3000
```

### Stream doesn't start
- Check if schedule exists in database (via web UI)
- Verify Google Drive link is accessible
- Check YouTube stream key is correct
- Review logs: `tail -f logs/morning.log`

## 📚 Next Steps

- Read the full [README.md](README.md)
- Schedule streams for the next 7 days
- Monitor your first automated stream
- Check YouTube Studio for stream analytics

## 💡 Pro Tips

1. **Schedule in advance**: Fill your schedule for the next week
2. **Test first**: Always test with a short video first
3. **Monitor logs**: Keep an eye on logs during your first few streams
4. **Backup schedule**: Export your Supabase data regularly

## 🎉 That's it!

Your automated YouTube streamer is now ready. Streams will automatically start at:
- **Morning**: 5:50 AM (live at 6:00 AM)
- **Evening**: 4:50 PM (live at 5:00 PM)

---

Need help? Check the [full documentation](README.md) or troubleshooting section.
