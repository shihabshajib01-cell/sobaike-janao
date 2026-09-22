import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ALLOWED_ORIGINS = new Set([
  "https://shobaikejanao.com",
  "https://www.shobaikejanao.com",
  "https://shihabshajib01-cell.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const MAX_REQUEST_BYTES = 262_144;

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

const firstForwardedIp = (req: Request): string | null => {
  // Trust only managed edge headers. Never fall back to client-controlled
  // X-Forwarded-For for abuse/rate-limit identity.
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
  ];
  for (const candidate of candidates) {
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
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("sobaike-public-write-v1:" + value)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

type PublicWriteBody =
  | {
      action: "complaint";
      submissionRpc: "submit_public_complaint_v2" | "submit_public_complaint_v3" | "submit_public_configured_complaint";
      payload: Record<string, unknown>;
      clientSubmissionId: string;
      reporterContext: Record<string, unknown>;
    }
  | {
      action: "response";
      reportId: string;
      responseType: "citizen_information" | "subject_response";
      payload: Record<string, unknown>;
      visitorId: string;
      sessionId: string;
    }
  | {
      action: "engagement";
      reportId: string;
      eventType: "view" | "share";
      visitorId: string;
      sessionId: string;
    }
  | {
      action: "evidence";
      clientSubmissionId: string;
      storagePath: string;
      fileName: string;
      fileSizeBytes: number;
      caption?: string | null;
    }
  | {
      action: "session";
      payload: Record<string, unknown>;
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
    return json(req, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json(req, { error: "Request payload is too large.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, { error: "Service unavailable.", code: "CONFIG_ERROR" }, 503);
  }

  const sourceIp = firstForwardedIp(req);
  if (!sourceIp) {
    return json(req, { error: "Unable to verify request source.", code: "SOURCE_UNAVAILABLE" }, 503);
  }

  let rawBody: Uint8Array;
  try {
    rawBody = new Uint8Array(await req.arrayBuffer());
  } catch {
    return json(req, { error: "Invalid request body.", code: "INVALID_BODY" }, 400);
  }

  if (rawBody.byteLength > MAX_REQUEST_BYTES) {
    return json(req, { error: "Request payload is too large.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let body: PublicWriteBody;
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return json(req, { error: "Invalid JSON request.", code: "INVALID_JSON" }, 400);
  }

  if (!body || !["complaint", "evidence", "response", "engagement", "session"].includes(String((body as any).action))) {
    return json(req, { error: "Invalid public write action.", code: "INVALID_ACTION" }, 400);
  }

  const sourceFingerprint = await hmacHex(serviceRoleKey, sourceIp);
  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: limitData, error: limitError } = await service.rpc(
    "service_assert_public_write_rate",
    {
      p_source_fingerprint: sourceFingerprint,
      p_action: body.action,
    }
  );

  if (limitError) {
    console.error("Public write limiter failed.", limitError);
    return json(req, { error: "Request validation failed.", code: "RATE_LIMIT_CHECK_FAILED" }, 503);
  }

  if (limitData?.allowed !== true) {
    return json(req, {
      success: false,
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
      retryAfterSeconds: Number(limitData?.retryAfterSeconds || 60),
    });
  }

  if (body.action === "evidence") {
    const { data, error } = await service.rpc("register_public_complaint_evidence", {
      p_client_submission_id: body.clientSubmissionId,
      p_storage_path: body.storagePath,
      p_file_name: body.fileName,
      p_file_size_bytes: body.fileSizeBytes,
      p_caption: body.caption ?? null,
    });
    if (error) {
      return json(req, { success: false, error: error.message, code: error.code || "EVIDENCE_REGISTRATION_FAILED" });
    }
    return json(req, { success: true, result: data });
  }

  if (body.action === "session") {
    const { data, error } = await service.rpc("record_public_visit_session", body.payload);
    if (error) {
      return json(req, { success: false, error: error.message, code: error.code || "SESSION_RECORD_FAILED" });
    }
    return json(req, { success: true, result: data });
  }

  if (body.action === "engagement") {
    const { data, error } = await service.rpc("track_public_report_engagement", {
      p_report_id: body.reportId,
      p_event_type: body.eventType,
      p_visitor_id: body.visitorId,
      p_session_id: body.sessionId,
    });
    if (error) {
      return json(req, { success: false, error: error.message, code: error.code || "ENGAGEMENT_FAILED" });
    }
    return json(req, { success: true, result: data });
  }

  if (body.action === "response") {
    const { data, error } = await service.rpc("submit_public_response_v2", {
      p_report_id: body.reportId,
      p_response_type: body.responseType,
      p_payload: body.payload,
      p_visitor_id: body.visitorId,
      p_session_id: body.sessionId,
    });
    if (error) {
      return json(req, { success: false, error: error.message, code: error.code || "RESPONSE_FAILED" });
    }
    return json(req, { success: true, result: data });
  }

  const allowedSubmissionRpcs = new Set([
    "submit_public_complaint_v2",
    "submit_public_complaint_v3",
    "submit_public_configured_complaint",
  ]);
  if (!allowedSubmissionRpcs.has(body.submissionRpc)) {
    return json(req, { success: false, error: "Invalid submission route.", code: "INVALID_SUBMISSION_ROUTE" });
  }

  const { data, error } = await service.rpc(body.submissionRpc, {
    p_payload: body.payload,
    p_client_submission_id: body.clientSubmissionId,
    p_reporter_context: body.reporterContext,
  });
  if (error) {
    return json(req, { success: false, error: error.message, code: error.code || "SUBMISSION_FAILED" });
  }

  return json(req, { success: true, result: data });
});
