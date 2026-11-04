import { describe, expect, it } from "vitest";
import { reportFileRow, reportStoragePath } from "./report-storage";

const companyId = "11111111-2222-3333-4444-555555555555";

describe("reportStoragePath", () => {
  it("builds company_id/year/month/monthly-report.pdf for monthly reports", () => {
    expect(reportStoragePath(companyId, { type: "monthly", year: 2026, month: 3 })).toBe(
      `${companyId}/2026/03/monthly-report.pdf`,
    );
  });

  it("zero-pads single-digit months", () => {
    expect(reportStoragePath(companyId, { type: "monthly", year: 2026, month: 11 })).toBe(
      `${companyId}/2026/11/monthly-report.pdf`,
    );
  });

  it("builds company_id/year/annual-report.pdf for annual reports", () => {
    expect(reportStoragePath(companyId, { type: "annual", year: 2026, month: 1 })).toBe(
      `${companyId}/2026/annual-report.pdf`,
    );
  });

  it("places the company id as the first path segment for storage RLS", () => {
    expect(reportStoragePath(companyId, { type: "monthly", year: 2026, month: 5 }).split("/")[0]).toBe(companyId);
  });
});

describe("reportFileRow", () => {
  it("records company, type, period and storage path", () => {
    const row = reportFileRow(companyId, { type: "monthly", year: 2026, month: 3 }, "p/monthly-report.pdf");
    expect(row).toMatchObject({ company_id: companyId, report_type: "monthly", year: 2026, month: 3, storage_path: "p/monthly-report.pdf" });
    expect(Number.isNaN(Date.parse(row.updated_at))).toBe(false);
  });

  it("uses month 0 for annual reports so the unique key dedupes re-exports", () => {
    const row = reportFileRow(companyId, { type: "annual", year: 2026, month: 7 }, "p/annual-report.pdf");
    expect(row.month).toBe(0);
    expect(row.report_type).toBe("annual");
  });
});
