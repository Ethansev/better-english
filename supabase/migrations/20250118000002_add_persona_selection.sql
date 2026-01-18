-- Add selected_persona column to profiles table
ALTER TABLE public.profiles
ADD COLUMN selected_persona TEXT;

-- Add constraint to limit valid persona values
ALTER TABLE public.profiles
ADD CONSTRAINT check_selected_persona CHECK (
  selected_persona IS NULL OR selected_persona IN (
    'professor_maxwell',
    'creative_casey',
    'executive_elena',
    'friendly_sam',
    'tech_taylor'
  )
);

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.selected_persona IS 'User selected AI writing persona';
