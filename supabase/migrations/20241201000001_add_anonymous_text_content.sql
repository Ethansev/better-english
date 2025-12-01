-- Add text content columns to analytics table for anonymous users
ALTER TABLE public.analytics
ADD COLUMN original_text TEXT,
ADD COLUMN improved_text TEXT;

-- Add comment explaining the column usage
COMMENT ON COLUMN public.analytics.original_text IS 'Full text content - only populated for anonymous users (user_id IS NULL)';
COMMENT ON COLUMN public.analytics.improved_text IS 'Full text content - only populated for anonymous users (user_id IS NULL)';

-- Add a partial index for efficient anonymous user queries
CREATE INDEX idx_analytics_anonymous_ip
ON public.analytics(ip_address, created_at DESC)
WHERE user_id IS NULL;

-- 30-day retention cleanup function for anonymous text
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_text()
RETURNS void AS $$
BEGIN
  UPDATE public.analytics
  SET original_text = NULL, improved_text = NULL
  WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
