# Financial Intelligence redesign
- [x] Rebuilt the page as a decision-support center: health overview with evidence, key insights, unusual-expense detection, spending risks, and prioritized recommendations; removed KPI cards, trend chart, comparison table and category chart that duplicated Financial Reports.
- [x] Added deterministic assessHealth/spendingRisks/recPriority helpers with 7 new tests; kept legacy copy keys so the Reports PDF export is unchanged. 89 tests pass, typecheck clean, build OK.
- [ ] AI Financial Questions section: deferred — requires an approved AI dependency for chat.
- [ ] Verify with live signed-in company data: blocked by unavailable external account session.

# Professional financial reporting
- [x] Extend existing Reports selection, preserving annual summaries and monthly tables.
- [x] Generate bilingual multi-page PDF with charts, statements and reused evidence-based intelligence.
- [x] Verify calendar calculations (11 targeted tests passed) and actual EN annual / AR monthly PDF downloads with isolated fixtures; inspected rendered Arabic text, KPI figures and charts.
- [ ] Verify selected-company reports against live signed-in records: unavailable external account session.
- [x] Advise remixed-project next step: test a monthly download against recorded company transactions.

# Standardized categories
- [x] Add fixed bilingual searchable transaction and invoice selectors without changing historical values; reuse existing company-scoped text fields without a migration.
- [x] Localize stored category references in financial views; 41 targeted tests passed, including English/Arabic income and expense create/edit form requests, legacy preservation, and invoice approval regressions.
- [ ] Verify signed-in create/edit and dashboard/intelligence readback: blocked by unavailable external account session.

# Invoice processing
- [x] Extend existing invoice history, private upload, bilingual review and explicit approval; real AI extraction verified against a labeled test document without saving financial data.
- [ ] Apply minimal invoice migration: blocked by transferred external database lacking management access.
- [ ] Verify signed-in upload/extraction/approval: blocked by unavailable external account session.

# Authentication
- [x] Direct authenticated Login/Signup and landing account actions to Dashboard after session loading; preserve public browsing and recovery. Verified 30 tests and signed-out browser navigation; real signed-in checks remain unavailable for external Supabase.
- [x] Connect all landing Get Started actions to signup when signed out and the app when signed in; reuse existing real Auth flows and preserve design.
- [x] Add bilingual authentication forms, session handling, and protected placeholders.
- [x] Verify validation rules and public navigation; report unavailable checks.
- [x] Verify existing Supabase connection, Auth settings, hosted tables/RLS and signed-out create_company RPC protection without database changes.
- [ ] Verify live sign-up, sign-in, session restoration, logout, recovery and successful company creation: blocked by no existing Auth users or managed test session for this external Supabase connection; confirmation/recovery redirect allowlists also require verification.