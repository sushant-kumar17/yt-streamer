# 🚀 Render Deployment Guide for YouTube Live Auto Streamer

Complete step-by-step guide to deploy yt-streamer on Render with exact UI selections and configurations.

## 📋 Prerequisites

- [ ] Render account (free tier available at [render.com](https://render.com))
- [ ] GitHub account with your yt-streamer repository pushed
- [ ] Supabase account with project and migration applied
- [ ] YouTube stream key
- [ ] Google Drive videos ready

## 🎯 Deployment Overview

Your deployment will consist of:
1. **Web Service** (Backend API + Frontend) - Node.js on Render
2. **Cron Jobs** (Morning & Evening Streams) - Background jobs on Render
3. **Supabase Database** - External PostgreSQL (already configured)

---

## ✅ Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

**Note**: Make sure your repository has:
- `backend/package.json`
- `backend/index.js`
- `backend/stream.js`
- `frontend/index.html`, `styles.css`, `script.js`
- `render.yaml` (included in this repo)
- `.gitignore` (with `.env` listed)

### 1.2 Ensure `.gitignore` Excludes `.env`

Your `.gitignore` should contain:
```
.env
.env.local
node_modules/
logs/
```

---

## 🔐 Step 2: Create Render Account & Dashboard Setup

### 2.1 Create Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started"** (top right)
3. Sign up with GitHub (recommended for easy repo connection)
   - **Email**: Your email
   - **Password**: Create a strong password
   - **Authorize Render** to access your GitHub account

### 2.2 Create New Project
1. Click **"New +"** (top navigation)
2. Select **"Blueprint"**
3. You'll see: "Deploy from Git with a `render.yaml`"

---

## 🛠️ Step 3: Deploy Using Blueprint (render.yaml)

### 3.1 Connect GitHub Repository

1. **Step 1 - Select Git Provider**
   - Select: **GitHub**
   - Click **"Connect"**
   - Authorize Render to your GitHub account (if not already done)

2. **Step 2 - Select Repository**
   - Search for: `yt-streamer`
   - Click on your repository
   - **Branch**: `main` (or your primary branch)
   - Click **"Next"**

### 3.2 Review Blueprint Configuration

You'll see the services from `render.yaml`:

**Service 1: Web Service (Backend)**
- **Name**: `yt-streamer` (auto-populated)
- **Runtime**: `Node`
- **Build Command**: `cd backend && npm install` ✓
- **Start Command**: `cd backend && node index.js` ✓

**Service 2: Cron Job (Morning Stream)**
- **Name**: `morning-stream`
- **Type**: `Background Job` (Cron)
- **Schedule**: `50 5 * * *` (5:50 AM UTC every day)

**Service 3: Cron Job (Evening Stream)**
- **Name**: `evening-stream`
- **Type**: `Background Job` (Cron)
- **Schedule**: `50 16 * * *` (4:50 PM UTC every day)

### 3.3 Configure Environment Variables

Before clicking Deploy, Render will prompt you to add environment variables.

**For Web Service:**

| Key | Value | Type |
|-----|-------|------|
| `NODE_ENV` | `production` | Secret |
| `PORT` | `3000` | Text |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Secret |
| `SUPABASE_KEY` | `eyJ...` | Secret |
| `YT_KEY` | Your YouTube stream key | Secret |

**Steps:**
1. In the "Environment" section, click **"Add Environment Variable"**
2. For each variable:
   - **Key**: Enter the key name
   - **Value**: Enter the value
   - **Type**: Select **"Secret"** for sensitive data
3. Repeat for all variables above

### 3.4 Review & Deploy

1. Click the **"Deploy"** button
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build your services
   - Start them
3. Wait for all services to show **"Live"** status

---

## 📝 Step 4: Configure Environment Variables on Render Dashboard

After deployment, you may need to update environment variables. Here's how:

### 4.1 For Web Service

1. Go to **Dashboard** (top left)
2. Click on the **`yt-streamer`** service (web service)
3. Click **"Environment"** (left sidebar)
4. Click **"Add Environment Variable"** for each:

```
NODE_ENV = production
PORT = 3000
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-anon-key
YT_KEY = your-youtube-stream-key
```

5. Click **"Save"**
6. Render will auto-redeploy with new environment variables

### 4.2 For Cron Jobs (Morning & Evening)

1. Go to **Dashboard**
2. Click on **`morning-stream`** service
3. Click **"Environment"**
4. Add the same environment variables:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_KEY = your-anon-key
   YT_KEY = your-youtube-stream-key
   ```
5. Click **"Save"**

6. Repeat for **`evening-stream`** service

---

## 🌐 Step 5: Get Your Web Service URL

1. Go to **Dashboard**
2. Click on the **`yt-streamer`** web service
3. Under **"Settings"**, find **"Service URL"**
4. It will look like: `https://yt-streamer-xxxx.onrender.com`
5. This is your public URL to access the web UI

**Test it:**
```
https://yt-streamer-xxxx.onrender.com
```

You should see the YouTube Auto Streamer web interface.

---

## ⏰ Step 6: Verify Cron Jobs

### 6.1 Check Morning Stream Job

1. Go to **Dashboard**
2. Click on **`morning-stream`**
3. Check **"Logs"** (to verify it's connected)
4. You should see status like: `Scheduled` or `Ready`

### 6.2 Check Evening Stream Job

1. Go to **Dashboard**
2. Click on **`evening-stream`**
3. Verify the schedule: Should show `50 16 * * *` (4:50 PM UTC)

**Note**: Render runs cron jobs in UTC. Adjust the schedule if needed:
- Morning 5:50 AM IST = 12:20 AM UTC → Schedule: `20 0 * * *`
- Evening 4:50 PM IST = 11:20 AM UTC → Schedule: `20 11 * * *`

To adjust:
1. Click on the job
2. Go to **"Settings"**
3. Update **"Cron Schedule"**
4. Click **"Save"**

---

## 🧪 Step 7: Test Your Deployment

### 7.1 Test Web UI

```
curl https://yt-streamer-xxxx.onrender.com
```

You should get the HTML response.

### 7.2 Test API Endpoint

```bash
curl -X GET https://yt-streamer-xxxx.onrender.com/schedules
```

Expected response:
```json
{
  "data": []
}
```

### 7.3 Create a Test Schedule

```bash
curl -X POST https://yt-streamer-xxxx.onrender.com/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-21",
    "slot": "morning",
    "video_url": "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID"
  }'
```

---

## 🚨 Step 8: Troubleshooting

### Issue: Web Service Won't Start

**Symptoms**: Service shows "Failed" or "Crashed"

**Solution**:
1. Click on service
2. Go to **"Logs"**
3. Look for error messages
4. Common causes:
   - Missing environment variables → Add them
   - Missing dependencies → Run `npm install` in backend/
   - Wrong start command → Check `render.yaml`

### Issue: Cron Jobs Not Running

**Symptoms**: Jobs show "Inactive" or don't execute

**Solution**:
1. Check **"Logs"** in the cron job dashboard
2. Verify environment variables are set
3. Check the schedule format (should be cron format)
4. Test manually:
   - Click **"Manual Trigger"** if available
   - Or wait for the next scheduled time

### Issue: Can't Connect to Supabase

**Symptoms**: API returns database connection errors

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
2. Check Supabase project is active
3. Verify database migration was applied:
   - Go to Supabase Dashboard
   - SQL Editor
   - Confirm `schedules` table exists

### Issue: Cron Jobs Execute But Stream Doesn't Start

**Symptoms**: Jobs run but no stream appears on YouTube

**Solution**:
1. Verify `YT_KEY` is correct
2. Check Google Drive URL is accessible
3. Review cron job logs for FFmpeg errors
4. Test stream manually (if possible from cron job logs)

---

## 📊 Monitoring & Logs

### View Service Logs

1. Go to **Dashboard**
2. Click on the service (`yt-streamer`, `morning-stream`, or `evening-stream`)
3. Click **"Logs"** tab
4. Real-time logs will appear

### Common Log Patterns

**Good (Web Service Starting)**:
```
npm notice
npm WARN deprecated ...
> listening on port 3000
```

**Good (Cron Job Ready)**:
```
Job scheduled successfully
```

**Error (Missing Env Var)**:
```
Error: SUPABASE_URL is not defined
```

---

## 🔒 Security Checklist

- [ ] All sensitive variables are marked as **"Secret"**
- [ ] `.env` file is in `.gitignore`
- [ ] YouTube stream key is never committed to Git
- [ ] Supabase API key is restricted to anon/public key (not admin key)
- [ ] Render service URLs are only accessed via HTTPS

---

## 💰 Pricing

| Component | Render Plan | Cost |
|-----------|-------------|------|
| Web Service | Free tier | FREE (with limitations) |
| Cron Jobs | Free tier | FREE (limited executions) |
| Supabase | Free tier | FREE (up to 500MB) |
| **Total** | | **FREE/month** |

**Note**: Render free tier has limitations:
- Web service spins down after 15 minutes of inactivity
- Limited to 0.5 CPU
- Cron jobs limited in free tier

For production, consider upgrading to:
- **Render Pro**: $12/month per service

---

## 📋 Post-Deployment Checklist

- [ ] Web service is live (status: "Live")
- [ ] Can access web UI at public URL
- [ ] API endpoints respond correctly
- [ ] Morning cron job is scheduled
- [ ] Evening cron job is scheduled
- [ ] All environment variables are set
- [ ] Database connection works
- [ ] Test schedule created successfully
- [ ] Logs are accessible

---

## 🔄 Updating Your Deployment

When you make code changes:

### Option 1: Auto-Deploy (Recommended)
1. Push to GitHub: `git push origin main`
2. Render automatically detects and redeploys
3. No downtime deployment

### Option 2: Manual Redeploy
1. Go to **Dashboard**
2. Click service
3. Click **"Manual Deploy"** or **"Redeploy"**
4. Select the branch and commit
5. Click **"Deploy"**

---

## 🎉 Next Steps

1. Schedule your first streams via the web UI
2. Monitor cron jobs as they execute
3. Check YouTube Studio for stream analytics
4. Adjust cron schedules based on your timezone
5. Scale up to Pro plan if needed

---

## 📚 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Blueprints Guide](https://render.com/docs/blueprints)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
- [Cron Jobs on Render](https://render.com/docs/background-jobs)
- [YouTube Live Streaming](https://support.google.com/youtube/answer/2853702)
- [Supabase Documentation](https://supabase.com/docs)

---

## 💬 Support

For issues:
1. Check **"Logs"** in Render Dashboard
2. Review this guide's **"Troubleshooting"** section
3. Check [Render Status Page](https://status.render.com)
4. Open issue on GitHub repository

---

**Happy Streaming! 🎥✨**
