-- Add recipient_emails column to track which email addresses each message was sent to
alter table public.sends add column if not exists recipient_emails text;
