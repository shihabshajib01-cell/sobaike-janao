-- Public security hardening: remove obsolete anonymous entry points and add
-- generous server-side payload bounds to anonymous write tables. These limits
-- are intentionally above normal UI values so legitimate journeys stay intact
-- while oversized abuse fails closed.

-- The public application now submits through submit_public_complaint_v2, which
-- enforces the Harassment classification contract before delegating internally.
-- Keep the legacy implementation for the wrapper, but do not expose it as a
-- second anonymous RPC that can bypass those validations.
REVOKE EXECUTE ON FUNCTION public.submit_public_complaint(jsonb, text, jsonb)
  FROM anon, authenticated;

-- This older upload helper is no longer referenced by any storage policy. The
-- current policy uses can_upload_public_complaint_evidence(text).
REVOKE EXECUTE ON FUNCTION public.can_upload_public_evidence(text)
  FROM anon, authenticated;

-- Make system-name resolution explicit for the remaining public response RPC.
ALTER FUNCTION public.submit_public_response(text, text, jsonb)
  SET search_path TO 'pg_catalog', 'public', 'pg_temp';

-- Anonymous response payload bounds. Existing canonical validation remains in
-- submit_public_response; these constraints are a final storage-side guardrail.
ALTER TABLE public.complaint_responses
  ADD CONSTRAINT complaint_responses_content_length_check
    CHECK (content IS NULL OR length(content) <= 10000),
  ADD CONSTRAINT complaint_responses_contact_info_length_check
    CHECK (contact_info IS NULL OR length(contact_info) <= 500),
  ADD CONSTRAINT complaint_responses_responder_name_length_check
    CHECK (responder_name IS NULL OR length(responder_name) <= 300),
  ADD CONSTRAINT complaint_responses_designation_length_check
    CHECK (designation IS NULL OR length(designation) <= 300),
  ADD CONSTRAINT complaint_responses_organization_name_length_check
    CHECK (organization_name IS NULL OR length(organization_name) <= 500),
  ADD CONSTRAINT complaint_responses_contact_length_check
    CHECK (contact_email_or_phone IS NULL OR length(contact_email_or_phone) <= 500),
  ADD CONSTRAINT complaint_responses_statement_length_check
    CHECK (official_statement IS NULL OR length(official_statement) <= 10000),
  ADD CONSTRAINT complaint_responses_supporting_note_length_check
    CHECK (supporting_documents_note IS NULL OR length(supporting_documents_note) <= 5000),
  ADD CONSTRAINT complaint_responses_correction_details_length_check
    CHECK (correction_details IS NULL OR length(correction_details) <= 5000);

-- Anonymous visit-session metadata bounds. Coordinates are already deliberately
-- discarded by record_public_visit_session and existing constraints validate
-- status/coordinate ranges/screen positivity.
ALTER TABLE public.public_visit_sessions
  ADD CONSTRAINT public_visit_sessions_visitor_id_length_check
    CHECK (length(visitor_id) BETWEEN 1 AND 128),
  ADD CONSTRAINT public_visit_sessions_session_id_length_check
    CHECK (length(session_id) BETWEEN 1 AND 128),
  ADD CONSTRAINT public_visit_sessions_browser_name_length_check
    CHECK (browser_name IS NULL OR length(browser_name) <= 200),
  ADD CONSTRAINT public_visit_sessions_browser_version_length_check
    CHECK (browser_version IS NULL OR length(browser_version) <= 200),
  ADD CONSTRAINT public_visit_sessions_os_name_length_check
    CHECK (os_name IS NULL OR length(os_name) <= 200),
  ADD CONSTRAINT public_visit_sessions_device_category_length_check
    CHECK (device_category IS NULL OR length(device_category) <= 100),
  ADD CONSTRAINT public_visit_sessions_platform_length_check
    CHECK (platform IS NULL OR length(platform) <= 200),
  ADD CONSTRAINT public_visit_sessions_language_length_check
    CHECK (language IS NULL OR length(language) <= 100),
  ADD CONSTRAINT public_visit_sessions_timezone_length_check
    CHECK (timezone IS NULL OR length(timezone) <= 200),
  ADD CONSTRAINT public_visit_sessions_user_agent_length_check
    CHECK (user_agent IS NULL OR length(user_agent) <= 1000),
  ADD CONSTRAINT public_visit_sessions_screen_width_upper_check
    CHECK (screen_width IS NULL OR screen_width <= 100000),
  ADD CONSTRAINT public_visit_sessions_screen_height_upper_check
    CHECK (screen_height IS NULL OR screen_height <= 100000);
