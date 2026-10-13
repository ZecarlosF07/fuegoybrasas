select jsonb_build_object('currentUser',current_user,'sessionUser',session_user,
  'schemas',(select jsonb_agg(jsonb_build_object('name',nspname,'owner',pg_get_userbyid(nspowner),'acl',nspacl)) from pg_namespace where nspname in ('auth','public','app_private')),
  'roles',(select jsonb_agg(jsonb_build_object('name',rolname,'superuser',rolsuper,'inherit',rolinherit)) from pg_roles where rolname in ('postgres','app_owner','supabase_admin','supabase_auth_admin')));
