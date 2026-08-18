-- Create the first class without exposing its generated code in source control.
-- Later, set admin_email in the classes table to a registered account email.

alter table public.classes
  add column admin_email text;

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

  if v_admin_user_id is null then
    raise exception 'No registered user found for admin email' using errcode = 'P0002';
  end if;

  new.admin_user_id := v_admin_user_id;
  return new;
end;
$$;

revoke all on function private.resolve_class_admin_email() from public, anon, authenticated;

create trigger resolve_class_admin_email
before insert or update of admin_email on public.classes
for each row execute function private.resolve_class_admin_email();

insert into public.classes (name)
values ('수업1');

comment on column public.classes.admin_email is
  'Enter an existing Supabase Auth email here to designate the class administrator.';
