-- PENDING: apply to the EXISTING database only, using its SQL editor.
-- Database management is unavailable in this transferred Lovable project.
-- This script has NOT been applied or verified on the hosted database.
BEGIN;
ALTER TABLE public.invoices
  ADD COLUMN status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','needs_review','approved','failed')),
  ADD COLUMN supplier_name text CHECK (char_length(btrim(supplier_name)) BETWEEN 1 AND 200),
  ADD COLUMN invoice_number text CHECK (char_length(btrim(invoice_number)) BETWEEN 1 AND 100),
  ADD COLUMN invoice_date date, ADD COLUMN due_date date,
  ADD COLUMN currency text CHECK (currency ~ '^[A-Z]{3}$'),
  ADD COLUMN subtotal numeric(14,2) CHECK (subtotal >= 0),
  ADD COLUMN tax_amount numeric(14,2) CHECK (tax_amount >= 0),
  ADD COLUMN total_amount numeric(14,2) CHECK (total_amount > 0),
  ADD COLUMN expense_category text CHECK (char_length(btrim(expense_category)) BETWEEN 1 AND 60),
  ADD COLUMN processing_error text, ADD COLUMN error_code text,
  ADD COLUMN transaction_id uuid UNIQUE REFERENCES public.transactions(id) ON DELETE RESTRICT,
  ADD COLUMN approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN approved_at timestamptz,
  ADD CONSTRAINT invoice_approved_link CHECK ((status = 'approved') = (transaction_id IS NOT NULL)),
  ADD CONSTRAINT invoice_balanced CHECK (subtotal IS NULL OR tax_amount IS NULL OR total_amount IS NULL OR abs(subtotal + tax_amount - total_amount) <= 0.01);
CREATE UNIQUE INDEX invoices_company_supplier_number_unique ON public.invoices (
  company_id, lower(regexp_replace(supplier_name, '\s+', '', 'g')), lower(regexp_replace(invoice_number, '\s+', '', 'g'))
) WHERE supplier_name IS NOT NULL AND invoice_number IS NOT NULL;
REVOKE UPDATE, INSERT ON public.invoices FROM authenticated;
GRANT INSERT (company_id, file_name, file_path, file_size, notes) ON public.invoices TO authenticated;
-- Preserve approved history so deleting an invoice cannot bypass duplicate protection.
CREATE POLICY "Keep approved invoice history" ON public.invoices AS RESTRICTIVE
FOR DELETE TO authenticated USING (status <> 'approved');

CREATE FUNCTION public.manage_invoice(_id uuid, _action text, _data jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inv public.invoices%ROWTYPE; new_transaction uuid; company_currency text;
BEGIN
  SELECT * INTO inv FROM public.invoices WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR NOT private.has_company_role(inv.company_id, ARRAY['owner','admin','finance_manager']::public.company_role[]) THEN
    RAISE EXCEPTION 'invoice_not_accessible' USING ERRCODE = '42501';
  END IF;
  IF inv.status = 'approved' THEN
    IF _action = 'approve' THEN RETURN inv.transaction_id; END IF;
    RAISE EXCEPTION 'invoice_already_approved';
  END IF;
  IF _action = 'start' THEN
    IF inv.status = 'processing' THEN RAISE EXCEPTION 'already_processing'; END IF;
    IF inv.error_code IN ('402','403') THEN RAISE EXCEPTION 'extraction_paused'; END IF;
    UPDATE public.invoices SET status = 'processing', processing_error = NULL, error_code = NULL WHERE id = _id;
    RETURN _id;
  ELSIF _action = 'fail' THEN
    IF inv.status <> 'processing' THEN RAISE EXCEPTION 'invalid_processing_state'; END IF;
    UPDATE public.invoices SET status = 'failed', processing_error = left(_data->>'message', 1000), error_code = left(_data->>'code', 100) WHERE id = _id;
    RETURN _id;
  ELSIF _action IN ('review','extracted') THEN
    IF _action = 'extracted' AND inv.status <> 'processing' THEN RAISE EXCEPTION 'invalid_processing_state'; END IF;
    IF _action = 'review' AND (
      nullif(btrim(_data->>'supplier_name'), '') IS NULL OR nullif(btrim(_data->>'invoice_number'), '') IS NULL
      OR nullif(_data->>'invoice_date', '') IS NULL OR nullif(_data->>'currency', '') IS NULL
      OR nullif(_data->>'expense_category', '') IS NULL OR _data->>'subtotal' IS NULL
      OR _data->>'tax_amount' IS NULL OR _data->>'total_amount' IS NULL
    ) THEN RAISE EXCEPTION 'incomplete_review'; END IF;
    UPDATE public.invoices SET
      supplier_name = nullif(btrim(_data->>'supplier_name'), ''), invoice_number = nullif(btrim(_data->>'invoice_number'), ''),
      invoice_date = nullif(_data->>'invoice_date','')::date, due_date = nullif(_data->>'due_date','')::date,
      currency = nullif(upper(btrim(_data->>'currency')), ''), subtotal = (_data->>'subtotal')::numeric,
      tax_amount = (_data->>'tax_amount')::numeric, total_amount = (_data->>'total_amount')::numeric,
      expense_category = nullif(btrim(_data->>'expense_category'), ''), status = 'needs_review',
      processing_error = CASE WHEN error_code IN ('402','403') THEN processing_error ELSE NULL END,
      error_code = CASE WHEN error_code IN ('402','403') THEN error_code ELSE NULL END
    WHERE id = _id;
    RETURN _id;
  ELSIF _action = 'approve' THEN
    IF inv.status <> 'needs_review' OR inv.supplier_name IS NULL OR inv.invoice_number IS NULL
      OR inv.invoice_date IS NULL OR inv.currency IS NULL OR inv.subtotal IS NULL OR inv.tax_amount IS NULL
      OR inv.total_amount IS NULL OR inv.expense_category IS NULL THEN RAISE EXCEPTION 'incomplete_review'; END IF;
    SELECT upper(btrim(primary_currency)) INTO company_currency FROM public.companies WHERE id = inv.company_id;
    IF inv.currency <> company_currency THEN RAISE EXCEPTION 'currency_mismatch'; END IF;
    INSERT INTO public.transactions(company_id, type, amount, category, description, occurred_on, created_by)
    VALUES (inv.company_id, 'expense', inv.total_amount, inv.expense_category,
      left(inv.supplier_name || ' · ' || inv.invoice_number, 300), inv.invoice_date, auth.uid()) RETURNING id INTO new_transaction;
    UPDATE public.invoices SET status = 'approved', transaction_id = new_transaction, approved_by = auth.uid(), approved_at = now() WHERE id = _id;
    RETURN new_transaction;
  END IF;
  RAISE EXCEPTION 'invalid_invoice_action';
END;
$$;
REVOKE ALL ON FUNCTION public.manage_invoice(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_invoice(uuid, text, jsonb) TO authenticated;
COMMIT;