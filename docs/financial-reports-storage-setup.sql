-- Financial Reports archive: private Storage bucket + report_files metadata.
-- This transferred project has no managed database-migration access, so run this
-- script once in the Supabase SQL Editor of the existing project. It extends the
-- existing schema only; no existing table, policy, or record is modified.

-- 1. Dedicated private bucket (20 MB per file cap).
insert into storage.buckets (id, name, public, file_size_limit)
values ('financial-reports', 'financial-reports', false, 20971520)
on conflict (id) do nothing;

-- 2. Metadata table. month = 0 marks an annual report so the unique key
--    (company_id, report_type, year, month) dedupes repeated exports of the
--    same company and period: re-exports upsert instead of duplicating.
create table if not exists public.report_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_type text not null check (report_type in ('monthly', 'annual')),
  year integer not null check (year between 2000 and 2100),
  month integer not null check (month between 0 and 12),
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, report_type, year, month)
);

-- This project's default privileges grant ALL to anon/authenticated, so revoke first.
revoke all on public.report_files from anon, public;
grant select, insert, update on public.report_files to authenticated;
grant all on public.report_files to service_role;

alter table public.report_files enable row level security;

create policy "Members view report files" on public.report_files
  for select to authenticated
  using (private.is_company_member(company_id));

create policy "Finance roles add report files" on public.report_files
  for insert to authenticated
  with check (private.has_company_role(company_id, array['owner','admin','finance_manager']::public.company_role[]));

create policy "Finance roles replace report files" on public.report_files
  for update to authenticated
  using (private.has_company_role(company_id, array['owner','admin','finance_manager']::public.company_role[]))
  with check (private.has_company_role(company_id, array['owner','admin','finance_manager']::public.company_role[]));

-- 3. Storage policies. private.storage_company(name) reads the company id from
--    the first path segment: company_id/year/month/monthly-report.pdf.
create policy "Members read report files" on storage.objects
  for select to authenticated
  using (bucket_id = 'financial-reports' and private.is_company_member(private.storage_company(name)));

create policy "Finance roles upload report files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'financial-reports' and private.has_company_role(private.storage_company(name), array['owner','admin','finance_manager']::public.company_role[]));

create policy "Finance roles replace report files" on storage.objects
  for update to authenticated
  using (bucket_id = 'financial-reports' and private.has_company_role(private.storage_company(name), array['owner','admin','finance_manager']::public.company_role[]))
  with check (bucket_id = 'financial-reports' and private.has_company_role(private.storage_company(name), array['owner','admin','finance_manager']::public.company_role[]));
