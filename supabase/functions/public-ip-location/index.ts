import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const PUBLIC_ORIGINS = new Set([
  "https://shobaikejanao.com",
  "https://www.shobaikejanao.com",
  "https://shihabshajib01-cell.github.io",
]);

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return true;
  if (PUBLIC_ORIGINS.has(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const corsHeaders = (req: Request): Record<string, string> => {
  const origin=req.headers.get("Origin");
  return {
    ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": status === 200 ? "private, max-age=3600" : "no-store",
    },
  });

const getNamedKey = (pluralEnv: string, legacyEnv: string): string => {
  const raw=Deno.env.get(pluralEnv);
  if(raw){
    try {
      const parsed=JSON.parse(raw);
      if(typeof parsed?.default==="string" && parsed.default) return parsed.default;
    } catch {
      // Fall back during API-key migration.
    }
  }
  return Deno.env.get(legacyEnv) ?? "";
};

const isValidIp = (value: string): boolean => {
  if (!value || value.length > 64 || value.includes("%")) return false;

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) {
    return value.split(".").every((part) => {
      const n=Number(part);
      return Number.isInteger(n) && n >= 0 && n <= 255 && String(n) === part.replace(/^0+(?=\d)/, "");
    });
  }

  if (!value.includes(":") || !/^[0-9a-f:]+$/i.test(value)) return false;
  try {
    const parsed=new URL(`http://[${value}]/`);
    return parsed.hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase() === value.toLowerCase();
  } catch {
    return false;
  }
};

const firstForwardedIp = (req: Request): string | null => {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  ];
  for (const candidate of candidates) {
    const value=String(candidate || "").trim();
    if (isValidIp(value)) return value;
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
  const origin=req.headers.get("Origin");
  if(origin && !isAllowedOrigin(origin)){
    return json(req,{ error:"Origin not allowed." },403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "GET") {
    return json(req,{ error: "Method not allowed." }, 405);
  }

  const ip = firstForwardedIp(req);
  if (!ip) {
    return json(req,{ error: "Approximate location unavailable." }, 503);
  }

  const supabaseUrl=Deno.env.get("SUPABASE_URL") ?? "";
  const secretKey=getNamedKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl || !secretKey){
    return json(req,{ error:"Approximate location unavailable." },503);
  }

  try {
    const service=createClient(supabaseUrl,secretKey,{
      auth:{ persistSession:false, autoRefreshToken:false },
    });
    const { data: allowed, error: limitError }=await service.rpc(
      "service_consume_public_edge_rate_limit",
      {
        p_action:"public_ip_location",
        p_ip:ip,
        p_limit:120,
        p_window_seconds:3600,
      }
    );

    if(limitError){
      console.error("[public-ip-location] rate limiter unavailable");
      return json(req,{ error:"Approximate location unavailable." },503);
    }
    if(allowed !== true){
      return json(req,{ error:"Too many location lookups. Please try again later." },429);
    }

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
