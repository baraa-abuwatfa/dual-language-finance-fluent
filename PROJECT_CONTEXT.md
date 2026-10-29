# AI CFO — Project Context

## Project
AI CFO: an AI-powered financial analysis and decision-support platform for small businesses.

## Stack
Lovable (frontend), Supabase (database/auth), n8n Cloud (automation workflows).

## Design
- Light backgrounds with navy, steel blue, blue-gray, and beige.
- Subtle animations only.
- Responsive layouts for mobile, tablet, and desktop.

## Languages
- Complete Arabic (RTL) and English (LTR) support.
- Numbers, amounts, and percentages render left-to-right inside Arabic text (e.g. "34%", never "%34").

## Planned features
Landing page, authentication, financial dashboard, transactions, CSV import, accurate financial calculations, alerts, evidence-based AI insights, recommendations, and action tracking.

## Security
- Company-level data isolation enforced with Row Level Security (RLS).
- No privileged secrets in frontend code.

## Financial integrity
- Financial metrics are calculated deterministically (never by AI guesswork).
- Never automatically delete suspected duplicate transactions.
- Never automatically execute payments.

## Current status
- Frontend: Phase 1 landing page done (EN/AR, RTL/LTR, responsive). Frontend work continues.
- Percentage formatting in Arabic RTL mobile: verified rendering as "34%".
- Existing external Supabase connection verified at project ref `tpjqwnfxwkhsdzpkylak`; its dashboard project name was not available for verification. Hosted profiles, companies and company_members tables have RLS enabled. The existing create_company RPC is executable by authenticated users and denied to anonymous users; no database changes were made.
- Bilingual authentication screens, single session listener, protected routes and company-state placeholders implemented. Live checks confirmed Auth availability, email signup enabled with confirmation required, and signed-out table/RPC access blocked. Client session persistence and refresh are enabled, but authenticated sign-in, session restoration, logout and successful company creation remain unverified: there are no existing Auth users and this external connection cannot supply a managed test session. Confirmation/recovery redirect allowlists remain unverified. Financial modules and n8n are not started.
- Company setup form calls the existing create_company RPC and redirects to the dashboard; dashboard shows Revenue, Expenses, Net Profit, chart and recent-transactions empty states because no financial tables exist yet. Live company creation unverified (no test account).
