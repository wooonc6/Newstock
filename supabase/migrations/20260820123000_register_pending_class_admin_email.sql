-- Allow a class admin email to be reserved before that account signs up.

create or replace function private.resolve_class_admin_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_user_id uuid;
begin
  new.admin_email := nullif(lower(btrim(new.admin_email)), '');

  if new.admin_email is null then
    new.admin_user_id := null;
    return new;
  end if;

  select au.id into v_admin_user_id
  from auth.users au
  where lower(au.email) = new.admin_email;

  new.admin_user_id := v_admin_user_id;
  return new;
end;
$$;

revoke all on function private.resolve_class_admin_email() from public, anon, authenticated;

create or replace function private.resolve_pending_class_admin_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := nullif(lower(btrim(new.email)), '');
begin
  if v_email is null then
    return new;
  end if;

  update public.classes c
  set admin_user_id = new.id
  where c.admin_email = v_email
    and c.admin_user_id is distinct from new.id;

  return new;
end;
$$;

revoke all on function private.resolve_pending_class_admin_email() from public, anon, authenticated;

drop trigger if exists resolve_pending_class_admin_email on auth.users;
create trigger resolve_pending_class_admin_email
after insert or update of email on auth.users
for each row execute function private.resolve_pending_class_admin_email();

update public.classes c
set admin_user_id = au.id
from auth.users au
where c.admin_email is not null
  and lower(au.email) = c.admin_email
  and c.admin_user_id is distinct from au.id;

update public.classes
set admin_email = 'ai@hana.hs.kr'
where name = '수업1';

comment on column public.classes.admin_email is
  'Enter an existing or future Supabase Auth email here to designate the class administrator.';
