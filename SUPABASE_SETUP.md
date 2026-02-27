# Supabase Setup for Admin Panel

This guide walks you through setting up Supabase so the advocacy site logs sends to a database and the admin panel can display them. The admin password is validated **server-side** by an Edge Function — it never appears in the client code.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name it (e.g. `rorgny-advocacy`) and set a database password
4. Choose a region and create the project

## Step 2: Create the `sends` Table

1. In the Supabase dashboard, go to **SQL Editor**
2. Run this SQL:

```sql
create table public.sends (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  legislators text,
  recipient_emails text,
  ts timestamptz default now()
);

alter table public.sends enable row level security;

-- Allow anonymous inserts (the advocacy form logs from the browser)
create policy "Allow anonymous insert"
  on public.sends for insert to anon with check (true);

-- NO anon select — only the Edge Function (service role) can read
```

If you previously created a policy "Allow anonymous select", remove it:

```sql
drop policy if exists "Allow anonymous select" on public.sends;
```

**Add `recipient_emails`** (required for admin panel to show "To" emails). Run in **SQL Editor**:

```sql
alter table public.sends add column if not exists recipient_emails text;
```

## Step 3: Deploy the Admin Edge Function

The admin panel fetches data through an Edge Function that validates your password on the server. The password is never sent to the browser.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if needed
2. Log in and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   (Find your project ID in the dashboard URL or under **Settings** → **General**)
3. Set your admin password as a Supabase secret:
   ```bash
   supabase secrets set ADMIN_SECRET=your_secure_admin_password
   ```
4. Deploy the Edge Function:
   ```bash
   supabase functions deploy admin-sends --no-verify-jwt
   ```

The function is available at `https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-sends`.

## Step 4: Get Your Credentials

1. Go to **Settings** → **API** in the Supabase dashboard
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Legacy anon key** (Settings → API → Legacy API Keys) → `SUPABASE_ANON_KEY`. Use the JWT that starts with `eyJ`, not the `sb_publishable_xxx` key — Edge Functions require the legacy anon key.

## Step 5: Add to .env

Add these to your `.env` file:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

`ADMIN_SECRET` lives only in Supabase secrets (Step 3), not in `.env` or the repo.

## Step 6: GitHub Secrets (for deploy)

In your repo **Settings** → **Secrets and variables** → **Actions**, add:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

(Do **not** add `ADMIN_SECRET` to GitHub — it stays in Supabase.)

## Step 7: Build and Deploy

Run `npm run build` and push. The deploy workflow injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` into the built files.

## Accessing the Admin Panel

1. Go to `https://yoursite.com/admin.html` (or `dist/admin.html` locally)
2. Enter the admin password you set in Step 3
3. Data is fetched via the Edge Function; the password is never exposed in the page source

## Security

- The admin password is validated by the Edge Function on Supabase’s servers
- `sends` has no anon select policy — only the Edge Function (with service role) can read
- `ADMIN_SECRET` is stored in Supabase project secrets, not in your code or GitHub
