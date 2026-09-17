CREATE OR REPLACE FUNCTION public.is_veloiz_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_allowlist a 
    WHERE a.phone = coalesce(auth.jwt()->>'phone','')
  )
$$;
