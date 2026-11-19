-- ONEED Research Institute
-- Security configuration for an existing ONEED database.
-- Prerequisite: public.profiles, public.bug_reports and
-- public.consultation_requests already exist.
-- Do not apply to production without a separate review.

BEGIN;

-- 1. Enable RLS on public tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- 2. Restrict table privileges.
REVOKE ALL ON TABLE
  public.profiles,
  public.bug_reports,
  public.consultation_requests
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.profiles
TO authenticated;

GRANT ALL
ON TABLE
  public.profiles,
  public.bug_reports,
  public.consultation_requests
TO service_role;

-- 3. Restrict identity-sequence privileges.
REVOKE ALL ON SEQUENCE
  public.bug_reports_id_seq,
  public.consultation_requests_id_seq
FROM PUBLIC, anon, authenticated;

GRANT ALL ON SEQUENCE
  public.bug_reports_id_seq,
  public.consultation_requests_id_seq
TO service_role;

-- 4. Recreate verified profile policies.
DROP POLICY IF EXISTS
  "Users can create their own profile"
ON public.profiles;

DROP POLICY IF EXISTS
  "Users can read their own profile"
ON public.profiles;

DROP POLICY IF EXISTS
  "Users can update their own profile"
ON public.profiles;

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- 5. Create the private rate-limit storage.
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private
FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.api_rate_limits (
  key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  CONSTRAINT api_rate_limits_pkey
    PRIMARY KEY (key_hash, window_start),
  CONSTRAINT valid_rate_limit_count
    CHECK (request_count >= 0)
);

ALTER TABLE private.api_rate_limits
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.api_rate_limits
FROM PUBLIC, anon, authenticated;

-- 6. Install the verified atomic rate-limit function.
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  reset_in_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_count integer;
BEGIN
  IF p_key_hash IS NULL
     OR p_key_hash !~ '^[0-9a-f]{64}$'
     OR p_limit IS NULL
     OR p_limit < 1
     OR p_limit > 10000
     OR p_window_seconds IS NULL
     OR p_window_seconds < 1
     OR p_window_seconds > 86400
  THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  v_window_start :=
    to_timestamp(
      floor(extract(epoch FROM v_now) / p_window_seconds)
      * p_window_seconds
    );

  v_window_end :=
    v_window_start
    + make_interval(secs => p_window_seconds);

  INSERT INTO private.api_rate_limits (
    key_hash,
    window_start,
    request_count
  )
  VALUES (
    p_key_hash,
    v_window_start,
    1
  )
  ON CONFLICT (key_hash, window_start)
  DO UPDATE
    SET request_count =
      LEAST(
        private.api_rate_limits.request_count + 1,
        p_limit + 1
      )
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT
    v_count <= p_limit,
    GREATEST(p_limit - v_count, 0),
    GREATEST(
      ceil(extract(epoch FROM (v_window_end - v_now)))::integer,
      0
    );
END;
$function$;

-- 7. Preserve the verified function owner.
-- Execute migrations using an appropriately privileged role.
ALTER FUNCTION public.check_api_rate_limit(
  text, integer, integer
) OWNER TO postgres;

-- 8. Restrict function execution.
REVOKE ALL ON FUNCTION
  public.check_api_rate_limit(text, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.check_api_rate_limit(text, integer, integer)
TO service_role;

COMMIT;
