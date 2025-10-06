import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ksofdpcxpayldorwrjnm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzb2ZkcGN4cGF5bGRvcndyam5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjI1MzcsImV4cCI6MjA3NTE5ODUzN30.XTqvDMbb7A8tfVWCoYQx2EI5EyHZAqS71aSO47Azqvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
