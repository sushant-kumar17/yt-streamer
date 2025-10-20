# 🚀 Deploy to Render - Complete Guide

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:
- [x] Fixed render.yaml configuration
- [x] Updated frontend files (index.html, styles.css, app.js)
- [x] Supabase project created
- [x] Database migration ready
- [ ] GitHub repository ready
- [ ] Render account created

## 🔧 Step 1: Prepare Your Code

### 1.1 Update Supabase Credentials in app.js

**CRITICAL**: Edit `frontend/app.js` lines 8-9:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
```

Find these in: Supabase Dashboard → Settings → API

### 1.2 Verify Git Status

```bash
git status
```

Make sure all files are tracked.

### 1.3 Commit All Changes

```bash
git add .
git commit -m "Deploy enhanced YouTube streamer to Render"
git push origin main
```

## 📝 Step 2: Run Supabase Migration

**Do this BEFORE deploying to Render!**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `backend/supabase_migration.sql`
5. Paste into the SQL Editor
6. Click **"Run"**
7. You should see: "Migration completed successfully!"

## 🔐 Step 3: Enable Supabase Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Click **Save**
4. Go to **Authentication** → **Users**
5. Click **"Add User"** → **"Create new user"**
6. Enter your admin email and password
7. Click **"Create user"**

**IMPORTANT**: Save this password - you'll use it to login!

## 🌐 Step 4: Deploy to Render

### 4.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your GitHub

### 4.2 Create New Web Service

**Option A: Using render.yaml (Blueprint)**

1. Click **"New +"** → **"Blueprint"**
2. Select your GitHub repository: `yt-streamer`
3. Render will detect `render.yaml`
4. Click **"Apply"**

**Option B: Manual Setup**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `yt-streamer`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Plan**: `Free`

### 4.3 Configure Environment Variables

In the Render dashboard, add these environment variables:

| Key | Value | Where to find |
|-----|-------|---------------|
| `NODE_ENV` | `production` | Static value |
| `PORT` | `10000` | Static value (Render requirement) |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API (anon/public key) |
| `YT_KEY` | `your-youtube-stream-key` | YouTube Studio → Go Live → Stream Key |
| `YT_API_KEY` | `your-google-api-key` | Optional - Google Cloud Console |

**How to add:**
1. In your web service, click **"Environment"** (left sidebar)
2. Click **"Add Environment Variable"**
3. Enter Key and Value
4. Click **"Save Changes"**

Render will auto-deploy after saving environment variables.

## ⏱️ Step 5: Wait for Deployment

1. Watch the **"Logs"** tab
2. Wait for: `🚀 Server is running and listening on http://localhost:10000`
3. Status will change to **"Live"**
4. This takes 2-5 minutes

## 🌍 Step 6: Get Your Live URL

1. In the web service dashboard, find **"Service URL"**
2. It will look like: `https://yt-streamer-xxxx.onrender.com`
3. Click to open your dashboard!

## 🔓 Step 7: Login to Your Dashboard

1. Open your Render URL
2. You'll see the login screen
3. Enter your Supabase admin email and password
4. Click **"Sign In"**
5. You're in! 🎉

## 🧪 Step 8: Test Your Deployment

### 8.1 Test Authentication
- [x] Login works
- [x] Logout works
- [x] Session persists on refresh

### 8.2 Test Scheduling
1. Click **"➕ Schedule New Stream"**
2. Fill in:
   - Date: Tomorrow
   - Slot: Morning
   - Title: "Test Stream"
   - Video URL: Your Google Drive link
   - Privacy: Public
3. Click **"Create Schedule"**
4. Should appear in calendar and list

### 8.3 Test Editing
1. Click **"Edit"** on a schedule
2. Change the title
3. Click **"Save Changes"**
4. Should update immediately

### 8.4 Test Cancelling
1. Click **"Cancel"** on a schedule
2. Confirm
3. Status should change to "Cancelled"

## 🚨 Troubleshooting

### Issue: "Cannot read properties of undefined"

**Cause**: Supabase credentials not set in app.js

**Fix**:
1. Update `frontend/app.js` lines 8-9 with your credentials
2. Commit and push:
   ```bash
   git add frontend/app.js
   git commit -m "Update Supabase credentials"
   git push origin main
   ```
