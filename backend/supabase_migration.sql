-- YouTube Live Streamer - Supabase Migration (Enhanced Version)
-- This migration creates the schedules table with YouTube integration

-- Create the schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  slot VARCHAR(10) NOT NULL CHECK (slot IN ('morning', 'evening')),
  video_url TEXT NOT NULL,
  
  -- YouTube details
  title VARCHAR(100) NOT NULL DEFAULT 'Live Yoga Session',
  description TEXT,
  privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'unlisted', 'private')),
  youtube_broadcast_id VARCHAR(100),
  youtube_stream_url TEXT,
  youtube_watch_url TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'streaming', 'streamed', 'cancelled', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin tracking
  created_by VARCHAR(100),
  
  -- Ensure only one schedule per date and slot combination
  UNIQUE(date, slot)
);

-- Create an index on date and slot for faster queries
CREATE INDEX IF NOT EXISTS idx_schedules_date_slot ON schedules(date, slot);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before any UPDATE
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - comment out if not needed)
-- INSERT INTO schedules (date, slot, video_url, status) VALUES
--   ('2025-10-21', 'morning', 'https://drive.google.com/uc?export=download&id=SAMPLE_ID_1', 'pending'),
--   ('2025-10-21', 'evening', 'https://drive.google.com/uc?export=download&id=SAMPLE_ID_2', 'pending');

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! The schedules table is ready.';
END $$;
