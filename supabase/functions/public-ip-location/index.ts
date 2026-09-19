import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://shobaikejanao.com",
  "https://www.shobaikejanao.com",
  "https://shihabshajib01-cell.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const corsHeadersFor = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
};

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const rateState = new Map<string, { count: number; resetAt: number }>();

const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const current = rateState.get(key);
  if (!current || current.resetAt <= now) {
    rateState.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "application/json",
      "Cache-Control": status === 200 ? "private, max-age=3600" : "no-store",
    },
  });

const firstForwardedIp = (req: Request): string | null => {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return null;
};

const validCoordinate = (latitude: unknown, longitude: unknown): boolean =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180 &&
  !(latitude === 0 && longitude === 0);

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json(req,{ error: "Method not allowed." }, 405);
  }

  const ip = firstForwardedIp(req);
  if (!ip || ip.length > 64 || /[\r\n]/.test(ip)) {
    return json(req,{ error: "Approximate location unavailable." }, 503);
  }

  if (isRateLimited(ip)) {
    return json(req,{ error: "Too many requests." }, 429);
  }

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,message,country,region,city,latitude,longitude`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3500),
      }
    );

    if (!response.ok) {
      return json(req,{ error: "Approximate location unavailable." }, 503);
    }

    const data = await response.json();
    if (data?.success === false || !validCoordinate(data?.latitude, data?.longitude)) {
      return json(req,{ error: "Approximate location unavailable." }, 503);
    }

    return json(req,{
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 25000,
      city: typeof data.city === "string" ? data.city : undefined,
      region: typeof data.region === "string" ? data.region : undefined,
      country: typeof data.country === "string" ? data.country : undefined,
    });
  } catch {
    return json(req,{ error: "Approximate location unavailable." }, 503);
  }
});
