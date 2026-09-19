import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  const ip = firstForwardedIp(req);
  if (!ip) {
    return json({ error: "Approximate location unavailable." }, 503);
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
      return json({ error: "Approximate location unavailable." }, 503);
    }

    const data = await response.json();
    if (data?.success === false || !validCoordinate(data?.latitude, data?.longitude)) {
      return json({ error: "Approximate location unavailable." }, 503);
    }

    return json({
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 25000,
      city: typeof data.city === "string" ? data.city : undefined,
      region: typeof data.region === "string" ? data.region : undefined,
      country: typeof data.country === "string" ? data.country : undefined,
    });
  } catch {
    return json({ error: "Approximate location unavailable." }, 503);
  }
});
