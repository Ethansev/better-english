-- Add name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Update handle_new_user function to extract names from various OAuth providers
-- Google stores name in 'full_name' or 'name'
-- GitHub stores name in 'name' or 'user_name'
-- Email signup stores name in 'name' (set by us)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',           -- Email signup / some providers
      NEW.raw_user_meta_data->>'full_name',      -- Google
      NEW.raw_user_meta_data->>'user_name',      -- GitHub fallback
      NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
