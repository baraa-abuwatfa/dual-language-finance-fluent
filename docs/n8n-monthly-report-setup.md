# n8n Monthly Financial Report — Backend Setup

This document describes the backend endpoints that connect the AI CFO app to
the n8n **Monthly Financial Report** workflow (`/ai-cfo/monthly-report`).

> Implementation note: this project runs on TanStack Start (Cloudflare
> Workers), which does not support creating new Supabase Edge Functions. The
> two endpoints are implemented as equivalent **server API routes** with the
> exact same contract, token auth, and service-role data access. They deploy
> automatically with the app — no separate function deployment is needed.

## Database tables and columns used (all pre-existing, unchanged)

| Table | Columns used |
| --- | --- |
| `public.companies` | `id`, `name`, `primary_currency` |
| `public.company_members` | `company_id`, `user_id`, `role`, `status`, `created_at` |
| `public.transactions` | `id`, `company_id`, `type`, `amount`, `category`, `description`, `occurred_on` |
| `auth.users` (admin API only) | `email` — for the company owner's delivery email |

No new tables, no schema changes, no RLS changes. The service-role key is
used only inside the two server routes (required because `auth.users` email
is never readable through RLS-scoped clients).

## Endpoints

Base URLs (stable, immutable):

- Production: `https://dual-language-finance-fluent.lovable.app`
- Preview: `https://id-preview--232a3e35-1f65-4e48-a0cb-9e440c9572a9.lovable.app`

### 1. `POST /api/public/reports/company`

Returns the company identity and the owner's email.

Request:

```http
POST /api/public/reports/company
Content-Type: application/json
x-report-token: <N8N_REPORT_TOKEN>

{ "company_id": "11111111-2222-3333-4444-555555555555" }
```

Response `200`:

```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "name": "Acme Trading",
  "primary_currency": "USD",
  "owner_email": "owner@example.com"
}
```

Errors: `401` missing/invalid token · `400` invalid UUID · `404` company or
active owner not found · `500` lookup failure.

### 2. `POST /api/public/reports/transactions`

Returns the company's transactions for a date range, paginated. Strictly
scoped to the requested company — rows from other companies can never be
returned.

Request:

```http
POST /api/public/reports/transactions
Content-Type: application/json
x-report-token: <N8N_REPORT_TOKEN>

{
  "company_id": "11111111-2222-3333-4444-555555555555",
  "start_date": "2026-10-01",
  "end_date": "2026-10-31",
  "page": 1,
  "page_size": 100
}
```

Response `200`:

```json
{
  "data": [
    {
      "id": "…",
      "company_id": "11111111-2222-3333-4444-555555555555",
      "type": "expense",
      "amount": "500.00",
      "transaction_date": "2026-10-14",
      "category": "Rent",
      "description": "Office rent — October",
      "currency": "USD"
    }
  ],
  "page": 1,
  "page_size": 100,
  "total": 37,
  "has_more": false
}
```

`page` defaults to 1, `page_size` defaults to 100 (max 500). Keep requesting
pages while `has_more` is true. Errors: `401` · `400` invalid UUID/dates or
`start_date` after `end_date` · `404` company not found · `500` query failure.

## App → n8n webhook trigger

The server function `requestMonthlyReport`
(`src/lib/reports/monthly-report.functions.ts`) sends an authenticated POST
to the n8n webhook. Before sending it verifies:

1. The user has a valid session (bearer token verified server-side).
2. The user is an **active owner** of the requested company (checked against
   `company_members` with RLS as the user).
3. The delivery email is the owner's own verified session email — never
   taken from the request body.

Payload sent to the webhook:

```json
{
  "company_id": "…",
  "requested_by": "<auth user id>",
  "report_month": 10,
  "report_year": 2026,
  "delivery_email": "owner@example.com",
  "request_source": "ai-cfo-web"
}
```

Header: `x-ai-cfo-report-key: <N8N_WEBHOOK_SECRET>` — configure the n8n
Webhook node with Header Auth using the same name and value.

## Required secrets

Configure these in **Project Settings → Secrets** (server-side only, never
in frontend code or logs):

| Secret | Purpose | Where else it goes |
| --- | --- | --- |
| `N8N_REPORT_TOKEN` | Token n8n sends to the two report endpoints | n8n HTTP Request nodes → header `x-report-token` |
| `N8N_WEBHOOK_URL` | Full URL of the n8n webhook (`…/webhook/ai-cfo/monthly-report`) | — |
| `N8N_WEBHOOK_SECRET` | Header Auth value for the n8n Webhook node | n8n Webhook node → Header Auth (`x-ai-cfo-report-key`) |
| `SERVICE_ROLE_KEY` | Lets the report endpoints read the owner email from `auth.users` | Supabase Dashboard → Settings → API → service_role key |

## n8n workflow wiring (existing workflow, no new workflows)

1. **Webhook node** (`/ai-cfo/monthly-report`): enable Header Auth with
   name `x-ai-cfo-report-key` and value = `N8N_WEBHOOK_SECRET`.
2. **HTTP Request node → company**: POST to
   `<base URL>/api/public/reports/company` with header
   `x-report-token: <N8N_REPORT_TOKEN>` and body
   `{ "company_id": "{{ $json.company_id }}" }`.
3. **HTTP Request node → transactions**: POST to
   `<base URL>/api/public/reports/transactions` with the same token header
   and body built from the webhook payload (`company_id`, `report_month`,
   `report_year` → `start_date`/`end_date`). Loop pages while `has_more`.
4. Use `owner_email` from step 2 (or `delivery_email` from the webhook
   payload) as the report recipient.

## Testing with real records

After the secrets are configured and the app is published:

```bash
curl -X POST "https://dual-language-finance-fluent.lovable.app/api/public/reports/company" \
  -H "Content-Type: application/json" \
  -H "x-report-token: <N8N_REPORT_TOKEN>" \
  -d '{"company_id": "<your company id>"}'

curl -X POST "https://dual-language-finance-fluent.lovable.app/api/public/reports/transactions" \
  -H "Content-Type: application/json" \
  -H "x-report-token: <N8N_REPORT_TOKEN>" \
  -d '{"company_id": "<your company id>", "start_date": "2026-10-01", "end_date": "2026-10-31"}'
```

A wrong or missing token must return `401`; another company's id must return
only that company's rows (verify `company_id` in every row matches).
