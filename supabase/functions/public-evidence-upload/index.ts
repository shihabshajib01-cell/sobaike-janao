import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import { sanitizeEvidenceWebP } from "../_shared/webp-sanitizer.js";

const ALLOWED_ORIGINS = new Set([
  "https://shobaikejanao.com",
  "https://www.shobaikejanao.com",
  "https://shihabshajib01-cell.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const MAX_REQUEST_BYTES = 307_200;
const MAX_FILE_BYTES = 262_144;

const corsHeadersFor = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const sourceIpFor = (req: Request): string | null => {
  for (const candidate of [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
  ]) {
    const value = String(candidate || "").trim();
    if (value && value.length <= 64 && !/[\r\n]/.test(value)) return value;
  }
  return null;
};

const hmacHex = async (keyValue: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyValue),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("sobaike-public-write-v1:" + value),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("Origin") || "";
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Forbidden", { status: 403, headers: corsHeadersFor(req) });
    }
    return new Response("ok", { headers: corsHeadersFor(req) });
  }

  if (req.method !== "POST") {
    return json(req, { success: false, error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const origin = req.headers.get("Origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(req, { success: false, error: "Origin not allowed.", code: "ORIGIN_NOT_ALLOWED" }, 403);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json(req, { success: false, error: "Multipart form data is required.", code: "INVALID_CONTENT_TYPE" }, 415);
  }

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json(req, { success: false, error: "Request payload is too large.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let rawBody: Uint8Array;
  try {
    rawBody = new Uint8Array(await req.arrayBuffer());
  } catch {
    return json(req, { success: false, error: "Invalid request body.", code: "INVALID_BODY" }, 400);
  }
  if (rawBody.byteLength > MAX_REQUEST_BYTES) {
    return json(req, { success: false, error: "Request payload is too large.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, { success: false, error: "Service unavailable.", code: "SERVER_CONFIGURATION_ERROR" }, 503);
  }

  const sourceIp = sourceIpFor(req);
  if (!sourceIp) {
    return json(req, { success: false, error: "Request validation failed.", code: "SOURCE_IDENTITY_UNAVAILABLE" }, 400);
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sourceFingerprint = await hmacHex(serviceRoleKey, sourceIp);
  const { data: limitData, error: limitError } = await service.rpc(
    "service_assert_public_write_rate",
    { p_source_fingerprint: sourceFingerprint, p_action: "evidence" },
  );
  if (limitError) {
    console.error("Evidence upload rate limiter failed.", limitError);
    return json(req, { success: false, error: "Request validation failed.", code: "RATE_LIMIT_CHECK_FAILED" }, 503);
  }
  if (limitData?.allowed !== true) {
    return json(req, {
      success: false,
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
      retryAfterSeconds: Number(limitData?.retryAfterSeconds || 60),
    }, 429);
  }

  let form: FormData;
  try {
    const parsedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: rawBody,
    });
    form = await parsedRequest.formData();
  } catch {
    return json(req, { success: false, error: "Invalid multipart request.", code: "INVALID_MULTIPART" }, 400);
  }

  const clientSubmissionId = String(form.get("clientSubmissionId") || "").trim();
  const caption = String(form.get("caption") || "").trim().slice(0, 500) || null;
  const incoming = form.get("file");

  if (
    clientSubmissionId.length < 8 ||
    clientSubmissionId.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(clientSubmissionId)
  ) {
    return json(req, { success: false, error: "Invalid submission identifier.", code: "INVALID_SUBMISSION_ID" }, 400);
  }
  if (!(incoming instanceof File)) {
    return json(req, { success: false, error: "Evidence image is required.", code: "FILE_REQUIRED" }, 400);
  }
  if (incoming.size < 1 || incoming.size > MAX_FILE_BYTES) {
    return json(req, { success: false, error: "Evidence file size is outside the allowed range.", code: "INVALID_FILE_SIZE" }, 400);
  }

  let sanitized;
  try {
    sanitized = sanitizeEvidenceWebP(new Uint8Array(await incoming.arrayBuffer()), {
      maxDimension: 4096,
      maxPixels: 16_777_216,
    });
  } catch (error) {
    console.warn("Evidence image validation failed.", error instanceof Error ? error.message : error);
    return json(req, { success: false, error: "Evidence image is not a valid supported WebP image.", code: "INVALID_WEBP" }, 400);
  }

  if (sanitized.bytes.byteLength > MAX_FILE_BYTES) {
    return json(req, { success: false, error: "Sanitized evidence exceeds the allowed size.", code: "SANITIZED_FILE_TOO_LARGE" }, 400);
  }

  const digest = await sha256Hex(sanitized.bytes);
  const fileName = "evidence-" + digest.slice(0, 32) + ".webp";
  const storagePath = "public-submissions/" + clientSubmissionId + "/" + fileName;

  const upload = await service.storage
    .from("complaint-evidence")
    .upload(storagePath, sanitized.bytes, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false,
    });

  const duplicateUpload =
    Boolean(upload.error) &&
    /already exists|duplicate|resource already exists/i.test(String(upload.error?.message || ""));

  if (upload.error && !duplicateUpload) {
    console.error("Sanitized evidence storage upload failed.", upload.error);
    return json(req, { success: false, error: "Evidence upload failed.", code: "EVIDENCE_UPLOAD_FAILED" }, 500);
  }

  const { data: registration, error: registrationError } = await service.rpc(
    "register_public_complaint_evidence",
    {
      p_client_submission_id: clientSubmissionId,
      p_storage_path: storagePath,
      p_file_name: fileName,
      p_file_size_bytes: sanitized.bytes.byteLength,
      p_caption: caption,
    },
  );

  if (registrationError) {
    if (!duplicateUpload) {
      await service.storage.from("complaint-evidence").remove([storagePath]);
    }
    console.error("Sanitized evidence registration failed.", registrationError);
    return json(req, {
      success: false,
      error: "Evidence registration failed.",
      code: registrationError.code || "EVIDENCE_REGISTRATION_FAILED",
    }, 400);
  }

  return json(req, {
    success: true,
    result: registration,
    evidence: {
      fileName,
      storagePath,
      fileSizeBytes: sanitized.bytes.byteLength,
      width: sanitized.width,
      height: sanitized.height,
      metadataChunksRemoved: sanitized.removedChunks,
    },
  });
});
