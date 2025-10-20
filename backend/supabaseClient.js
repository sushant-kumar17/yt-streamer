// File: backend/supabaseClient.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create and export the Supabase client instance
// This single 'supabase' instance will be used across the entire application
export const supabase = createClient(supabaseUrl, supabaseKey);