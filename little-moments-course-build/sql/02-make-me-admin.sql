-- OPTIONAL. Run AFTER 01-new-project.sql and AFTER signing in to the app once.
-- Supabase > Authentication > Users: copy YOUR user UID.
-- Paste it below between the quotes, replacing PASTE_YOUR_USER_UUID_HERE.
-- This is a user ID, not any kind of API key or OAuth client ID.

do $$
declare
  owner_id uuid := 'PASTE_YOUR_USER_UUID_HERE';
begin
  if not exists(select 1 from public.profiles where id=owner_id) then
    raise exception 'User not found. Sign in to the app first and copy the UID from Authentication > Users.';
  end if;
  insert into public.admins(user_id) values(owner_id) on conflict do nothing;
end $$;

-- Then refresh the app. Admin panel appears after the account reloads.
-- A normal user cannot run this through the website or give themselves admin access.
