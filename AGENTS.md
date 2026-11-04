<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Database
- Fixed categories use stable English references in existing company-scoped transaction.category and invoice.expense_category text fields, with labels resolved only for display; legacy values are preserved and new invoice approvals require a predefined expense category. Why: avoids schema changes and language-dependent stored identities without altering historical records.
- Invoice review extends existing invoices and uses an authenticated atomic approval RPC; invoice and transaction caches share company-scoped invalidation. Why: approval retries cannot create multiple expenses and dashboard totals use recorded transactions only.
- Pending external-database invoice SQL is documented in docs/invoice-processing-setup.sql, not claimed as an applied migration. Why: this transferred project has no managed database migration access.
- Multi-company access is enforced in Postgres RLS via `private.*` security-definer helpers keyed on `auth.uid()`; companies are created only through `public.create_company()` so the creator becomes owner atomically. Why: keeps tenant isolation in the database, not app code.
- New public tables must explicitly REVOKE anon/PUBLIC and grant only needed privileges. Why: this Supabase project's default privileges grant ALL to anon/authenticated.
- Exported report PDFs are also archived client-side to the private `financial-reports` bucket at `company_id/year/month/monthly-report.pdf` (annual: `company_id/year/annual-report.pdf`) with an upserted `public.report_files` row keyed on (company_id, report_type, year, month; month 0 = annual). Why: re-exports replace instead of duplicating, and the company id as first path segment lets `private.storage_company(name)` enforce tenant isolation; pending SQL lives in docs/financial-reports-storage-setup.sql.

## Authentication
- Reports use a report-only paginated company-scoped transaction query and the existing intelligence engine with an optional calendar comparison range; PDF pages are rendered locally with a bundled Arabic font and embedded through pdf-lib. Why: complete reporting without truncation, duplicated analysis, server costs or broken Arabic shaping; existing intelligence defaults remain unchanged.
- Reuse the generated Supabase client, one root AuthProvider listener, and the client-only `_authenticated` route gate; private membership reads use authenticated server functions and the bearer middleware. Why: prevents duplicate sessions, SSR login loops, and unprotected private reads.
- Authentication copy extends the existing locale context through typed bilingual auth dictionaries; shared forms and shells serve all public auth pages. Why: keeps languages and validation consistent without duplicating screens.
- Dashboard is the authenticated entry and reuses existing company-status placeholders; only active memberships determine its setup, single-company or unselected-company state, and /workspace redirects there. Why: provides one session-aware entry without inventing memberships or choosing a tenant.

## Integrations
- The n8n monthly-report integration uses `/api/public/reports/*` server routes (token via `x-report-token` = `N8N_REPORT_TOKEN`) plus the owner-only `requestMonthlyReport` server function, not Supabase Edge Functions. Why: this TanStack project blocks creating new Edge Functions, and the routes give the same contract with automatic deployment; setup lives in docs/n8n-monthly-report-setup.md.
