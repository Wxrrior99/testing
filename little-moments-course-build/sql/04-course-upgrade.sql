-- Run AFTER 01-new-project.sql. Additive upgrade for existing accounts/data.
begin;
alter table public.profiles add column username text unique;
alter table public.profiles add column dark_mode boolean not null default false;
alter table public.profiles add constraint username_format check(username is null or (username ~ '^[a-z][a-z0-9_]{2,23}$' and username not in ('admin','administrator','moderator','mod','support','system')));
grant update(dark_mode) on public.profiles to authenticated;
create table public.moderators(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.reports(id uuid primary key default gen_random_uuid(),memory_id uuid references public.memories(id) on delete cascade,reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,reason text not null check(char_length(trim(reason)) between 1 and 500),created_at timestamptz not null default now());
create table public.hidden_posts(memory_id uuid primary key references public.memories(id) on delete cascade,actor_id uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());
create table public.blocked_users(user_id uuid primary key references auth.users(id) on delete cascade,actor_id uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());
create table public.moderation_log(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,memory_id uuid,action text not null,created_at timestamptz not null default now());
alter table public.moderators enable row level security;
alter table public.reports enable row level security;
alter table public.hidden_posts enable row level security;
alter table public.blocked_users enable row level security;
alter table public.moderation_log enable row level security;
revoke all on public.moderators,public.reports,public.hidden_posts,public.blocked_users,public.moderation_log from anon,authenticated;
create function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$ select public.active_user() and (public.is_admin() or exists(select 1 from public.moderators where user_id=auth.uid())) $$;
create function public.can_post() returns boolean language sql stable security definer set search_path='' as $$ select public.active_user() and exists(select 1 from public.profiles where id=auth.uid() and username is not null) and not exists(select 1 from public.blocked_users where user_id=auth.uid()) $$;
create function public.is_shared(mid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.memory_shares where memory_id=mid) $$;
create or replace function public.can_read_memory(mid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.active_user() and exists(select 1 from public.memories m where m.id=mid and (m.user_id=auth.uid() or (public.is_staff() and public.is_shared(mid)) or (m.deleted_at is null and not exists(select 1 from public.hidden_posts where memory_id=mid) and exists(select 1 from public.profiles p where p.id=m.user_id and not p.suspended) and exists(select 1 from public.memory_shares s where s.memory_id=mid and s.recipient_id=auth.uid()))))
$$;
drop policy memories_insert on public.memories;
create policy memories_insert on public.memories for insert to authenticated with check(user_id=auth.uid() and public.can_post());
drop policy shares_insert on public.memory_shares;
create policy shares_insert on public.memory_shares for insert to authenticated with check(public.owns_memory(memory_id) and public.can_post() and recipient_id<>auth.uid());
grant select on public.moderators,public.reports,public.hidden_posts,public.blocked_users,public.moderation_log to authenticated;
create policy moderators_read on public.moderators for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy reports_read on public.reports for select to authenticated using(public.is_staff());
create policy hidden_read on public.hidden_posts for select to authenticated using(public.is_staff() or public.owns_memory(memory_id));
create policy blocked_read on public.blocked_users for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy moderation_log_read on public.moderation_log for select to authenticated using(public.is_admin());
create function public.choose_username(chosen text) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.active_user() then raise exception 'Sign in first';end if;
 if exists(select 1 from public.profiles where id=auth.uid() and username is not null) then raise exception 'Username already chosen';end if;
 update public.profiles set username=lower(trim(chosen)),display_name=lower(trim(chosen)) where id=auth.uid();
end $$;
-- Once selected, the username is the display name; clients cannot impersonate another name.
revoke update(display_name) on public.profiles from authenticated;
create function public.author_name(mid uuid) returns text language sql stable security definer set search_path='' as $$ select p.username from public.memories m join public.profiles p on p.id=m.user_id where m.id=mid and public.can_read_memory(mid) $$;
create function public.report_memory(mid uuid,explanation text) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.active_user() or not public.can_read_memory(mid) then raise exception 'Memory unavailable';end if;
 insert into public.reports(memory_id,reporter_id,reason) values(mid,auth.uid(),trim(explanation));end $$;
create function public.set_moderator(target uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.is_admin() then raise exception 'Administrator required';end if;
 if enabled then insert into public.moderators values(target) on conflict do nothing;else delete from public.moderators where user_id=target;end if;
 insert into public.moderation_log(actor_id,action) values(auth.uid(),case when enabled then 'add moderator ' else 'remove moderator ' end||target::text);end $$;
create function public.set_blocked(target uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.is_admin() or target=auth.uid() or exists(select 1 from public.admins where user_id=target) then raise exception 'Not permitted';end if;
 if enabled then insert into public.blocked_users(user_id,actor_id) values(target,auth.uid()) on conflict do nothing;else delete from public.blocked_users where user_id=target;end if;
 insert into public.moderation_log(actor_id,action) values(auth.uid(),case when enabled then 'block ' else 'unblock ' end||target::text);end $$;
create function public.moderate_memory(mid uuid,operation text) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.is_staff() or not public.is_shared(mid) then raise exception 'Shared memory and staff access required';end if;
 if operation='hide' then insert into public.hidden_posts(memory_id,actor_id) values(mid,auth.uid()) on conflict do nothing;
 elsif operation='restore' then delete from public.hidden_posts where memory_id=mid;
 elsif operation='delete' then delete from public.memories where id=mid;
 else raise exception 'Invalid moderation action';end if;
 insert into public.moderation_log(actor_id,memory_id,action) values(auth.uid(),mid,operation);end $$;
-- Moderators can remove shared files but cannot upload files or change anyone's writing.
drop policy files_delete on storage.objects;
create policy files_delete on storage.objects for delete to authenticated using(bucket_id='memory-files' and (public.file_access(name,true) or (public.is_staff() and public.is_shared(split_part(name,'/',2)::uuid))));
revoke execute on function public.is_staff(),public.can_post(),public.is_shared(uuid),public.choose_username(text),public.author_name(uuid),public.report_memory(uuid,text),public.set_moderator(uuid,boolean),public.set_blocked(uuid,boolean),public.moderate_memory(uuid,text) from public,anon,authenticated;
grant execute on function public.is_staff(),public.can_post(),public.is_shared(uuid),public.choose_username(text),public.author_name(uuid),public.report_memory(uuid,text),public.set_moderator(uuid,boolean),public.set_blocked(uuid,boolean),public.moderate_memory(uuid,text) to authenticated;
commit;
