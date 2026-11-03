-- READ-ONLY CHECKS. Run in SQL Editor after 01-new-project.sql.
-- Expect six tables, each with row_security_enabled = true.
select tablename, rowsecurity as row_security_enabled
from pg_tables
where schemaname='public'
and tablename in ('profiles','admins','memories','memory_shares','announcements','admin_audit')
order by tablename;

-- Expect a PRIVATE bucket, public=false, file_size_limit=10485760.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id='memory-files';

-- Expect the new-user profile trigger.
select trigger_name from information_schema.triggers
where event_object_schema='auth' and event_object_table='users'
and trigger_name='on_auth_user_created';

-- Lists access policies. Never turn off RLS or make the bucket public to fix a login error.
select schemaname,tablename,policyname,roles,cmd
from pg_policies
where (schemaname='public' and tablename in ('profiles','admins','memories','memory_shares','announcements','admin_audit'))
or (schemaname='storage' and policyname in ('files_read','files_insert','files_delete'))
order by schemaname,tablename,policyname;
