-- Tag sends per property: state (RORGNY) vs city (Advocacy 2). Run in SQL Editor if not using CLI migrations.
alter table public.sends
  add column if not exists site_tag text not null default 'state2026';

alter table public.sends
  drop constraint if exists sends_site_tag_allowed;

alter table public.sends
  add constraint sends_site_tag_allowed
  check (site_tag in ('state2026', 'city2026'));
