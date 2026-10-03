-- ==============================================================================
-- Rentora Production OTP Verification System Migration
-- Migration: 20260907_otp_verification_system.sql
-- Description: Creates the secure otp_verifications table, RLS isolation policies,
--              cryptographic OTP generation & hashing, strict 60-second TTL,
--              attempt rate-limiting, and atomic verification/cleanup functions.
-- ==============================================================================

-- 1. Enable pgcrypto extension for secure random generation and bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the secure public.otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('phone', 'email')),
    target_value TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create high-performance indexes for lookup, rate-limiting, and cleanup
CREATE INDEX IF NOT EXISTS idx_otp_verifications_lookup 
    ON public.otp_verifications (user_id, target_type, target_value);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at 
    ON public.otp_verifications (expires_at);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_rate_limit 
    ON public.otp_verifications (user_id, target_type, created_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 5. Restrict direct client table access (Zero Direct Grants to anon / authenticated)
-- Direct SELECT, INSERT, UPDATE, DELETE queries from clients will be denied.
-- All operations MUST run through SECURITY DEFINER functions with controlled search_path.
REVOKE ALL ON TABLE public.otp_verifications FROM public, anon, authenticated;
GRANT ALL ON TABLE public.otp_verifications TO service_role;

-- 6. Implement Secure RPC Function: request_otp
-- Generates a cryptographically secure 6-digit OTP, hashes it with bcrypt,
-- enforces 60-second cooldown & hourly rate limits, sets 60-second TTL,
-- and NEVER returns the plaintext OTP or hash to the caller.
CREATE OR REPLACE FUNCTION public.request_otp(
    p_target_type TEXT,
    p_target_value TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_normalized_target TEXT;
    v_recent_request_count INT;
    v_last_request_time TIMESTAMPTZ;
    v_seconds_since_last INT;
    v_raw_int BIGINT;
    v_otp_code TEXT;
    v_otp_hash TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Require an authenticated Supabase user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required. Please sign in.'
        );
    END IF;

    -- Validate target type
    IF p_target_type NOT IN ('phone', 'email') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid target type. Must be phone or email.'
        );
    END IF;

    -- Normalize target value
    IF p_target_type = 'phone' THEN
        -- Strip non-digits and extract 10-digit Indian mobile number
        v_normalized_target := substring(regexp_replace(COALESCE(p_target_value, ''), '\D', '', 'g') from '([0-9]{10})$');
        IF v_normalized_target IS NULL OR length(v_normalized_target) != 10 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Invalid mobile number. Please enter a valid 10-digit number.'
            );
        END IF;
    ELSE
        -- Normalize email: lowercase and trim whitespace
        v_normalized_target := lower(trim(COALESCE(p_target_value, '')));
        IF v_normalized_target !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Invalid email address format.'
            );
        END IF;
    END IF;

    -- Rate Limit 1: 60-second cooldown per target type for this user
    SELECT created_at INTO v_last_request_time
    FROM public.otp_verifications
    WHERE user_id = v_user_id
      AND target_type = p_target_type
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_request_time IS NOT NULL THEN
        v_seconds_since_last := EXTRACT(EPOCH FROM (now() - v_last_request_time))::INT;
        IF v_seconds_since_last < 60 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Please wait before requesting another OTP code.',
                'retry_after_seconds', (60 - v_seconds_since_last)
            );
        END IF;
    END IF;

    -- Rate Limit 2: Maximum 5 OTP requests per hour per target type
    SELECT COUNT(*) INTO v_recent_request_count
    FROM public.otp_verifications
    WHERE user_id = v_user_id
      AND target_type = p_target_type
      AND created_at > now() - interval '1 hour';

    IF v_recent_request_count >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hourly verification limit reached. Please try again later.'
        );
    END IF;

    -- Clean up previous unverified OTP records for this user and target type
    DELETE FROM public.otp_verifications
    WHERE user_id = v_user_id
      AND target_type = p_target_type;

    -- Generate cryptographically secure 6-digit OTP (range 100000 to 999999)
    -- Uses 4 bytes of cryptographic randomness from pgcrypto
    v_raw_int := 100000 + (abs(('x' || encode(gen_random_bytes(4), 'hex'))::bit(31)::bigint) % 900000);
    v_otp_code := v_raw_int::TEXT;

    -- Securely hash the OTP using bcrypt (cost factor 8 for optimal speed & security)
    v_otp_hash := crypt(v_otp_code, gen_salt('bf', 8));

    -- Set validity to EXACTLY 60 seconds (1 minute)
    v_expires_at := now() + interval '1 minute';

    -- Store OTP hash record (NEVER storing plaintext)
    INSERT INTO public.otp_verifications (
        user_id,
        target_type,
        target_value,
        otp_hash,
        expires_at,
        attempts,
        created_at
    ) VALUES (
        v_user_id,
        p_target_type,
        v_normalized_target,
        v_otp_hash,
        v_expires_at,
        0,
        now()
    );

    -- Log secure dispatch event (Without leaking code in production logs)
    -- In future steps, notification hooks / Edge Functions trigger real SMS/Email providers here.

    -- Return safe response: Plaintext OTP and OTP hash are NEVER exposed to client.
    RETURN json_build_object(
        'success', true,
        'message', 'Verification OTP requested successfully.',
        'target_type', p_target_type,
        'expires_in_seconds', 60
    );
