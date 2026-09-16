CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;
ALTER FUNCTION public.is_veloiz_admin() SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.is_veloiz_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION private.is_veloiz_admin() FROM PUBLIC, anon;
