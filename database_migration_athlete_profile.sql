-- Migration: Add athlete profile fields to athlete_tokens table
-- This allows sponsored users to create complete athlete profiles visible in the marketplace

-- Add profile columns to athlete_tokens
ALTER TABLE public.athlete_tokens 
ADD COLUMN IF NOT EXISTS athlete_name TEXT,
ADD COLUMN IF NOT EXISTS sport TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT[],
ADD COLUMN IF NOT EXISTS social_twitter TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_twitch TEXT,
ADD COLUMN IF NOT EXISTS social_youtube TEXT,
ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_24h DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS market_cap DECIMAL DEFAULT 0;

-- Update existing records to calculate market_cap
UPDATE public.athlete_tokens
SET market_cap = total_tokens * price_per_token
WHERE market_cap IS NULL OR market_cap = 0;
