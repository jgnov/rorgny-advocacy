import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_SITE_TAGS = ["state2026", "city2026"] as const;
type SiteTag = (typeof ALLOWED_SITE_TAGS)[number];

function isSiteTag(s: string): s is SiteTag {
  return (ALLOWED_SITE_TAGS as readonly string[]).includes(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const pw = (typeof body.password === "string" ? body.password : "").trim();
    const siteTagRaw = (typeof body.siteTag === "string" ? body.siteTag : "").trim();
    const adminSecret = Deno.env.get("ADMIN_SECRET")?.trim();

    if (!adminSecret) {
      return new Response(
        JSON.stringify({ error: "ADMIN_SECRET not configured. Add it in Edge Functions → Secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    if (pw !== adminSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (!isSiteTag(siteTagRaw)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing siteTag" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("sends")
      .select("*")
      .eq("site_tag", siteTagRaw)
      .order("ts", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(JSON.stringify(data ?? []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
