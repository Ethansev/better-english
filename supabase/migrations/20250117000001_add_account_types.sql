-- Add account_type enum
CREATE TYPE public.account_type AS ENUM ('free', 'unlimited', 'premium');

-- Add account_type column to profiles table
ALTER TABLE public.profiles
ADD COLUMN account_type public.account_type DEFAULT 'free' NOT NULL;

-- Update handle_new_user() trigger to set default account type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, account_type)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for admins to update profiles (for changing account types)
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Add index on account_type for efficient queries
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
