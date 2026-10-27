REVOKE ALL ON public.profiles, public.companies, public.company_members FROM anon, PUBLIC;
REVOKE ALL ON public.profiles, public.companies, public.company_members FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.profiles, public.companies, public.company_members TO service_role;