3. Render will auto-redeploy

### Issue: "Login failed"

**Cause**: Environment variables not set correctly

**Fix**:
1. Go to Render Dashboard → Environment
2. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
3. Check they match Supabase Dashboard → Settings → API
4. Click "Save Changes" to redeploy

### Issue: "Service Unavailable"

**Cause**: Service is spinning down (free tier limitation)

**Fix**: 
- Just reload the page after 30 seconds
- Free tier services sleep after 15 minutes of inactivity
- Consider upgrading to paid plan ($7/month) for always-on

### Issue: "Failed to create schedule"

**Cause**: Database migration not run

**Fix**:
1. Go to Supabase SQL Editor
2. Run the migration from `backend/supabase_migration.sql`
3. Verify in Supabase Table Editor that `schedules` table exists

### Issue: Can't see environment variables

**Fix**:
1. In Render Dashboard, click your service
2. Click "Environment" in left sidebar
3. Environment variables should be listed
4. If not, add them manually

## 📊 Post-Deployment

### Monitor Your Service

1. **Logs**: Render Dashboard → Logs (real-time)
2. **Metrics**: Render Dashboard → Metrics (CPU, Memory)
3. **Events**: Render Dashboard → Events (deploys, restarts)

### Auto-Deploy on Git Push

Render automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
# Render auto-deploys!
```

### Custom Domain (Optional)

1. Render Dashboard → Settings → Custom Domains
2. Click "Add Custom Domain"
3. Enter your domain
4. Follow DNS setup instructions

## ⚠️ Important: Cron Jobs Limitation

**Render Free Tier does NOT support cron jobs.**

Your `render.yaml` has cron jobs commented out. To enable automated streaming:

### Option 1: Upgrade to Render Starter Plan ($7/month)
- Uncomment cron jobs in render.yaml
- Push to GitHub
- Cron jobs will deploy automatically

### Option 2: Use External Cron Service (Free)
Use services like:
- **cron-job.org** - Free external cron
- **EasyCron** - Free tier available
- **GitHub Actions** - Free for public repos

Configure them to call your stream endpoints:
```bash
curl -X POST https://your-render-url.onrender.com/stream-morning
curl -X POST https://your-render-url.onrender.com/stream-evening
```

### Option 3: Use Oracle Cloud VM (Your Current Setup)
Keep Oracle Cloud VM for cron jobs, use Render only for the dashboard.

## 🎯 Success Checklist

After deployment, verify:
- [x] Dashboard loads at Render URL
- [x] Login works with Supabase credentials
- [x] Stats show correctly (0s initially)
- [x] Can create new schedule
- [x] Calendar displays schedules
- [x] Can edit schedules
- [x] Can cancel schedules
- [x] Mobile view works
- [x] No console errors

## 📱 Access Your Dashboard

**Desktop**: Open Render URL in browser
**Mobile**: Open Render URL on phone
**Tablet**: Works on all devices!

Save this URL as a bookmark for easy access.

## 🔄 Update Process

When you make changes:

1. Edit files locally
2. Test locally: `cd backend && npm start`
3. Commit: `git add . && git commit -m "Description"`
4. Push: `git push origin main`
5. Render auto-deploys (watch Logs tab)
6. Test live site

## 🎉 You're Live!

Your YouTube Live Streamer is now deployed on Render!

**Your Dashboard**: `https://yt-streamer-xxxx.onrender.com`

### What Works:
✅ Secure authentication
✅ Create/Edit/Cancel schedules
✅ Calendar view
✅ Bulk scheduling
✅ Status tracking
✅ Mobile responsive
✅ Real-time updates

### What Needs Manual Setup:
⚠️ Cron jobs (needs paid plan or external service)
⚠️ YouTube API OAuth (optional, for automatic broadcasts)

## 🚀 Next Steps

1. Schedule your first week of streams
2. Test the streaming from Oracle Cloud VM
3. Set up external cron service if needed
4. Consider upgrading to paid plan for cron jobs
5. Add custom domain (optional)

---

**Need help?** Check:
- QUICK_SETUP.md - Setup guide
- IMPLEMENTATION_GUIDE.md - Feature documentation
- Render Docs - https://render.com/docs

Happy Streaming! 🎥✨
