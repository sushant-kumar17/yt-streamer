# 🎥 YouTube Live Auto Streamer - Complete Codebase Documentation

> **AI Assistant Reference**: This document provides a comprehensive overview of the YouTube Live Auto Streamer codebase, its architecture, implementation details, and operational context.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & System Design](#architecture--system-design)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Authentication & Security](#authentication--security)
9. [Streaming Pipeline](#streaming-pipeline)
10. [Frontend Architecture](#frontend-architecture)
11. [Deployment Strategy](#deployment-strategy)
12. [Configuration Management](#configuration-management)
13. [Development Workflow](#development-workflow)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Project Overview

### Purpose
Automated daily live streaming platform that broadcasts pre-recorded 3-hour videos from Google Drive to YouTube Live at fixed times (6 AM & 5 PM), with streams starting automatically 10 minutes before each scheduled slot.

### Key Features
- **Fixed Schedule Streaming**: Two daily streams (Morning 6 AM, Evening 5 PM)
- **Auto-Start Buffer**: Streams begin 10 minutes before scheduled time
- **Google Drive Integration**: Stream directly from Drive, no manual uploads required
- **Admin Dashboard**: Modern web UI for schedule management
- **Authentication**: Secure admin-only access with Supabase Auth
- **100% Free Hosting**: Runs on Oracle Cloud Free Tier + Supabase Free Tier
- **Automated Execution**: Cron-based scheduling with FFmpeg streaming

### Use Case
Originally designed for yoga instructors or content creators who need to:
- Stream pre-recorded content to YouTube Live on a fixed schedule
- Manage streaming schedules via a web interface
- Minimize manual intervention and hosting costs
- Track stream status and history

---

## 🏗️ Architecture & System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUTUBE LIVE AUTO STREAMER                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Google Drive    │
│  Video Storage   │◄──────┐
└──────────────────┘       │
                           │
                           │ (1) Stores Videos
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                      WEB APPLICATION                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend (HTML/CSS/JS)                                 │   │
│  │  - Authentication UI                                    │   │
│  │  - Dashboard with Stats                                 │   │
│  │  - Schedule Management                                  │   │
│  │  - Calendar View                                        │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────▼───────────────────────────────────────┐   │
│  │  Backend API (Node.js + Express)                        │   │
│  │  - Authentication Middleware                            │   │
│  │  - Schedule CRUD Endpoints                              │   │
│  │  - Bulk Scheduling                                      │   │
│  │  - Static File Serving                                  │   │
│  └─────────────────┬───────────────────────────────────────┘   │
└────────────────────┼───────────────────────────────────────────┘
                     │
                     │ (2) Reads/Writes Schedules
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                    Supabase Database                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  schedules Table                                         │  │
│  │  - Schedule metadata (date, slot, video_url)            │  │
│  │  - Stream details (title, description, privacy)         │  │
│  │  - YouTube integration fields                           │  │
│  │  - Status tracking & timestamps                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  auth.users (Supabase Auth)                             │  │
│  │  - Admin user credentials                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                     │
                     │ (3) Cron Jobs Query
                     │
┌────────────────────▼───────────────────────────────────────────┐
│              Oracle Cloud VM (Ubuntu)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cron Jobs                                               │  │
│  │  - Morning: 5:50 AM → node stream.js morning            │  │
│  │  - Evening: 4:50 PM → node stream.js evening            │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                            │
│  ┌─────────────────▼────────────────────────────────────────┐  │
│  │  stream.js (Streaming Script)                           │  │
│  │  1. Query Supabase for today's video                    │  │
│  │  2. Construct FFmpeg command                            │  │
│  │  3. Execute FFmpeg with video URL                       │  │
│  │  4. Log output to logs/[slot].log                       │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                            │
│  ┌─────────────────▼────────────────────────────────────────┐  │
│  │  FFmpeg Process                                          │  │
│  │  - Download from Google Drive                           │  │
│  │  - Encode video (H.264) & audio (AAC)                   │  │
│  │  - Stream via RTMP to YouTube                           │  │
│  └─────────────────┬────────────────────────────────────────┘  │
└────────────────────┼───────────────────────────────────────────┘
                     │
                     │ (4) RTMP Stream
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                      YouTube Live                               │
│  rtmp://a.rtmp.youtube.com/live2/[STREAM_KEY]                  │
│  - Receives RTMP stream                                         │
│  - Broadcasts to viewers                                        │
│  - Manages live chat & analytics                                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Schedule Creation Flow**:
   ```
   Admin → Login UI → Backend API (Auth) → Supabase DB → Success Response
   ```

2. **Streaming Execution Flow**:
   ```
   Cron Trigger → stream.js → Query Supabase → FFmpeg → YouTube RTMP → Live Broadcast
   ```

3. **Status Tracking Flow**:
   ```
   stream.js → Update DB Status → Frontend Polls → Display in Dashboard
   ```

### Component Interaction Matrix

| Component | Interacts With | Purpose |
|-----------|----------------|---------|
| Frontend | Backend API | Schedule CRUD, Authentication |
| Frontend | Supabase Client | Direct auth (login/logout) |
| Backend API | Supabase DB | Data persistence |
| Backend API | Frontend | Serve static files, API responses |
| stream.js | Supabase DB | Query schedules |
| stream.js | FFmpeg | Execute streaming |
| stream.js | Google Drive | Download video files |
| FFmpeg | YouTube RTMP | Stream video content |

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime |
| **Express** | 5.1.0 | Web framework |
| **Supabase JS** | 2.75.1 | Database client & auth |
| **dotenv** | 17.2.3 | Environment variable management |
| **googleapis** | 144.0.0 | YouTube API integration (optional) |
| **cors** | 2.8.5 | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling with gradients, animations |
| **Vanilla JavaScript** | Client-side logic |
| **Supabase Client** | Authentication via CDN |

### Infrastructure
| Component | Technology | Tier |
|-----------|------------|------|
| **Database** | Supabase (PostgreSQL) | Free |
| **Hosting** | Oracle Cloud VM (Ubuntu) | Always Free |
| **Process Manager** | PM2 | - |
| **Scheduler** | Cron | - |
| **Streaming** | FFmpeg | Open Source |
| **Storage** | Google Drive | Free (15GB) |
| **CDN** | YouTube Live | Free |

### Development Tools
- **Git** - Version control
- **SSH** - Remote server access
- **npm** - Package management

---

## 📁 Project Structure

```
yt-streamer/
│
├── backend/                          # Backend application
│   ├── index.js                      # Main Express server (281 lines)
│   │   ├── Express app setup
│   │   ├── YouTube API integration
│   │   ├── Authentication middleware
│   │   ├── API endpoints (CRUD)
│   │   ├── Bulk scheduling endpoint
│   │   └── Static file serving
│   │
│   ├── stream.js                     # FFmpeg streaming logic (81 lines)
│   │   ├── Supabase query for scheduled video
│   │   ├── FFmpeg command construction
│   │   ├── Process execution & logging
│   │   └── Error handling
│   │
│   ├── supabaseClient.js             # Supabase client (15 lines)
│   │   ├── Client initialization
│   │   └── Export for reuse
│   │
│   ├── supabase_migration.sql        # Database schema (66 lines)
│   │   ├── Table creation
│   │   ├── Indexes
│   │   ├── Triggers
│   │   └── Functions
│   │
│   ├── package.json                  # Dependencies
│   └── .env                          # Environment variables (gitignored)
│
├── frontend/                         # Frontend application
│   ├── index.html                    # Original UI
│   ├── index-new.html                # Enhanced admin dashboard (267 lines)
│   │   ├── Login screen
│   │   ├── Stats grid
│   │   ├── Action buttons
│   │   ├── Calendar view
│   │   ├── Schedule list
│   │   ├── Schedule modal
│   │   └── Bulk schedule modal
│   │
│   ├── styles.css                    # Original styles
│   ├── styles-new.css                # Enhanced styles (728 lines)
│   │   ├── CSS variables
│   │   ├── Gradient backgrounds
│   │   ├── Responsive grid
│   │   ├── Modal styles
│   │   ├── Status badges
│   │   └── Animations
│   │
│   ├── script.js                     # Original logic
│   └── app.js                        # Enhanced frontend logic (597 lines)
│       ├── Supabase client init
│       ├── Authentication handlers
│       ├── Schedule CRUD functions
│       ├── Calendar rendering
│       ├── Bulk scheduling
│       └── UI state management
│
├── logs/                             # Stream logs (auto-created)
│   ├── morning.log                   # Morning stream logs
│   └── evening.log                   # Evening stream logs
│
├── .git/                             # Git repository
├── .gitignore                        # Git ignore rules
├── .env.example                      # Environment template
│
├── ytstreamer.cron                   # Cron job configuration (22 lines)
│   ├── Morning job: 5:50 AM
│   └── Evening job: 4:50 PM
│
├── setup.sh                          # Automated setup script (4296 bytes)
│   ├── Install FFmpeg, Node.js
│   ├── Install dependencies
│   ├── Configure environment
│   ├── Setup PM2
│   └── Install cron jobs
│
├── test-setup.sh                     # System verification (5187 bytes)
│   ├── Check dependencies
│   ├── Validate file structure
│   ├── Test syntax
│   └── Verify services
│
├── render.yaml                       # Render deployment config (1447 bytes)
│
├── README.md                         # User documentation (8985 bytes)
├── PROJECT_SUMMARY.md                # Implementation summary (8606 bytes)
├── QUICKSTART.md                     # Quick setup guide (3565 bytes)
├── QUICK_SETUP.md                    # 5-minute setup (3912 bytes)
├── IMPLEMENTATION_GUIDE.md           # Feature documentation (7682 bytes)
├── ENHANCEMENTS_SUMMARY.md           # Enhancement overview (11225 bytes)
├── RENDER_DEPLOYMENT.md              # Render guide (10608 bytes)
├── DEPLOY_TO_RENDER.md               # Deployment steps (8850 bytes)
├── DEPLOYMENT_READY.md               # Deployment checklist (6716 bytes)
└── CLAUDE.md                         # This file
```

### File Purpose Summary

| File | Lines | Purpose |
|------|-------|---------|
| `backend/index.js` | 281 | Main API server with auth & endpoints |
| `backend/stream.js` | 81 | FFmpeg streaming execution |
| `backend/supabaseClient.js` | 15 | Database client setup |
| `backend/supabase_migration.sql` | 66 | Database schema |
| `frontend/app.js` | 597 | Client-side application logic |
| `frontend/index-new.html` | 267 | Admin dashboard UI |
| `frontend/styles-new.css` | 728 | Modern responsive styles |

**Total Code**: ~2,035 lines across core files

---

## 🧩 Core Components

### 1. Backend API Server (`backend/index.js`)

#### Key Responsibilities
- Serve frontend static files
- Handle authentication via JWT tokens
- Provide RESTful API for schedule management
- Integrate with YouTube API (structure ready)

#### Code Structure
```javascript
// Import dependencies
import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';
import { google } from 'googleapis';

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Authentication middleware
const verifyAuth = async (req, res, next) => {
  // Extract JWT from Authorization header
  // Verify with Supabase
  // Attach user to request
  // Continue or return 401
};

// API Endpoints
app.get('/schedules', ...);         // Public: Read schedules
app.post('/schedule', verifyAuth, ...);   // Protected: Create
app.put('/schedule/:id', verifyAuth, ...); // Protected: Update
app.delete('/schedule/:id', verifyAuth, ...); // Protected: Cancel
app.post('/schedule/bulk', verifyAuth, ...); // Protected: Bulk create

// Static files
app.use(express.static('../frontend'));

// Start server
app.listen(PORT);
```

#### Key Features
- **Authentication Middleware**: Validates JWT tokens from Supabase Auth
- **Error Handling**: Comprehensive try-catch with descriptive errors
- **CORS Enabled**: Allows cross-origin requests
- **Static Serving**: Serves frontend from same origin

#### API Response Format
```javascript
// Success
{
  "message": "Schedule created successfully!",
  "data": { /* schedule object */ }
}

// Error
{
  "error": "Detailed error message"
}
```

---

### 2. Streaming Script (`backend/stream.js`)

#### Purpose
Executed by cron jobs to stream scheduled videos to YouTube Live.

#### Workflow
1. **Parse Arguments**: Get slot (morning/evening) from CLI args
2. **Query Database**: Fetch scheduled video for today + slot
3. **Validate**: Check if video exists and YT_KEY is set
4. **Construct Command**: Build FFmpeg command with encoding params
5. **Execute**: Run FFmpeg as child process
6. **Log**: Stream stdout/stderr to console and log files
7. **Handle Completion**: Log exit code

#### FFmpeg Command Breakdown
```bash
ffmpeg \
  -re \                              # Read input at native frame rate
  -i "VIDEO_URL" \                   # Input from Google Drive
  -c:v libx264 \                     # Video codec: H.264
  -preset veryfast \                 # Encoding speed/quality balance
  -maxrate 3000k \                   # Max bitrate: 3 Mbps
  -bufsize 6000k \                   # Buffer size: 6 MB
  -pix_fmt yuv420p \                 # Pixel format for compatibility
  -g 50 \                            # GOP size (keyframe interval)
  -c:a aac \                         # Audio codec: AAC
  -b:a 128k \                        # Audio bitrate: 128 kbps
  -ar 44100 \                        # Audio sample rate: 44.1 kHz
  -f flv \                           # Output format: FLV
  "rtmp://a.rtmp.youtube.com/live2/STREAM_KEY" # YouTube RTMP endpoint
```

#### Error Scenarios
- **No scheduled video**: Exit gracefully (code 0)
- **Missing YT_KEY**: Exit with error (code 1)
- **FFmpeg failure**: Log error and exit code
- **Network issues**: FFmpeg handles reconnection internally

#### Logging Strategy
```
[YYYY-MM-DD HH:MM:SS] [slot] Message
```
- stdout → Progress, stats
- stderr → Detailed info, errors
- Exit code → Final status

---

### 3. Database Client (`backend/supabaseClient.js`)

#### Implementation
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

#### Usage Pattern
```javascript
// In other files
import { supabase } from './supabaseClient.js';

// Query
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('date', '2025-10-21')
  .single();

// Insert
const { data, error } = await supabase
  .from('schedules')
  .insert([{ date, slot, video_url }])
  .select();

// Update
const { data, error } = await supabase
  .from('schedules')
  .update({ status: 'streaming' })
  .eq('id', 123);
```

---

### 4. Frontend Application (`frontend/app.js`)

#### Architecture Pattern
Single-page application with:
- **Global State**: User session, schedules array, week offset
- **Authentication**: Supabase Auth SDK
- **API Communication**: Fetch API with JWT tokens
- **UI Rendering**: Vanilla JS DOM manipulation

#### Key Functions

##### Authentication
```javascript
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  showLogin();
}
```

##### Schedule Management
```javascript
async function loadSchedules() {
  const response = await fetch(`${API_BASE_URL}/schedules`);
  const result = await response.json();
  allSchedules = result.data;
  updateStats();
  renderSchedulesList();
  renderCalendar();
}

async function createSchedule(scheduleData) {
  const response = await fetch(`${API_BASE_URL}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(scheduleData)
  });
  return response.json();
}
```

##### Calendar Rendering
```javascript
function renderCalendar() {
  // Calculate week dates based on currentWeekOffset
  // For each day:
  //   - Create day card
  //   - Check for morning schedule
  //   - Check for evening schedule
  //   - Display status badges
  // Render to DOM
}
```

#### State Management
```javascript
let currentUser = null;        // User object from Supabase
let authToken = null;          // JWT token for API calls
let allSchedules = [];         // All schedules from DB
let currentWeekOffset = 0;     // Week navigation (-1, 0, 1, ...)
```

---

## 🗄️ Database Schema

### Table: `schedules`

#### Schema Definition
```sql
CREATE TABLE IF NOT EXISTS schedules (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,
  
  -- Core Schedule Fields
  date DATE NOT NULL,
  slot VARCHAR(10) NOT NULL CHECK (slot IN ('morning', 'evening')),
  video_url TEXT NOT NULL,
  
  -- YouTube Details
  title VARCHAR(100) NOT NULL DEFAULT 'Live Yoga Session',
  description TEXT,
  privacy VARCHAR(20) DEFAULT 'public' 
    CHECK (privacy IN ('public', 'unlisted', 'private')),
  youtube_broadcast_id VARCHAR(100),
  youtube_stream_url TEXT,
  youtube_watch_url TEXT,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'streaming', 'streamed', 'cancelled', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin Tracking
  created_by VARCHAR(100),
  
  -- Constraints
  UNIQUE(date, slot)
);
```

#### Indexes
```sql
-- Fast lookup by date and slot (main query pattern)
CREATE INDEX idx_schedules_date_slot ON schedules(date, slot);

-- Filter by status
CREATE INDEX idx_schedules_status ON schedules(status);
```

#### Triggers
```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### Field Details

| Field | Type | Required | Default | Purpose |
|-------|------|----------|---------|---------|
| `id` | BIGSERIAL | Auto | - | Primary key |
| `date` | DATE | Yes | - | Stream date (YYYY-MM-DD) |
| `slot` | VARCHAR(10) | Yes | - | Time slot (morning/evening) |
| `video_url` | TEXT | Yes | - | Google Drive download URL |
| `title` | VARCHAR(100) | Yes | 'Live Yoga Session' | Stream title for YouTube |
| `description` | TEXT | No | NULL | Full description |
| `privacy` | VARCHAR(20) | No | 'public' | YouTube privacy setting |
| `youtube_broadcast_id` | VARCHAR(100) | No | NULL | YouTube broadcast ID |
| `youtube_stream_url` | TEXT | No | NULL | RTMP stream URL |
| `youtube_watch_url` | TEXT | No | NULL | Public watch URL |
| `status` | VARCHAR(20) | No | 'scheduled' | Current status |
| `created_at` | TIMESTAMP | Auto | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto | NOW() | Last update timestamp |
| `started_at` | TIMESTAMP | No | NULL | Stream start time |
| `completed_at` | TIMESTAMP | No | NULL | Stream end time |
| `created_by` | VARCHAR(100) | No | NULL | Admin email |

#### Status Lifecycle
```
scheduled → streaming → streamed
    ↓           ↓
cancelled   failed
```

#### Example Row
```json
{
  "id": 42,
  "date": "2025-10-21",
  "slot": "morning",
  "video_url": "https://drive.google.com/uc?export=download&id=ABC123",
  "title": "Morning Yoga - Sunrise Flow",
  "description": "Join us for a peaceful morning yoga session...",
  "privacy": "public",
  "youtube_broadcast_id": "yt_abc123",
  "youtube_stream_url": "rtmp://a.rtmp.youtube.com/live2/...",
  "youtube_watch_url": "https://youtube.com/watch?v=...",
  "status": "scheduled",
  "created_at": "2025-10-20T10:30:00Z",
  "updated_at": "2025-10-20T10:30:00Z",
  "started_at": null,
  "completed_at": null,
  "created_by": "admin@example.com"
}
```

---

## 🔌 API Documentation

### Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-render-app.onrender.com`

### Authentication
Protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Endpoints

#### 1. GET `/schedules`
**Description**: Retrieve all schedules with optional date filtering

**Access**: Public (read-only)

**Query Parameters**:
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)

**Request**:
```http
GET /schedules?from_date=2025-10-20&to_date=2025-10-27
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-10-21",
      "slot": "morning",
      "video_url": "https://drive.google.com/uc?export=download&id=ABC",
      "title": "Morning Yoga Session",
      "description": "Relaxing yoga...",
      "privacy": "public",
      "status": "scheduled",
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-20T10:00:00Z",
      "created_by": "admin@example.com"
    }
  ]
}
```

**Error** (500):
```json
{
  "error": "Database connection failed"
}
```

---

#### 2. POST `/schedule`
**Description**: Create a new schedule

**Access**: Protected (requires authentication)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "date": "2025-10-21",
  "slot": "morning",
  "video_url": "https://drive.google.com/uc?export=download&id=ABC123",
  "title": "Morning Yoga - Sunrise Flow",
  "description": "Join us for a peaceful morning session...",
  "privacy": "public"
}
```

**Required Fields**:
- `date` (DATE)
- `slot` ('morning' | 'evening')
- `video_url` (TEXT)
- `title` (VARCHAR(100))

**Optional Fields**:
- `description` (TEXT)
- `privacy` ('public' | 'unlisted' | 'private')

**Response** (201 Created):
```json
{
  "message": "Schedule created successfully!",
  "data": {
    "id": 42,
    "date": "2025-10-21",
    "slot": "morning",
    "video_url": "https://drive.google.com/...",
    "title": "Morning Yoga - Sunrise Flow",
    "description": "Join us for a peaceful morning session...",
    "privacy": "public",
    "status": "scheduled",
    "created_at": "2025-10-20T10:30:00Z",
    "created_by": "admin@example.com"
  }
}
```

**Errors**:
- **400 Bad Request**: Missing required fields or invalid slot
- **401 Unauthorized**: Missing or invalid token
- **409 Conflict**: Schedule already exists for this date/slot
- **500 Internal Server Error**: Database error

---

#### 3. PUT `/schedule/:id`
**Description**: Update an existing schedule

**Access**: Protected

**URL Parameters**:
- `id`: Schedule ID (integer)

**Request Body** (all fields optional):
```json
{
  "video_url": "https://drive.google.com/uc?export=download&id=NEW_ID",
  "title": "Updated Title",
  "description": "Updated description",
  "privacy": "unlisted",
  "status": "cancelled"
}
```

**Response** (200 OK):
```json
{
  "message": "Schedule updated successfully",
  "data": {
    "id": 42,
    "date": "2025-10-21",
    "slot": "morning",
    "video_url": "https://drive.google.com/...",
    "title": "Updated Title",
    "status": "scheduled",
    "updated_at": "2025-10-20T15:45:00Z"
  }
}
```

**Errors**:
- **401 Unauthorized**: Invalid token
- **404 Not Found**: Schedule not found
- **500 Internal Server Error**: Database error

---

#### 4. DELETE `/schedule/:id`
**Description**: Cancel a schedule (soft delete)

**Access**: Protected

**URL Parameters**:
- `id`: Schedule ID (integer)

**Response** (200 OK):
```json
{
  "message": "Schedule cancelled successfully",
  "data": {
    "id": 42,
    "status": "cancelled",
    "updated_at": "2025-10-20T16:00:00Z"
  }
}
```

**Note**: This is a soft delete - sets `status = 'cancelled'` instead of deleting the row.

**Errors**:
- **401 Unauthorized**: Invalid token
- **404 Not Found**: Schedule not found
- **500 Internal Server Error**: Database error

---

#### 5. POST `/schedule/bulk`
**Description**: Create multiple schedules at once

**Access**: Protected

**Request Body**:
```json
{
  "schedules": [
    {
      "date": "2025-10-21",
      "slot": "morning",
      "video_url": "https://drive.google.com/...",
      "title": "Day 1 Morning"
    },
    {
      "date": "2025-10-21",
      "slot": "evening",
      "video_url": "https://drive.google.com/...",
      "title": "Day 1 Evening"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "message": "2 schedules created successfully",
  "data": [
    { /* schedule 1 */ },
    { /* schedule 2 */ }
  ]
}
```

**Use Case**: Schedule an entire week in one request.

**Errors**:
- **400 Bad Request**: Invalid schedules array
- **401 Unauthorized**: Invalid token
- **500 Internal Server Error**: Database error (may partially succeed)

---

## 🔒 Authentication & Security

### Authentication Flow

#### 1. Login Process
```
User enters credentials
    ↓
Frontend: supabaseClient.auth.signInWithPassword()
    ↓
Supabase validates credentials
    ↓
Returns session with JWT token
    ↓
Frontend stores token & user object
    ↓
Frontend redirects to dashboard
```

#### 2. API Request Flow
```
User action (e.g., create schedule)
    ↓
Frontend includes token in Authorization header
    ↓
Backend: verifyAuth middleware
    ↓
Extract token from header
    ↓
Call supabase.auth.getUser(token)
    ↓
If valid: attach user to req.user, proceed
If invalid: return 401 Unauthorized
    ↓
Execute API endpoint logic
```

#### 3. Session Management
```
On page load:
    ↓
checkAuth() → Get session from Supabase
    ↓
If session exists: Show dashboard
If no session: Show login screen
```

### Security Measures

#### 1. JWT Token Validation
```javascript
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check header exists and format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Validate with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};
```

#### 2. CORS Configuration
```javascript
app.use(cors()); // Allows all origins (development)

// Production recommendation:
app.use(cors({
  origin: ['https://your-frontend.com'],
  credentials: true
}));
```

#### 3. Environment Variable Protection
```bash
# .env file (never committed)
SUPABASE_URL=https://project.supabase.co
SUPABASE_KEY=anon-key-here
YT_KEY=youtube-stream-key
PORT=3000
```

#### 4. Input Validation
```javascript
// Example: Validate slot
if (slot !== 'morning' && slot !== 'evening') {
  return res.status(400).json({ error: 'Invalid slot' });
}

// Example: Validate required fields
if (!date || !slot || !video_url || !title) {
  return res.status(400).json({ error: 'Missing required fields' });
}
```

#### 5. SQL Injection Protection
Supabase client uses parameterized queries internally, preventing SQL injection.

### Best Practices

1. **Never commit `.env` file** - Use `.gitignore`
2. **Use anon key on frontend** - Not service key
3. **Enable Row Level Security (RLS)** in Supabase for production
4. **Rotate credentials regularly**
5. **Use HTTPS in production**
6. **Implement rate limiting** for API endpoints
7. **Log security events** (failed logins, etc.)

### Potential Enhancements

- [ ] Role-based access control (admin vs viewer)
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Request logging & monitoring
- [ ] Webhook signature verification
- [ ] CSRF protection

---

## 🎬 Streaming Pipeline

### Overview
The streaming pipeline executes twice daily via cron jobs, querying the database for scheduled videos and streaming them to YouTube Live using FFmpeg.

### Execution Timeline

```
Morning Stream:
5:50 AM → Cron triggers
5:50 AM → stream.js queries database
5:50 AM → FFmpeg starts downloading & streaming
6:00 AM → Video goes live on YouTube (10-minute buffer)
~9:00 AM → Stream completes (3-hour video)

Evening Stream:
4:50 PM → Cron triggers
4:50 PM → stream.js queries database
4:50 PM → FFmpeg starts downloading & streaming
5:00 PM → Video goes live on YouTube (10-minute buffer)
~8:00 PM → Stream completes (3-hour video)
```

### Cron Configuration (`ytstreamer.cron`)

```cron
# Morning stream - 5:50 AM daily
50 5 * * * ubuntu /usr/bin/node /home/ubuntu/yt-streamer/backend/stream.js morning >> /home/ubuntu/yt-streamer/logs/morning.log 2>&1

# Evening stream - 4:50 PM daily
50 16 * * * ubuntu /usr/bin/node /home/ubuntu/yt-streamer/backend/stream.js evening >> /home/ubuntu/yt-streamer/logs/evening.log 2>&1
```

**Breakdown**:
- `50 5 * * *` - Minute 50, Hour 5, Every day
- `ubuntu` - Run as ubuntu user
- `/usr/bin/node` - Full path to Node.js
- `/home/ubuntu/yt-streamer/backend/stream.js morning` - Script with argument
- `>> logs/morning.log 2>&1` - Redirect stdout and stderr to log file

### Stream.js Execution Flow

```
┌─────────────────────────────────────────────┐
│ 1. Parse CLI Arguments                      │
│    - Get slot from process.argv[2]          │
│    - Validate slot exists                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 2. Get Today's Date                         │
│    - Format: YYYY-MM-DD                     │
│    - Used for database query                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 3. Query Supabase                           │
│    SELECT video_url FROM schedules          │
│    WHERE date = today AND slot = slot       │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐        ┌─────▼─────┐
    │ Error   │        │ Success   │
    │ No data │        │ Has video │
    └────┬────┘        └─────┬─────┘
         │                   │
         │              ┌────▼────────────────────────┐
         │              │ 4. Validate YT_KEY          │
         │              │    - Check env variable     │
         │              └────┬────────────────────────┘
         │                   │
         │              ┌────▼────────────────────────┐
         │              │ 5. Construct FFmpeg Command │
         │              │    - Input: video_url       │
         │              │    - Output: YouTube RTMP   │
         │              │    - Encoding params        │
         │              └────┬────────────────────────┘
         │                   │
         │              ┌────▼────────────────────────┐
         │              │ 6. Execute FFmpeg           │
         │              │    - Spawn child process    │
         │              │    - Attach stdout/stderr   │
         │              └────┬────────────────────────┘
         │                   │
         │              ┌────▼────────────────────────┐
         │              │ 7. Log Output               │
         │              │    - Progress updates       │
         │              │    - Errors                 │
         │              └────┬────────────────────────┘
         │                   │
         │              ┌────▼────────────────────────┐
         │              │ 8. Handle Completion        │
         │              │    - Log exit code          │
         │              │    - Process exits          │
         │              └─────────────────────────────┘
         │
    ┌────▼────────────┐
    │ Exit Gracefully │
    │ (Code 0)        │
    └─────────────────┘
```

### FFmpeg Encoding Parameters Explained

```bash
ffmpeg \
  -re \                # Read input at native frame rate (prevents speed issues)
  -i "VIDEO_URL" \     # Input file (Google Drive URL)
  
  # Video Encoding
  -c:v libx264 \       # Use H.264 codec (widely compatible)
  -preset veryfast \   # Encoding speed (faster = less CPU, lower quality)
  -maxrate 3000k \     # Maximum bitrate: 3 Mbps (YouTube recommends 3-6 Mbps for 1080p)
  -bufsize 6000k \     # Rate control buffer (2x maxrate recommended)
  -pix_fmt yuv420p \   # Pixel format (most compatible)
  -g 50 \              # GOP size: Keyframe every 50 frames (~2 seconds at 25fps)
  
  # Audio Encoding
  -c:a aac \           # Use AAC codec (standard for streaming)
  -b:a 128k \          # Audio bitrate: 128 kbps (good quality)
  -ar 44100 \          # Sample rate: 44.1 kHz (CD quality)
  
  # Output
  -f flv \             # Format: Flash Video (required for RTMP)
  "rtmp://a.rtmp.youtube.com/live2/STREAM_KEY"  # YouTube RTMP endpoint
```

### YouTube RTMP Endpoints

| Region | RTMP URL |
|--------|----------|
| Primary | `rtmp://a.rtmp.youtube.com/live2/` |
| Backup | `rtmp://b.rtmp.youtube.com/live2/` |

### Google Drive Video URL Format

**Required Format**:
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

**How to Get**:
1. Upload video to Google Drive
2. Right-click → Get link
3. Change sharing to "Anyone with the link"
4. Extract FILE_ID from:
   ```
   https://drive.google.com/file/d/FILE_ID_HERE/view
   ```
5. Format as direct download URL

### Error Handling

#### Scenario 1: No Scheduled Video
```
[morning] No video scheduled for 2025-10-21. Exiting gracefully.
Exit code: 0
```

#### Scenario 2: Missing YT_KEY
```
Error: YT_KEY is not set in the .env file.
Exit code: 1
```

#### Scenario 3: FFmpeg Error
```
[FFMPEG STDERR]: [http @ 0x...] HTTP error 403 Forbidden
[morning] FFmpeg process exited with code 1. Stream finished.
Exit code: 0 (script exits gracefully)
```

#### Scenario 4: Network Interruption
FFmpeg has built-in retry logic for network issues. If persistent:
```
[FFMPEG STDERR]: av_interleaved_write_frame(): Connection reset by peer
```

### Logging Strategy

#### Log Files
- `logs/morning.log` - Morning stream logs
- `logs/evening.log` - Evening stream logs

#### Log Rotation
Optional cron job (commented out in `ytstreamer.cron`):
```cron
# Clean up logs older than 30 days every Sunday at midnight
0 0 * * 0 ubuntu find /home/ubuntu/yt-streamer/logs -name "*.log" -mtime +30 -delete
```

#### Log Format
```
[2025-10-21T05:50:00] [morning] Searching for a video scheduled for 2025-10-21...
[2025-10-21T05:50:01] [morning] Found video! Starting stream for URL: https://...
[FFMPEG STDERR]: frame=  450 fps= 25 q=28.0 size=   12345kB time=00:00:18.00 bitrate=5616.0kbits/s speed=1.00x
...
[2025-10-21T08:50:23] [morning] FFmpeg process exited with code 0. Stream finished.
```

### Performance Considerations

#### Network Bandwidth
- **Upload**: 3-6 Mbps required for 1080p streaming
- **Download**: Depends on Google Drive video file size
- **Total**: ~10 Mbps recommended

#### CPU Usage
- FFmpeg with `-preset veryfast`: ~30-50% CPU (1 core)
- Oracle Free Tier: 1 OCPU (sufficient)

#### Memory Usage
- FFmpeg: ~200-500 MB
- Node.js: ~50-100 MB
- Total: <1 GB (Oracle Free Tier: 1 GB RAM)

#### Disk Space
- Temporary FFmpeg buffers: Minimal (<100 MB)
- Log files: Grows over time (rotate recommended)

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
<body>
├── Login Screen (#loginScreen)
│   ├── Auth Container
│   │   ├── Header
│   │   ├── Login Form
│   │   └── Message Display
│   └── Background Gradient
│
└── Main Dashboard (#mainDashboard)
    ├── Navigation Bar
    │   ├── Brand Logo
    │   ├── User Email
    │   └── Logout Button
    │
    ├── Stats Grid
    │   ├── Scheduled Count Card
    │   ├── Streaming Count Card
    │   ├── Completed Count Card
    │   └── Total Count Card
    │
    ├── Action Bar
    │   ├── Schedule New Button
    │   ├── Schedule Week Button
    │   └── Refresh Button
    │
    ├── Calendar Section (Card)
    │   ├── Card Header
    │   │   ├── Title
    │   │   └── Week Navigation
    │   └── Calendar Grid (7 days)
    │       ├── Day Card
    │       │   ├── Date Header
    │       │   ├── Morning Slot
    │       │   └── Evening Slot
    │       └── ... (repeat for 7 days)
    │
    ├── Schedule List Section (Card)
    │   ├── Card Header
    │   │   ├── Title
    │   │   └── Status Filter
    │   └── Schedules List
    │       ├── Schedule Item
    │       │   ├── Info (title, date, time)
    │       │   ├── Meta (privacy, created_by)
    │       │   ├── Status Badge
    │       │   └── Actions (Edit, Cancel)
    │       └── ... (repeat per schedule)
    │
    ├── Schedule Modal (#scheduleModal)
    │   ├── Modal Header
    │   ├── Schedule Form
    │   │   ├── Date Input
    │   │   ├── Slot Select
    │   │   ├── Title Input
    │   │   ├── Description Textarea
    │   │   ├── Video URL Input
    │   │   └── Privacy Select
    │   ├── Modal Footer (Cancel, Submit)
    │   └── Message Display
    │
    └── Bulk Schedule Modal (#bulkScheduleModal)
        ├── Modal Header
        ├── Bulk Form
        │   ├── Week Slots (14 inputs)
        │   └── Instructions
        └── Modal Footer
```

### State Management

#### Global Variables
```javascript
// User session
let currentUser = null;        // { id, email, ... }
let authToken = null;          // JWT token string

// Data
let allSchedules = [];         // Array of schedule objects

// UI state
let currentWeekOffset = 0;     // Week navigation (-1, 0, 1, ...)
```

#### State Update Flow
```
User Action
    ↓
Event Handler (e.g., loadSchedules)
    ↓
API Call
    ↓
Update Global State (allSchedules = ...)
    ↓
Trigger UI Updates:
    - updateStats()
    - renderSchedulesList()
    - renderCalendar()
```

### Styling Architecture (`styles-new.css`)

#### CSS Variables
```css
:root {
  /* Colors */
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  
  /* Backgrounds */
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-bg: #ffffff;
  --dark-bg: #1f2937;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

#### Layout Structure
```
Body (Full viewport gradient)
    ↓
Container (Max 1400px, centered)
    ↓
Sections (Cards with padding)
    ↓
Grids (Responsive with CSS Grid)
    ↓
Components (Buttons, Forms, Badges)
```

#### Responsive Breakpoints
```css
/* Desktop (default) */
@media (min-width: 1400px) { /* Optimal */ }

/* Laptop */
@media (max-width: 1400px) { /* Adjust layout */ }

/* Tablet */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .calendar-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Mobile */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .calendar-grid { grid-template-columns: 1fr; }
  .modal-content { width: 95%; }
}
```

#### Key Animations
```css
/* Pulse animation for streaming status */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### UI Components

#### Status Badges
```html
<span class="status-badge status-scheduled">📅 Scheduled</span>
<span class="status-badge status-streaming">🔴 Streaming</span>
<span class="status-badge status-streamed">✅ Completed</span>
<span class="status-badge status-cancelled">❌ Cancelled</span>
<span class="status-badge status-failed">⚠️ Failed</span>
```

#### Calendar Day Card
```html
<div class="calendar-day">
  <div class="day-header">
    <span class="day-name">Monday</span>
    <span class="day-date">Oct 21</span>
  </div>
  <div class="day-slot morning">
    <span class="slot-time">🌅 6:00 AM</span>
    <span class="slot-status">📅 Scheduled</span>
    <span class="slot-title">Morning Yoga</span>
  </div>
  <div class="day-slot evening">
    <span class="slot-time">🌆 5:00 PM</span>
    <span class="slot-status">📅 Scheduled</span>
    <span class="slot-title">Evening Session</span>
  </div>
</div>
```

#### Schedule Item
```html
<div class="schedule-item">
  <div class="schedule-info">
    <h3>🌅 Morning Yoga - Sunrise Flow</h3>
    <p><strong>Date:</strong> Mon, Oct 21, 2025 | <strong>Slot:</strong> morning</p>
    <p><strong>Starts:</strong> 5:50 AM | <strong>Live:</strong> 6:00 AM</p>
    <p><strong>Description:</strong> Join us for a peaceful...</p>
  </div>
  <div class="schedule-meta">
    <span class="badge">🌍 Public</span>
    <span class="badge">👤 admin@example.com</span>
  </div>
  <div class="schedule-status">
    <span class="status-badge status-scheduled">📅 Scheduled</span>
  </div>
  <div class="schedule-actions">
    <button onclick="editSchedule(42)">✏️ Edit</button>
    <button onclick="cancelSchedule(42)">❌ Cancel</button>
  </div>
</div>
```

### User Interactions

#### Modal Workflow
```
1. User clicks "Schedule New Stream"
    ↓
2. showScheduleModal() executes
    ↓
3. Modal fades in (display: flex)
    ↓
4. User fills form
    ↓
5. User clicks "Create Schedule"
    ↓
6. Form submit event handler
    ↓
7. Validate inputs
    ↓
8. Call createSchedule() API function
    ↓
9. Show success/error message
    ↓
10. Reload schedules
    ↓
11. Close modal
```

#### Calendar Navigation
```
1. User clicks "Next Week"
    ↓
2. changeWeek(1) executes
    ↓
3. currentWeekOffset += 1
    ↓
4. renderCalendar() re-renders
    ↓
5. Calculate new week dates
    ↓
6. Filter schedules for that week
    ↓
7. Display in calendar grid
```

---

## 🚀 Deployment Strategy

### Deployment Options

#### Option 1: Oracle Cloud VM (Original)
**Pros**:
- Always Free Tier available
- Full control over server
- Can run cron jobs natively
- FFmpeg pre-installed

**Cons**:
- Manual setup required
- Server maintenance responsibility
- SSH access needed

**Best For**: Long-term, cost-free hosting with streaming requirements

---

#### Option 2: Render (Cloud Platform)
**Pros**:
- Automatic deployments from Git
- Free tier available
- Managed environment
- Easy scaling

**Cons**:
- Free tier doesn't support cron jobs
- Need external cron service (e.g., cron-job.org)
- Less control than VM

**Best For**: Quick deployment, managed hosting

---

### Oracle Cloud Deployment

#### Prerequisites
- Oracle Cloud account (free tier)
- Ubuntu 20.04+ VM instance
- Port 3000 open in security rules
- SSH access configured

#### Setup Process
```bash
# 1. SSH into VM
ssh ubuntu@your-vm-ip

# 2. Clone repository
git clone <repository-url>
cd yt-streamer

# 3. Run setup script
chmod +x setup.sh
./setup.sh
```

#### What `setup.sh` Does
```bash
#!/bin/bash

# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install FFmpeg
sudo apt install -y ffmpeg

# 3. Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install backend dependencies
cd backend
npm install

# 5. Configure environment
cp ../.env.example .env
# (User must manually edit .env with credentials)

# 6. Install PM2
sudo npm install -g pm2

# 7. Start backend
pm2 start index.js --name yt-streamer

# 8. Configure PM2 auto-start
pm2 startup
pm2 save

# 9. Install cron jobs
sudo cp ../ytstreamer.cron /etc/cron.d/ytstreamer
sudo chmod 644 /etc/cron.d/ytstreamer
sudo service cron restart

# 10. Create logs directory
mkdir -p ../logs

echo "Setup complete! Edit backend/.env with your credentials."
```

#### Post-Setup Configuration
```bash
# 1. Edit environment variables
cd ~/yt-streamer/backend
nano .env

# Add:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# YT_KEY=your-youtube-stream-key
# PORT=3000

# 2. Restart backend
pm2 restart yt-streamer

# 3. Verify services
pm2 status                    # Check backend
sudo service cron status      # Check cron
crontab -l                    # List cron jobs

# 4. Test manually
node ~/yt-streamer/backend/stream.js morning
```

#### Firewall Configuration
```bash
# Allow port 3000 in Oracle Cloud security rules
# Via Oracle Cloud Console:
# 1. Go to VM Instance → Virtual Cloud Network
# 2. Select Security List
# 3. Add Ingress Rule:
#    - Source: 0.0.0.0/0
#    - Protocol: TCP
#    - Port: 3000

# Also configure Ubuntu firewall
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

### Render Deployment

#### Prerequisites
- GitHub account
- Render account (free)
- Repository pushed to GitHub

#### Setup Process

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <github-repo-url>
   git push -u origin main
   ```

2. **Create Render Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: yt-streamer
     - **Environment**: Node
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && node index.js`
     - **Plan**: Free

3. **Set Environment Variables**:
   In Render dashboard, add:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   YT_KEY=your-youtube-stream-key
   YT_API_KEY=your-google-api-key (optional)
   PORT=10000
   ```

4. **Deploy**:
   - Render auto-deploys on git push
   - View logs in dashboard
   - Service available at: `https://yt-streamer.onrender.com`

#### Cron Jobs on Render

**Problem**: Render free tier doesn't support cron jobs.

**Solution**: Use external cron service

##### Option A: cron-job.org (Free)
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create two cron jobs:
   - **Morning**: 5:50 AM → `curl -X POST https://your-app.onrender.com/trigger-stream?slot=morning`
   - **Evening**: 4:50 PM → `curl -X POST https://your-app.onrender.com/trigger-stream?slot=evening`

3. Add endpoint to `backend/index.js`:
   ```javascript
   app.post('/trigger-stream', async (req, res) => {
     const { slot } = req.query;
     // Execute stream.js logic here
     res.json({ message: 'Stream triggered' });
   });
   ```

##### Option B: GitHub Actions (Free)
Create `.github/workflows/schedule-stream.yml`:
```yaml
name: Scheduled Streams

on:
  schedule:
    - cron: '50 5 * * *'  # Morning 5:50 AM UTC
    - cron: '50 16 * * *' # Evening 4:50 PM UTC

jobs:
  trigger-stream:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Stream
        run: |
          curl -X POST ${{ secrets.RENDER_APP_URL }}/trigger-stream?slot=morning
```

---

### Supabase Setup (Both Deployments)

#### 1. Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter project details
4. Wait for provisioning (~2 minutes)

#### 2. Run Migration
1. Go to SQL Editor
2. Copy contents of `backend/supabase_migration.sql`
3. Paste and run
4. Verify table creation in Table Editor

#### 3. Enable Authentication
1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure email settings (optional)

#### 4. Create Admin User
1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Verify email (or disable email verification in settings)

#### 5. Get API Credentials
1. Go to Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 6. Configure Row Level Security (Optional, for production)
```sql
-- Allow public read access
CREATE POLICY "Allow public read" ON schedules
FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON schedules
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own schedules
CREATE POLICY "Allow update own schedules" ON schedules
FOR UPDATE USING (created_by = auth.email());

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
```

---

## ⚙️ Configuration Management

### Environment Variables

#### Required Variables
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YouTube
YT_KEY=xxxx-xxxx-xxxx-xxxx-xxxx  # Stream key from YouTube Studio

# Server
PORT=3000                          # 3000 for local, 10000 for Render
```

#### Optional Variables
```bash
# YouTube API (for automatic broadcast creation)
YT_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# Node Environment
NODE_ENV=production

# Logging Level
LOG_LEVEL=info
```

### Configuration Files

#### `.env` (Backend)
```env
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
YT_KEY=your-stream-key
PORT=3000
```

**Security**: Never commit this file. Add to `.gitignore`.

#### `app.js` (Frontend)
```javascript
// Lines 8-9: Hardcoded Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

**Note**: Frontend credentials are visible to users. Use anon key only.

#### `package.json` (Backend)
```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.75.1",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "googleapis": "^144.0.0"
  }
}
```

#### `render.yaml` (Render Deployment)
```yaml
services:
  - type: web
    name: yt-streamer
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
      - key: YT_KEY
        sync: false
```

### Google Drive Configuration

#### Required Format
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

#### Setup Process
1. Upload video to Google Drive
2. Right-click → "Get link"
3. Change to "Anyone with the link can view"
4. Copy link: `https://drive.google.com/file/d/FILE_ID/view`
5. Extract `FILE_ID`
6. Format as: `https://drive.google.com/uc?export=download&id=FILE_ID`

#### Quota Limits
- **Daily Download Quota**: ~750 MB per file
- **Solution**: Host large files on multiple Google accounts
- **Alternative**: Use YouTube's "Premiere" feature (upload in advance)

### YouTube Configuration

#### Stream Key
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Create → Go Live → Stream
3. Copy **Stream Key**
4. Add to `backend/.env` as `YT_KEY`

#### Stream Settings (Recommended)
- **Latency**: Normal (10-30 seconds)
- **Resolution**: 1080p
- **Frame Rate**: 25 or 30 fps
- **Bitrate**: 3000-6000 kbps

#### YouTube API (Optional)
For automatic broadcast creation:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable **YouTube Data API v3**
4. Create API Key
5. Add to `backend/.env` as `YT_API_KEY`

---

## 🛠️ Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd yt-streamer

# 2. Install dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Run Supabase migration
# (Via Supabase Dashboard SQL Editor)

# 5. Create admin user
# (Via Supabase Dashboard Authentication)

# 6. Update frontend credentials
# Edit frontend/app.js lines 8-9

# 7. Start backend
npm start
# Or for auto-reload:
npm run dev

# 8. Open frontend
# Open frontend/index-new.html in browser
# Or use Live Server extension in VS Code
```

### Development Server
```bash
# Backend runs on http://localhost:3000
# Frontend accesses backend at same URL

# Test endpoints
curl http://localhost:3000/schedules
```

### Testing Workflows

#### Test Authentication
```bash
# 1. Open http://localhost:3000
# 2. Login with admin credentials
# 3. Check browser console for session token
# 4. Verify dashboard loads
```

#### Test Schedule Creation
```bash
# Via UI:
# 1. Click "Schedule New Stream"
# 2. Fill form
# 3. Submit
# 4. Check database in Supabase

# Via API:
curl -X POST http://localhost:3000/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2025-10-21",
    "slot": "morning",
    "video_url": "https://drive.google.com/uc?export=download&id=TEST",
    "title": "Test Stream"
  }'
```

#### Test Streaming
```bash
# Manually trigger stream script
cd backend
node stream.js morning

# Check logs
tail -f ../logs/morning.log

# Verify on YouTube Studio
```

### Code Quality

#### Linting
Currently not configured. Recommended:
```bash
npm install --save-dev eslint
npx eslint --init
npx eslint backend/index.js
```

#### Formatting
Currently not configured. Recommended:
```bash
npm install --save-dev prettier
echo '{ "semi": true, "singleQuote": true }' > .prettierrc
npx prettier --write "backend/**/*.js"
```

### Version Control

#### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Commit
git add .
git commit -m "Add new feature"

# 4. Push
git push origin feature/new-feature

# 5. Create Pull Request on GitHub
```

#### `.gitignore`
```
# Environment
.env
.env.local

# Dependencies
node_modules/

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Build
dist/
build/
```

### Debugging

#### Backend Debugging
```javascript
// Add debug logging
console.log('[DEBUG]', variable);

// Use Node.js inspector
node --inspect index.js
# Open chrome://inspect in Chrome
```

#### Frontend Debugging
```javascript
// Browser console
console.log('Schedule data:', allSchedules);

// Network tab
// Check API requests and responses

// Supabase debug
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

#### FFmpeg Debugging
```bash
# Verbose logging
ffmpeg -loglevel verbose -re -i "VIDEO_URL" ...

# Test without streaming
ffmpeg -i "VIDEO_URL" -t 10 output.mp4

# Check video info
ffmpeg -i "VIDEO_URL"
```

---

## 🔍 Troubleshooting Guide

### Common Issues

#### Issue: Can't Login
**Symptoms**:
- "Invalid credentials" error
- Login button doesn't respond

**Solutions**:
1. Verify user exists in Supabase Auth
2. Check email is verified (or disable verification)
3. Verify Supabase credentials in `frontend/app.js`
4. Check browser console for errors
5. Clear browser cache/cookies

**Debug**:
```javascript
// In browser console
supabaseClient.auth.getSession()
  .then(console.log)
  .catch(console.error);
```

---

#### Issue: Schedules Not Loading
**Symptoms**:
- "Loading schedules..." never completes
- Empty schedule list
- API error in console

**Solutions**:
1. Check backend is running: `pm2 status`
2. Verify database migration ran successfully
3. Check Supabase credentials in `backend/.env`
4. Test API endpoint directly: `curl http://localhost:3000/schedules`
5. Check browser console for CORS errors

**Debug**:
```bash
# Test database connection
psql -h your-supabase-db-host -U postgres -d postgres -c "SELECT * FROM schedules;"

# Check backend logs
pm2 logs yt-streamer --lines 50
```

---

#### Issue: Stream Doesn't Start
**Symptoms**:
- Cron runs but stream doesn't appear on YouTube
- FFmpeg errors in logs

**Solutions**:
1. Verify video URL is accessible:
   ```bash
   curl -I "https://drive.google.com/uc?export=download&id=FILE_ID"
   ```
2. Check YouTube stream key is correct
3. Verify FFmpeg is installed: `ffmpeg -version`
4. Check Google Drive sharing settings (Anyone with link)
5. Verify schedule exists in database for today

**Debug**:
```bash
# Manual test
cd ~/yt-streamer/backend
node stream.js morning

# Check logs
tail -f ~/yt-streamer/logs/morning.log

# Test FFmpeg command directly
ffmpeg -re -i "VIDEO_URL" -t 10 -f flv "rtmp://a.rtmp.youtube.com/live2/STREAM_KEY"
```

---

#### Issue: FFmpeg Errors
**Common Errors**:

##### 1. HTTP 403 Forbidden
```
[http @ 0x...] HTTP error 403 Forbidden
```
**Cause**: Google Drive link not shared publicly

**Solution**: Change Drive sharing to "Anyone with link"

---

##### 2. Connection Refused
```
[tcp @ 0x...] Connection to tcp://... failed
```
**Cause**: YouTube stream key invalid or YouTube Live not enabled

**Solution**: Verify stream key, enable YouTube Live

---

##### 3. Invalid Data Found
```
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x...] moov atom not found
```
**Cause**: Video file corrupted or wrong URL

**Solution**: Re-upload video, verify URL format

---

#### Issue: High CPU Usage
**Symptoms**:
- Server becomes slow during streaming
- FFmpeg consuming 100% CPU

**Solutions**:
1. Use faster preset: `-preset ultrafast` (lower quality)
2. Reduce resolution: Add `-s 1280x720`
3. Lower framerate: Add `-r 25`
4. Upgrade VM instance (Oracle Free Tier limits)

**Optimization**:
```bash
# Lower CPU usage (reduce quality)
ffmpeg -re -i "VIDEO_URL" \
  -c:v libx264 -preset ultrafast \
  -s 1280x720 -r 25 \
  -maxrate 2000k -bufsize 4000k \
  -c:a aac -b:a 96k \
  -f flv "rtmp://..."
```

---

#### Issue: Database Errors
**Common Errors**:

##### 1. Duplicate Key Error
```
duplicate key value violates unique constraint "schedules_date_slot_key"
```
**Cause**: Schedule already exists for this date/slot

**Solution**: Delete existing schedule or use different date/slot

---

##### 2. Connection Error
```
Error: connect ECONNREFUSED
```
**Cause**: Supabase credentials incorrect

**Solution**: Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

---

##### 3. RLS Policy Violation
```
Error: new row violates row-level security policy
```
**Cause**: Row Level Security enabled but policy doesn't allow insert

**Solution**: Disable RLS or update policy:
```sql
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
```

---

#### Issue: Cron Jobs Not Running
**Symptoms**:
- Scheduled streams never start
- No log files created

**Solutions**:
1. Verify cron service is running:
   ```bash
   sudo service cron status
   ```
2. Check cron job is installed:
   ```bash
   sudo cat /etc/cron.d/ytstreamer
   ```
3. Verify file permissions:
   ```bash
   sudo chmod 644 /etc/cron.d/ytstreamer
   ```
4. Check cron logs:
   ```bash
   sudo tail -f /var/log/syslog | grep CRON
   ```
5. Test manually:
   ```bash
   /usr/bin/node /home/ubuntu/yt-streamer/backend/stream.js morning
   ```

---

#### Issue: Frontend Not Loading
**Symptoms**:
- Blank page
- 404 error
- Can't access http://localhost:3000

**Solutions**:
1. Verify backend is serving static files:
   ```javascript
   // In backend/index.js
   app.use(express.static(path.join(__dirname, '../frontend')));
   ```
2. Check file paths are correct
3. Verify backend is running: `pm2 status`
4. Try accessing directly: `http://localhost:3000/index-new.html`
5. Check browser console for errors

---

### Monitoring & Maintenance

#### Check Service Status
```bash
# Backend
pm2 status
pm2 logs yt-streamer --lines 100

# Cron
sudo service cron status
crontab -l

# Disk space
df -h

# Memory usage
free -h
```

#### Log Rotation
```bash
# Add to /etc/logrotate.d/ytstreamer
/home/ubuntu/yt-streamer/logs/*.log {
  daily
  missingok
  rotate 30
  compress
  delaycompress
  notifempty
  create 644 ubuntu ubuntu
}

# Test
sudo logrotate -f /etc/logrotate.d/ytstreamer
```

#### Backup Database
```bash
# Via Supabase Dashboard: Settings → Backups
# Or via CLI:
pg_dump -h your-db-host -U postgres -d postgres -t schedules > schedules_backup.sql
```

---

## 📚 Additional Resources

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [YouTube Live Streaming API](https://developers.google.com/youtube/v3/live)

### Related Files
- `README.md` - User guide
- `QUICKSTART.md` - 5-minute setup
- `PROJECT_SUMMARY.md` - Implementation overview
- `ENHANCEMENTS_SUMMARY.md` - Feature enhancements
- `IMPLEMENTATION_GUIDE.md` - Development guide
- `RENDER_DEPLOYMENT.md` - Render deployment
- `DEPLOY_TO_RENDER.md` - Deployment steps

---

## 📝 Summary

This codebase implements a complete **YouTube Live Auto Streamer** with:

### Core Functionality
- ✅ Automated daily streaming (6 AM & 5 PM)
- ✅ Google Drive video integration
- ✅ FFmpeg-based RTMP streaming
- ✅ Cron-based scheduling

### Web Application
- ✅ Secure authentication (Supabase Auth)
- ✅ Modern admin dashboard
- ✅ Schedule management (CRUD)
- ✅ Calendar view
- ✅ Bulk scheduling
- ✅ Status tracking

### Infrastructure
- ✅ Node.js/Express backend
- ✅ Supabase database & auth
- ✅ Oracle Cloud VM hosting
- ✅ PM2 process management
- ✅ 100% free hosting

### Total Codebase
- **~2,035 lines** of core code
- **10+ documentation files**
- **7 key components**
- **5 API endpoints**
- **1 database table**

---

**Last Updated**: 2025-10-20  
**Version**: 1.0.0  
**Author**: Built for automated YouTube streaming

---

*This documentation is intended for AI assistants, developers, and maintainers to quickly understand and work with the codebase.*
