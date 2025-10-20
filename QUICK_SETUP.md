# 🚀 Quick Setup Guide

## ✅ Pre-Setup Checklist

Before you begin, ensure you have:
- [ ] Supabase account and project created
- [ ] Oracle Cloud VM or Render account
- [ ] YouTube channel with stream key
- [ ] Google Drive with videos

## 📝 5-Minute Setup

### 1. Update Supabase Credentials in Frontend

Edit `frontend/app.js` lines 8-9:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';
```

### 2. Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Paste contents from `backend/supabase_migration.sql`
3. Click "Run"

### 3. Enable Authentication in Supabase

1. Go to Authentication → Providers
2. Enable **Email** provider
3. Save

### 4. Create Admin User

1. Go to Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter your email and password
4. Click "Create user"

### 5. Install Backend Dependencies

```bash
cd backend
npm install
```

### 6. Start the Server

```bash
cd backend
npm start
```

### 7. Access the Dashboard

Open browser: `http://localhost:3000`

Login with your admin credentials.

## 🎯 First Schedule

1. Click "➕ Schedule New Stream"
2. Fill in:
   - Date: Today or future date
   - Time Slot: Morning or Evening
   - Title: "My First Yoga Stream"
   - Video URL: Your Google Drive link
   - Privacy: Public
3. Click "Create Schedule"

## 🔐 Important: Replace Credentials

**CRITICAL**: Before deploying, replace these placeholders in `frontend/app.js`:

```javascript
// Lines 8-9
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Find your credentials in:
- Supabase Dashboard → Settings → API
- Copy the URL and anon/public key

## 📁 File Changes Summary

### New Files Created
- `frontend/index-new.html` - Enhanced dashboard
- `frontend/styles-new.css` - Modern styling
- `frontend/app.js` - Complete functionality
- `IMPLEMENTATION_GUIDE.md` - Detailed guide
- `QUICK_SETUP.md` - This file

### Modified Files
- `backend/index.js` - Enhanced with auth & new endpoints
- `backend/supabase_migration.sql` - Enhanced schema
- `backend/package.json` - Added googleapis

### Unchanged Files (Keep for reference)
- `frontend/index.html` - Old version
- `frontend/styles.css` - Old version
- `frontend/script.js` - Old version

## 🎨 Features You Now Have

✅ **Authentication** - Secure admin login
✅ **Dashboard** - Beautiful stats overview
✅ **Single Scheduling** - Create one stream at a time
✅ **Bulk Scheduling** - Schedule entire week
✅ **Calendar View** - Visual week view
✅ **Edit/Cancel** - Manage schedules
✅ **Status Tracking** - Scheduled, Streaming, Streamed, Cancelled
✅ **Privacy Settings** - Public, Unlisted, Private
✅ **Responsive Design** - Works on all devices

## 🚨 Troubleshooting

### "Cannot read properties of undefined"
**Fix**: Update Supabase credentials in `frontend/app.js`

### "Login failed"
**Fix**: 
1. Check Supabase credentials are correct
2. Ensure Email provider is enabled
3. Verify user exists in Authentication

### "Failed to create schedule"
**Fix**:
1. Check you're logged in
2. Verify database migration ran
3. Check backend is running

### "Calendar not showing"
**Fix**: Check browser console for errors, ensure `app.js` is loaded

## 📱 Mobile Access

The dashboard is fully responsive! Access from:
- Desktop computer
- Tablet
- Mobile phone

## 🚀 Next Steps

1. **Test locally** - Create a few schedules
2. **Update stream.js** - Use new fields (title, description, privacy)
3. **Deploy to Render** - Follow RENDER_DEPLOYMENT.md
4. **Set up YouTube API** - Optional but recommended

## 🎉 You're Ready!

Your enhanced YouTube Live Streamer is now ready with:
- Modern, interactive UI
- Secure authentication
- Full schedule management
- Week planning capability
- Status tracking

Happy streaming! 🎥✨
