import { describe, expect, it } from "vitest";
import { buildMonthlyReportPayload, validateMonthlyReportInput } from "./monthly-report";

const COMPANY_ID = "11111111-2222-3333-4444-555555555555";

describe("validateMonthlyReportInput", () => {
  it("accepts a valid company, month and year", () => {
    expect(validateMonthlyReportInput({ companyId: COMPANY_ID, month: 10, year: 2026 })).toBeNull();
  });

  it("rejects a non-UUID company id", () => {
    expect(validateMonthlyReportInput({ companyId: "abc", month: 10, year: 2026 })).toBe("invalid_company");
  });

  it("rejects months outside 1-12", () => {
    expect(validateMonthlyReportInput({ companyId: COMPANY_ID, month: 0, year: 2026 })).toBe("invalid_month");
    expect(validateMonthlyReportInput({ companyId: COMPANY_ID, month: 13, year: 2026 })).toBe("invalid_month");
  });

  it("rejects implausible years", () => {
    expect(validateMonthlyReportInput({ companyId: COMPANY_ID, month: 5, year: 1999 })).toBe("invalid_year");
  });
});

describe("buildMonthlyReportPayload", () => {
  it("builds the exact n8n webhook contract with the web request source", () => {
    const payload = buildMonthlyReportPayload(
      { companyId: COMPANY_ID, month: 10, year: 2026 },
      "user-123",
      "owner@example.com",
    );
    expect(payload).toEqual({
      company_id: COMPANY_ID,
      requested_by: "user-123",
      report_month: 10,
      report_year: 2026,
      delivery_email: "owner@example.com",
      request_source: "ai-cfo-web",
    });
  });
});
