CREATE OR REPLACE FUNCTION private.storage_company(_name text) RETURNS uuid LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN split_part(_name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN split_part(_name,'/',1)::uuid END
$$;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.storage_company(text) TO authenticated;
CREATE POLICY "Members read invoice files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'invoices' AND private.is_company_member(private.storage_company(name)));
CREATE POLICY "Finance roles upload invoice files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices' AND private.has_company_role(private.storage_company(name), ARRAY['owner','admin','finance_manager']::public.company_role[]));
CREATE POLICY "Finance roles delete invoice files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoices' AND private.has_company_role(private.storage_company(name), ARRAY['owner','admin','finance_manager']::public.company_role[]));