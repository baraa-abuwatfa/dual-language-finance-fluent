CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.is_company_member(uuid) SET SCHEMA private;
ALTER FUNCTION public.has_company_role(uuid, public.company_role[]) SET SCHEMA private;
ALTER FUNCTION public.shares_company_with(uuid) SET SCHEMA private;