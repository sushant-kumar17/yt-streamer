// File: backend/stream.js

import { exec } from 'child_process';
import { supabase } from './supabaseClient.js'; // Import the same client
import dotenv from 'dotenv';

// Load environment variables (especially YT_KEY)
dotenv.config();

// --- Main Streaming Logic ---

async function runStream() {
  // Get the slot ('morning' or 'evening') from the command-line arguments
  const slot = process.argv[2]; 
  if (!slot) {
    console.error("Error: Missing slot argument. Call script with 'morning' or 'evening'.");
    process.exit(1); // Exit with an error code
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  console.log(`[${new Date().toLocaleString()}] [${slot}] Searching for a video scheduled for ${today}...`);

  try {
    // Query Supabase for a video that matches today's date and the specified slot
    const { data: video, error } = await supabase
      .from('schedules')
      .select('video_url')
      .eq('date', today)
      .eq('slot', slot)
      .single(); // .single() expects exactly one row to be returned

    // If Supabase returns an error (e.g., no rows found), log it and exit
    if (error) {
      console.log(`[${slot}] No video scheduled for ${today}. Exiting gracefully.`);
      process.exit(0);
    }
    
    console.log(`[${slot}] Found video! Starting stream for URL: ${video.video_url}`);
    
    // Your YouTube stream key from the .env file
    const YOUTUBE_STREAM_KEY = process.env.YT_KEY;
    if (!YOUTUBE_STREAM_KEY) {
        console.error("Error: YT_KEY is not set in the .env file.");
        process.exit(1);
    }

    // Construct the powerful FFmpeg command
    const ffmpegCmd = `
      ffmpeg -re -i "${video.video_url}" \
      -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
      -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 \
      -f flv "rtmp://a.rtmp.youtube.com/live2/${YOUTUBE_STREAM_KEY}"
    `;

    // Execute the FFmpeg command as a child process
    const ffmpegProcess = exec(ffmpegCmd);

    // Log FFmpeg's standard output (progress, stats, etc.)
    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`[FFMPEG STDOUT]: ${data}`);
    });

    // Log FFmpeg's standard error (more detailed info, and actual errors)
    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`[FFMPEG STDERR]: ${data}`);
    });

    // Log when the stream process finishes
    ffmpegProcess.on('close', (code) => {
      console.log(`[${slot}] FFmpeg process exited with code ${code}. Stream finished.`);
    });

  } catch (err) {
    console.error(`[${slot}] An unexpected script error occurred:`, err.message);
    process.exit(1);
  }
}

// Run the main function
runStream();