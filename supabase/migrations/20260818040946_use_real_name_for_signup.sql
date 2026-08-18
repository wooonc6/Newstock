-- New accounts use family name + given name as their public display name.
-- Real names are not unique, so login remains email-only.

drop index if exists public.users_nickname_unique;

drop function if exists public.resolve_login_email(text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := coalesce(new.raw_user_meta_data->>'email', new.email);
  v_last_name text := nullif(btrim(new.raw_user_meta_data->>'last_name'), '');
  v_first_name text := nullif(btrim(new.raw_user_meta_data->>'first_name'), '');
  v_display_name text;
begin
  v_display_name := case
    when v_last_name is not null and v_first_name is not null
      then v_last_name || v_first_name
    else coalesce(
      nullif(btrim(new.raw_user_meta_data->>'nickname'), ''),
      nullif(split_part(coalesce(v_email, ''), '@', 1), '')
    )
  end;

  insert into public.users (id, nickname, email, coins, streak, sessions)
  values (new.id, v_display_name, v_email, 0, 0, 0)
  on conflict (id) do update set
    nickname = excluded.nickname,
    email = excluded.email;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
