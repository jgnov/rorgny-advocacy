# Deploy Admin Edge Function via Dashboard (no CLI)

Use this if the Supabase CLI is killed or won't run on your Mac.

## Step 1: Add ADMIN_SECRET

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Edge Functions** (left sidebar) → **Secrets**
3. Add secret: Key = `ADMIN_SECRET`, Value = your admin password (e.g. `rorgnyrocks`)
4. Save

## Step 2: Create the Function

1. In **Edge Functions**, click **Deploy a new function**
2. Choose **Via Editor**
3. Name it: `admin-sends`
4. Replace the template code with this:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const adminSecret = Deno.env.get("ADMIN_SECRET");

    if (!adminSecret) {
      return new Response(
        JSON.stringify({ error: "ADMIN_SECRET not configured. Add it in Edge Functions → Secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    if (password !== adminSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
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
```

5. Click **Deploy function**

The admin panel sends the Supabase anon key in the Authorization header, which satisfies the gateway.

## Done

Your function is live at:
`https://iqkpbuetqfwmmiuwmslt.supabase.co/functions/v1/admin-sends`

The admin panel will use it automatically if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set.
