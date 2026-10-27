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
- Database, backend, and n8n implementation: not started.
