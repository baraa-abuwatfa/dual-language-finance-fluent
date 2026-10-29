# Invoice processing activation

## Current state
- The existing Invoices page, private uploads, history, bilingual review and confirmation controls are implemented.
- A real AI extraction call returned the expected fields from a labeled test image. No invoice or transaction was added during this check.
- Hosted review fields are missing (`invoices.status` returned PostgreSQL error 42703).
- This transferred project cannot access database-management tools or mint a signed-in session. No hosted schema, RLS, bucket, user, or company was changed.

## Required activation
An administrator of the existing Supabase project `tpjqwnfxwkhsdzpkylak` must review and run `docs/invoice-processing-setup.sql` in that project's SQL editor, or reconnect that existing project through Lovable Settings → General → External Supabase so its migration can be applied through the supported workflow. Do not enable a new database.

The SQL extends the existing invoices table with review fields, statuses, duplicate identity index and transaction link. An authenticated RPC authorizes active finance roles and atomically creates a single linked expense on explicit approval. Existing read and storage policies remain; direct review/approval writes are restricted. Approved invoice history cannot be deleted through the ordinary user interface.

No additional AI credentials are needed in the current workspace: its server-held Lovable AI key successfully processed a test document. Published extraction still needs verification. AI usage consumes workspace credits. Denied or credit-blocked extraction is persisted and blocks further AI processing within the company; an administrator must restore access and deliberately clear the relevant error state before a new extraction action. Manual review remains possible.

## Checks still required after activation
1. Sign in as a finance-role company member and upload a real invoice.
2. Extract, edit and save the review; confirm no expense exists yet.
3. Explicitly confirm; verify exactly one linked expense and updated dashboard expenses/net profit/charts.
4. Retry confirmation and duplicate supplier/number review; verify no second expense is inserted.
5. Verify viewer read-only behavior and cross-company denial with separate accounts.
6. Inspect the full review form in Arabic RTL and English LTR on mobile and desktop.

Different-currency invoices are blocked from expense recording because transactions currently use company currency and no currency conversion is configured. No amounts are silently converted.