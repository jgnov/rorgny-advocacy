-- Remove anon select so only the Edge Function (service role) can read sends
drop policy if exists "Allow anonymous select" on public.sends;
