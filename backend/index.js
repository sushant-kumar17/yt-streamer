// File: backend/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { supabase } from './supabaseClient.js';
import { google } from 'googleapis';

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- YouTube API Setup ---
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YT_API_KEY // Google API Key (not stream key)
});

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

// --- Authentication Middleware ---
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// --- API Endpoints ---

/**
 * @route   GET /schedules
 * @desc    Retrieves all scheduled videos with enhanced details
 * @access  Public (read-only)
 */
app.get('/schedules', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    let query = supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true })
      .order('slot', { ascending: true });
    
    // Optional date range filtering
    if (from_date) {
      query = query.gte('date', from_date);
    }
    if (to_date) {
      query = query.lte('date', to_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

/**
 * @route   POST /schedule
 * @desc    Create a new schedule with YouTube broadcast (requires auth)
 * @access  Protected
 */
app.post('/schedule', verifyAuth, async (req, res) => {
  const { date, slot, video_url, title, description, privacy } = req.body;

  // Validation
  if (!date || !slot || !video_url || !title) {
    return res.status(400).json({ error: 'Missing required fields: date, slot, video_url, title' });
  }

  if (slot !== 'morning' && slot !== 'evening') {
    return res.status(400).json({ error: 'Slot must be "morning" or "evening"' });
  }

  try {
    // Check for existing schedule
    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('date', date)
      .eq('slot', slot)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Schedule already exists for this date and slot' });
    }

    // Create YouTube Live broadcast (optional - can be created later)
    let youtubeBroadcastId = null;
    let youtubeStreamUrl = null;
    let youtubeWatchUrl = null;

    // Note: Full YouTube API integration requires OAuth2
    // For now, we'll store the data and create the broadcast when streaming starts
    // You can integrate OAuth2 flow for full YouTube API access

    // Insert schedule
    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        date,
        slot,
        video_url,
        title,
        description: description || '',
        privacy: privacy || 'public',
        status: 'scheduled',
        created_by: req.user.email,
        youtube_broadcast_id: youtubeBroadcastId,
        youtube_stream_url: youtubeStreamUrl,
        youtube_watch_url: youtubeWatchUrl
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Successfully scheduled:', data[0]);
    res.status(201).json({ 
      message: 'Schedule created successfully!', 
      data: data[0] 
    });

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

/**
 * @route   PUT /schedule/:id
 * @desc    Update an existing schedule
 * @access  Protected
 */
app.put('/schedule/:id', verifyAuth, async (req, res) => {
  const { id } = req.params;
  const { video_url, title, description, privacy, status } = req.body;

  try {
    const updates = {};
    if (video_url) updates.video_url = video_url;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (privacy) updates.privacy = privacy;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ 
      message: 'Schedule updated successfully', 
      data: data[0] 
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

/**
 * @route   DELETE /schedule/:id
 * @desc    Cancel/delete a schedule
 * @access  Protected
 */
app.delete('/schedule/:id', verifyAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete by updating status to cancelled
    const { data, error } = await supabase
      .from('schedules')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ 
      message: 'Schedule cancelled successfully', 
      data: data[0] 
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

/**
 * @route   POST /schedule/bulk
 * @desc    Create multiple schedules at once (for weekly scheduling)
 * @access  Protected
 */
app.post('/schedule/bulk', verifyAuth, async (req, res) => {
  const { schedules } = req.body;

  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: 'schedules array is required' });
  }

  try {
    // Validate and prepare schedules
    const preparedSchedules = schedules.map(s => ({
      date: s.date,
      slot: s.slot,
      video_url: s.video_url,
      title: s.title,
      description: s.description || '',
      privacy: s.privacy || 'public',
      status: 'scheduled',
      created_by: req.user.email
    }));

    // Insert all schedules
    const { data, error } = await supabase
      .from('schedules')
      .insert(preparedSchedules)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ 
      message: `${data.length} schedules created successfully`, 
      data 
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// --- Serve Frontend Files ---
// This part makes your backend server also act as a web server for your UI
const __dirname = path.resolve(); // Get the absolute path of the project directory
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
});