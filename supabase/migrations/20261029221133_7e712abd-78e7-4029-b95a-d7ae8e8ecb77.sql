CREATE TYPE public.transaction_type AS ENUM ('income','expense');

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 60),
  description text CHECK (description IS NULL OR char_length(description) <= 300),
  occurred_on date NOT NULL DEFAULT current_date,
  created_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_company_date_idx ON public.transactions(company_id, occurred_on DESC);
REVOKE ALL ON public.transactions FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view transactions" ON public.transactions FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "Finance roles add transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[]));
CREATE POLICY "Finance roles edit transactions" ON public.transactions FOR UPDATE TO authenticated USING (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[])) WITH CHECK (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[]));
CREATE POLICY "Finance roles delete transactions" ON public.transactions FOR DELETE TO authenticated USING (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[]));
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 200),
  file_path text NOT NULL UNIQUE,
  file_size bigint NOT NULL CHECK (file_size >= 0),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 300),
  uploaded_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (split_part(file_path, '/', 1) = company_id::text)
);
CREATE INDEX invoices_company_idx ON public.invoices(company_id, created_at DESC);
REVOKE ALL ON public.invoices FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view invoices" ON public.invoices FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "Finance roles add invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[]));
CREATE POLICY "Finance roles delete invoices" ON public.invoices FOR DELETE TO authenticated USING (private.has_company_role(company_id, ARRAY['owner','admin','finance_manager']::company_role[]));
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();