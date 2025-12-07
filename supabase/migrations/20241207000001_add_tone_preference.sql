-- Add tone preference column to profiles table
ALTER TABLE public.profiles
ADD COLUMN tone_preference TEXT DEFAULT 'casual';

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.tone_preference IS 'User preferred tone for text improvement: casual or formal';
