-- Function to count anonymous requests for rate limiting
-- Uses SECURITY DEFINER to bypass RLS (like is_admin function)
CREATE OR REPLACE FUNCTION public.count_anonymous_requests(
  p_ip_address TEXT,
  p_since TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.analytics
  WHERE user_id IS NULL
    AND ip_address = p_ip_address
    AND created_at >= p_since;
$$;

-- Allow anonymous users to call this function
GRANT EXECUTE ON FUNCTION public.count_anonymous_requests TO anon;
GRANT EXECUTE ON FUNCTION public.count_anonymous_requests TO authenticated;
