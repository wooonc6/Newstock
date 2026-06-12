-- Enable nickname login and nickname-based ranking display.
-- Run this in Supabase SQL Editor after the base schema.

alter table public.users
  add column if not exists email text;

create unique index if not exists users_nickname_unique
  on public.users (lower(nickname))
  where nickname is not null;

create unique index if not exists users_email_unique
  on public.users (lower(email))
  where email is not null;

update public.users as u
set email = au.email
from auth.users as au
where u.id = au.id
  and u.email is null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nickname, email)
  values (
    new.id,
    new.raw_user_meta_data->>'nickname',
    coalesce(new.raw_user_meta_data->>'email', new.email)
  )
  on conflict (id) do update set
    nickname = excluded.nickname,
    email = excluded.email;

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.resolve_login_email(login_nickname text)
returns text as $$
  select email
  from public.users
  where lower(nickname) = lower(login_nickname)
  limit 1;
$$ language sql stable security definer;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

drop policy if exists "ranking read" on public.users;
create policy "ranking read" on public.users
  for select
  using (auth.role() = 'authenticated');