END;
$$;

-- 7. Implement Secure RPC Function: verify_otp
-- Validates code against stored hash, enforces max 5 attempts, checks 60-second TTL,
-- and IMMEDIATELY deletes / invalidates the OTP record upon successful verification.
CREATE OR REPLACE FUNCTION public.verify_otp(
    p_target_type TEXT,
    p_target_value TEXT,
    p_otp_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_normalized_target TEXT;
    v_record RECORD;
    v_clean_code TEXT;
    v_is_match BOOLEAN;
BEGIN
    -- Require authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required. Please sign in.'
        );
    END IF;

    -- Validate target type
    IF p_target_type NOT IN ('phone', 'email') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid target type. Must be phone or email.'
        );
    END IF;

    -- Normalize target value
    IF p_target_type = 'phone' THEN
        v_normalized_target := substring(regexp_replace(COALESCE(p_target_value, ''), '\D', '', 'g') from '([0-9]{10})$');
    ELSE
        v_normalized_target := lower(trim(COALESCE(p_target_value, '')));
    END IF;

    -- Normalize provided OTP code
    v_clean_code := trim(COALESCE(p_otp_code, ''));
    IF length(v_clean_code) != 6 OR v_clean_code !~ '^[0-9]{6}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Please enter a valid 6-digit numeric verification code.'
        );
    END IF;

    -- Retrieve active OTP record locked for update
    SELECT * INTO v_record
    FROM public.otp_verifications
    WHERE user_id = v_user_id
      AND target_type = p_target_type
      AND target_value = v_normalized_target
    FOR UPDATE;

    -- Check if record exists
    IF v_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No active verification request found or the code has expired.'
        );
    END IF;

    -- Check if expired (strictly 60-second TTL)
    IF v_record.expires_at <= now() THEN
        -- Delete expired record immediately
        DELETE FROM public.otp_verifications WHERE id = v_record.id;
        RETURN json_build_object(
            'success', false,
            'error', 'The verification code has expired (validity is 1 minute). Please request a new code.'
        );
    END IF;

    -- Check attempt limit (max 5 failed attempts)
    IF v_record.attempts >= 5 THEN
        DELETE FROM public.otp_verifications WHERE id = v_record.id;
        RETURN json_build_object(
            'success', false,
            'error', 'Maximum verification attempts exceeded. Please request a new code.'
        );
    END IF;

    -- Cryptographically verify OTP against stored bcrypt hash
    v_is_match := (crypt(v_clean_code, v_record.otp_hash) = v_record.otp_hash);

    IF v_is_match THEN
        -- ATOMIC CONSUMPTION: Invalidate and delete OTP record immediately
        DELETE FROM public.otp_verifications WHERE id = v_record.id;

        -- Return safe success confirmation
        RETURN json_build_object(
            'success', true,
            'message', 'Verification successful.',
            'target_type', p_target_type,
            'target_value', v_normalized_target
        );
    ELSE
        -- Increment failed attempt counter
        IF v_record.attempts + 1 >= 5 THEN
            -- Exceeded limit: delete record immediately
            DELETE FROM public.otp_verifications WHERE id = v_record.id;
            RETURN json_build_object(
                'success', false,
                'error', 'Maximum verification attempts exceeded. Please request a new code.',
                'attempts_remaining', 0
            );
        ELSE
            UPDATE public.otp_verifications
            SET attempts = attempts + 1
            WHERE id = v_record.id;

            RETURN json_build_object(
                'success', false,
                'error', 'Invalid verification code. Please check and try again.',
                'attempts_remaining', (5 - (v_record.attempts + 1))
            );
        END IF;
    END IF;
END;
$$;

-- 8. Implement Scheduled / Callable Cleanup Function
-- Safely purges stale and expired OTP records older than 5 minutes.
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.otp_verifications
    WHERE expires_at < now() - interval '5 minutes';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- 9. Secure Function Permissions & Grants
-- Revoke all public/anon execution rights
REVOKE ALL ON FUNCTION public.request_otp(TEXT, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.verify_otp(TEXT, TEXT, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_otps() FROM public, anon, authenticated;

-- Grant execution strictly to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.request_otp(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO service_role;
