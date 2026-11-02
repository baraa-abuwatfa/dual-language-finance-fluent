// Pure, testable helpers for the monthly-report n8n webhook trigger.

export type MonthlyReportInput = {
  companyId: string;
  month: number; // 1-12
  year: number;
};

export type MonthlyReportPayload = {
  company_id: string;
  requested_by: string;
  report_month: number;
  report_year: number;
  delivery_email: string;
  request_source: "ai-cfo-web";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateMonthlyReportInput(input: MonthlyReportInput): string | null {
  if (!UUID_RE.test(input.companyId)) return "invalid_company";
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) return "invalid_month";
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) return "invalid_year";
  return null;
}

export function buildMonthlyReportPayload(
  input: MonthlyReportInput,
  requestedBy: string,
  deliveryEmail: string,
): MonthlyReportPayload {
  return {
    company_id: input.companyId,
    requested_by: requestedBy,
    report_month: input.month,
    report_year: input.year,
    delivery_email: deliveryEmail,
    request_source: "ai-cfo-web",
  };
}
