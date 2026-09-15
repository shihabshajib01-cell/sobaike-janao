-- Public security hardening: bind anonymous evidence registration to the
-- complaint submission folder that authorized the upload. This preserves the
-- existing public image-only workflow while closing cross-submission path
-- registration and tightening the SECURITY DEFINER search path.

CREATE OR REPLACE FUNCTION public.can_upload_public_complaint_evidence(
  p_storage_path text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'storage', 'pg_temp'
AS $function$
DECLARE
  v_client_submission_id text;
  v_file_name text;
  v_prefix text;
  v_existing_count integer;
BEGIN
  p_storage_path := trim(coalesce(p_storage_path, ''));

  IF p_storage_path = '' OR length(p_storage_path) > 512 THEN
    RETURN false;
  END IF;

  IF split_part(p_storage_path, '/', 1) <> 'public-submissions' THEN
    RETURN false;
  END IF;

  v_client_submission_id := split_part(p_storage_path, '/', 2);
  v_file_name := split_part(p_storage_path, '/', 3);

  IF v_client_submission_id = ''
     OR length(v_client_submission_id) < 8
     OR length(v_client_submission_id) > 128
     OR v_file_name = ''
     OR length(v_file_name) > 180
     OR split_part(p_storage_path, '/', 4) <> '' THEN
    RETURN false;
  END IF;

  -- Public evidence is always browser-decoded and re-encoded to WebP.
  IF v_file_name !~ '^[a-z0-9_-]+\.webp$' THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.client_submission_id = v_client_submission_id
      AND c.status = 'submitted'
  ) THEN
    RETURN false;
  END IF;

  v_prefix := 'public-submissions/' || v_client_submission_id || '/';

  SELECT count(*)
  INTO v_existing_count
  FROM storage.objects o
  WHERE o.bucket_id = 'complaint-evidence'
    AND o.name LIKE v_prefix || '%';

  RETURN v_existing_count < 6;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_public_complaint_evidence(
  p_client_submission_id text,
  p_storage_path text,
  p_file_name text,
  p_file_size_bytes bigint,
  p_caption text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'extensions', 'public', 'storage', 'pg_temp'
AS $function$
DECLARE
  v_client_submission_id text;
  v_storage_path text;
  v_file_name text;
  v_expected_prefix text;
  v_complaint_id text;
  v_existing_id uuid;
  v_evidence_id uuid;
  v_registered_count integer;
BEGIN
  v_client_submission_id := trim(coalesce(p_client_submission_id, ''));
  v_storage_path := trim(coalesce(p_storage_path, ''));
  v_file_name := trim(coalesce(p_file_name, ''));

  IF v_client_submission_id = ''
     OR length(v_client_submission_id) < 8
     OR length(v_client_submission_id) > 128 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: A valid client submission identifier is required.'
      USING ERRCODE = '22000';
  END IF;

  IF v_storage_path = '' OR length(v_storage_path) > 512 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: A valid storage path is required.'
      USING ERRCODE = '22000';
  END IF;

  IF v_file_name = '' OR length(v_file_name) > 180 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: A valid file name is required.'
      USING ERRCODE = '22000';
  END IF;

  IF p_file_size_bytes IS NULL
     OR p_file_size_bytes <= 0
     OR p_file_size_bytes > 262144 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Evidence file size is outside the allowed range.'
      USING ERRCODE = '22000';
  END IF;

  v_expected_prefix := 'public-submissions/' || v_client_submission_id || '/';

  IF split_part(v_storage_path, '/', 1) <> 'public-submissions'
     OR split_part(v_storage_path, '/', 2) <> v_client_submission_id
     OR split_part(v_storage_path, '/', 3) <> v_file_name
     OR split_part(v_storage_path, '/', 4) <> ''
     OR v_storage_path <> v_expected_prefix || v_file_name THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Evidence path does not belong to this submission.'
      USING ERRCODE = '22000';
  END IF;

  IF v_file_name !~ '^[a-z0-9_-]+\.webp$' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Public evidence must be a sanitized WebP image.'
      USING ERRCODE = '22000';
  END IF;

  SELECT c.id
  INTO v_complaint_id
  FROM public.complaints c
  WHERE c.client_submission_id = v_client_submission_id
    AND c.status = 'submitted'
  LIMIT 1;

  IF v_complaint_id IS NULL THEN
    RAISE EXCEPTION 'COMPLAINT_NOT_FOUND: No submitted complaint matches this submission identifier.'
      USING ERRCODE = '22000';
  END IF;

  -- Registration is permitted only after the exact object was accepted by the
  -- private bucket's upload policy. The bucket itself enforces WebP and 256 KB.
  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects o
    WHERE o.bucket_id = 'complaint-evidence'
      AND o.name = v_storage_path
  ) THEN
    RAISE EXCEPTION 'EVIDENCE_NOT_FOUND: Uploaded evidence object was not found.'
      USING ERRCODE = '22000';
  END IF;

  SELECT ce.id
  INTO v_existing_id
  FROM public.complaint_evidence ce
  WHERE ce.complaint_id = v_complaint_id
    AND ce.storage_path = v_storage_path
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'evidence_id', v_existing_id,
      'complaint_id', v_complaint_id,
      'duplicate', true
    );
  END IF;

  SELECT count(*)
  INTO v_registered_count
  FROM public.complaint_evidence ce
  WHERE ce.complaint_id = v_complaint_id;

  IF v_registered_count >= 6 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Maximum evidence count reached.'
      USING ERRCODE = '22000';
  END IF;

  INSERT INTO public.complaint_evidence (
    complaint_id,
    storage_path,
    file_name,
    mime_type,
    media_type,
    file_size_bytes,
    caption,
    created_at
  ) VALUES (
    v_complaint_id,
    v_storage_path,
    v_file_name,
    'image/webp',
    'image',
    p_file_size_bytes,
    left(nullif(trim(p_caption), ''), 500),
    now()
  )
  RETURNING id INTO v_evidence_id;

  UPDATE public.complaints
  SET has_supporting_info = true,
      updated_at = now()
  WHERE id = v_complaint_id;

  BEGIN
    PERFORM public.admin_emit_notification(
      p_event_key := 'complaint.evidence_attached',
      p_title_en := 'Evidence attached to complaint: ' || v_complaint_id,
      p_title_bn := 'অভিযোগে প্রমাণ সংযুক্ত করা হয়েছে: ' || v_complaint_id,
      p_body_en := 'New evidence attached: ' || v_file_name,
      p_body_bn := 'অভিযোগে নতুন প্রমাণ যুক্ত করা হয়েছে: ' || v_file_name,
      p_actor_user_id := NULL,
      p_target_type := 'complaint',
      p_target_id := v_complaint_id,
      p_target_label := v_file_name,
      p_metadata := jsonb_build_object(
        'complaint_id', v_complaint_id,
        'evidence_id', v_evidence_id,
        'evidence_type', 'image',
        'storage_path', v_storage_path,
        'file_name', v_file_name,
        'file_size_bytes', p_file_size_bytes,
        'created_at', now()
      ),
      p_required_all_permissions := ARRAY['complaints.view', 'complaints.evidence_view'],
      p_required_any_permissions := '{}'::text[],
      p_audience_mode := 'permission',
      p_route := '/complaints/' || v_complaint_id,
      p_dedupe_key := 'complaint.evidence_attached:' || v_evidence_id::text,
      p_exclude_actor := false,
      p_include_super_admin := true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'admin_emit_notification failed for complaint.evidence_attached (%): %',
      v_evidence_id,
      SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'evidence_id', v_evidence_id,
    'complaint_id', v_complaint_id
  );
END;
$function$;

-- The function already uses only qualified/public objects, and public schema
-- CREATE is not granted to anonymous/authenticated roles. Add pg_catalog first
-- to make name resolution explicit for this SECURITY DEFINER function.
ALTER FUNCTION public.submit_public_complaint(jsonb, text, jsonb)
  SET search_path TO 'pg_catalog', 'public', 'pg_temp';
