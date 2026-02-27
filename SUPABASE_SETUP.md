# Supabase Setup for Admin Panel

This guide walks you through setting up Supabase so the advocacy site logs sends to a database and the admin panel can display them.

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
  ts timestamptz default now()
);

-- Allow anonymous inserts (the advocacy form needs to log)
alter table public.sends enable row level security;

create policy "Allow anonymous insert"
  on public.sends for insert
  to anon
  with check (true);

-- Allow anonymous select (admin fetches with password gate)
-- If you prefer tighter security, use a Supabase Edge Function instead
create policy "Allow anonymous select"
  on public.sends for select
  to anon
  using (true);
```

## Step 3: Get Your Credentials

1. Go to **Settings** → **API** in the Supabase dashboard
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

## Step 4: Set the Admin Password

Choose a strong password for the admin panel. This becomes `ADMIN_SECRET`.

## Step 5: Add to .env

Add these to your `.env` file:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_SECRET=your_secure_admin_password
```

## Step 6: GitHub Secrets (for deploy)

In your repo **Settings** → **Secrets and variables** → **Actions**, add:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ADMIN_SECRET`

## Step 7: Update Deploy Workflow

Ensure `.github/workflows/deploy.yml` echoes these secrets into `.env`. (The build script already injects them.)

## Accessing the Admin Panel

1. Go to `https://yoursite.com/admin.html` (or `admin.html` locally)
2. Enter the admin password you set as `ADMIN_SECRET`
3. You'll see all sends from Supabase (or localStorage if Supabase isn't configured)

## Security Note

The admin panel uses client-side password check. The Supabase anon key allows read access to the `sends` table. For higher security, consider using a Supabase Edge Function that validates the password server-side and returns data only when authorized.
