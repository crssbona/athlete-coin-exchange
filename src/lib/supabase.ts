import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwumwryacppddvfwulok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dW13cnlhY3BwZGR2Znd1bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTMzNTYsImV4cCI6MjA4NzE4OTM1Nn0.9tLaPN1vLPIqMLt3O3l7D6v8xb5ivTSC7IqH5t8lDT8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
