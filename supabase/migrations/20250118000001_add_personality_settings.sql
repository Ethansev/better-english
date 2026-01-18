-- Add personality settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN custom_instructions TEXT,
ADD COLUMN verbosity_preference TEXT DEFAULT 'balanced',
ADD COLUMN personality_preset TEXT;

-- Add constraints
ALTER TABLE public.profiles
ADD CONSTRAINT check_custom_instructions_length CHECK (custom_instructions IS NULL OR length(custom_instructions) <= 500),
ADD CONSTRAINT check_verbosity_preference CHECK (verbosity_preference IN ('concise', 'balanced', 'detailed')),
ADD CONSTRAINT check_personality_preset CHECK (personality_preset IS NULL OR personality_preset IN ('friendly', 'professional', 'academic', 'technical'));

-- Add comments explaining the columns
COMMENT ON COLUMN public.profiles.custom_instructions IS 'User custom instructions for AI (max 500 chars)';
COMMENT ON COLUMN public.profiles.verbosity_preference IS 'User preferred verbosity: concise, balanced, or detailed';
COMMENT ON COLUMN public.profiles.personality_preset IS 'User preferred personality preset: friendly, professional, academic, or technical';

-- Add update policy for profiles (users can update their own profile)
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
