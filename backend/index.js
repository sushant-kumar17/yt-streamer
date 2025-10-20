// File: backend/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { supabase } from './supabaseClient.js'; // Import the client

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) so your frontend can talk to this server
app.use(cors()); 
// Enable the server to parse JSON-formatted request bodies
app.use(express.json()); 

// --- API Endpoints ---

/**
 * @route   GET /schedules
 * @desc    Retrieves all scheduled videos, optionally filtered by date range
 * @access  Public
 */
app.get('/schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true })
      .order('slot', { ascending: true });

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
 * @desc    Saves a new video schedule to the Supabase database.
 * @access  Public
 * * Expects a JSON body like:
 * {
 * "date": "2025-10-21",
 * "slot": "morning",
 * "video_url": "https://drive.google.com/uc?export=download&id=..."
 * }
 */
app.post('/schedule', async (req, res) => {
  const { date, slot, video_url } = req.body;

  // Basic validation to ensure all required fields are present
  if (!date || !slot || !video_url) {
    return res.status(400).json({ error: 'Missing required fields: date, slot, or video_url.' });
  }

  // Validate slot value
  if (slot !== 'morning' && slot !== 'evening') {
    return res.status(400).json({ error: 'Slot must be either "morning" or "evening".' });
  }

  try {
    // Check if a schedule already exists for this date and slot
    const { data: existing, error: checkError } = await supabase
      .from('schedules')
      .select('id')
      .eq('date', date)
      .eq('slot', slot)
      .single();

    // If a schedule exists, update it instead of inserting
    if (existing && !checkError) {
      const { data, error } = await supabase
        .from('schedules')
        .update({ video_url, status: 'pending' })
        .eq('date', date)
        .eq('slot', slot)
        .select();

      if (error) {
        console.error('Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log('Successfully updated schedule:', data[0]);
      return res.status(200).json({ message: 'Schedule updated successfully!', data: data[0] });
    }

    // Insert the new schedule into the 'schedules' table in Supabase
    const { data, error } = await supabase
      .from('schedules')
      .insert([
        { 
          date: date, 
          slot: slot, 
          video_url: video_url,
          status: 'pending' // Default status
        }
      ])
      .select(); // .select() returns the inserted row

    // If Supabase returns an error, log it and send a 500 response
    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // If successful, send back the newly created schedule data
    console.log('Successfully scheduled:', data[0]);
    res.status(201).json({ message: 'Schedule created successfully!', data: data[0] });

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