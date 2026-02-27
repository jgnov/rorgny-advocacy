# Deploy Admin Edge Function via Dashboard (no CLI)

Use this if the Supabase CLI is killed or won't run on your Mac.

**⚠️ The Edge Function lives on Supabase and is separate from the admin panel.** When we update the code in this repo, you must manually redeploy the function in the Supabase Dashboard (Code tab → paste latest code → Deploy) for changes to take effect.

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
    const pw = (typeof password === "string" ? password : "").trim();
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

## Sync: Redeploy when repo code changes

Whenever `supabase/functions/admin-sends/index.ts` is updated in the repo:

1. Go to **Edge Functions** → **admin-sends**
2. Click the **Code** tab
3. Select all the code in the editor and delete it
4. Copy the full code block from **Step 2** above (lines 19–79) and paste it
5. Click **Deploy function** (or **Deploy updates**)

## Step 3: Test the function

1. On the **admin-sends** function page, click the **Test** tab
2. Set **Request Body** to: `{"password":"your_password"}` (use the exact value you set for ADMIN_SECRET)
3. Click **Send Request**
4. If you get **200** with JSON data → the function works; the admin panel should too
5. If you get **401** → the password doesn’t match. Re-check ADMIN_SECRET in Edge Functions → Secrets (no extra spaces)
6. If you get **500** with "ADMIN_SECRET not configured" → add the secret in Edge Functions → Secrets

## Done

Your function is live at:
`https://iqkpbuetqfwmmiuwmslt.supabase.co/functions/v1/admin-sends`

The admin panel will use it automatically if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set.

## Troubleshooting 401 from admin panel

- **Test works, admin panel gets 401:**  
  1. Redeploy the Edge Function with the latest code above (Sync section).  
  2. In GitHub → **Settings** → **Secrets** → **Actions**, confirm `SUPABASE_URL` and `SUPABASE_ANON_KEY` match your project (Settings → API in Supabase). A wrong anon key makes the gateway return 401 before the request reaches the function.  
  3. In DevTools → Network → failed request → **Response** tab: if the body is `{"error":"Unauthorized"}`, the 401 is from our function (password mismatch). Any other body usually means the gateway rejected the request (wrong key).
