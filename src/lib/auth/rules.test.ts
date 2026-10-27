import { describe, expect, it } from "vitest";
import { companyDestination, formSchema, safeReturnPath, authErrorKey } from "./rules";
const values = { name: "Test User", email: "test@example.com", password: "ValidPass8", confirm: "ValidPass8" };
describe("Authentication rules", () => {
  it("rejects missing required full name", () => expect(formSchema("signup").safeParse({ ...values, name: " " }).success).toBe(false));
  it("rejects invalid email", () => expect(formSchema("login").safeParse({ ...values, email: "wrong" }).success).toBe(false));
  it("does not apply new password strength rules to existing login credentials", () => expect(formSchema("login").safeParse({ ...values, password: "old" }).success).toBe(true));
  it("rejects mismatched registration passwords", () => expect(formSchema("signup").safeParse({ ...values, confirm: "Different8" }).success).toBe(false));
  it("rejects mismatched recovery passwords", () => expect(formSchema("reset").safeParse({ ...values, confirm: "Different8" }).success).toBe(false));
  it("requires 8 characters uppercase lowercase and a number for new passwords", () => { for (const password of ["Abcdef1", "abcdefgh8", "ABCDEFGH8", "Abcdefgh"]) expect(formSchema("signup").safeParse({ ...values, password, confirm: password }).success).toBe(false); expect(formSchema("signup").safeParse(values).success).toBe(true); });
  it("routes users without active membership to setup", () => expect(companyDestination([{ status: "invited" }, { status: "suspended" }])).toBe("/company-setup"));
  it("routes one active membership to workspace", () => expect(companyDestination([{ status: "active" }, { status: "invited" }])).toBe("/workspace"));
  it("never chooses between multiple active memberships", () => expect(companyDestination([{ status: "active" }, { status: "active" }])).toBe("/select-company"));
  it("rejects external or arbitrary login destinations", () => { expect(safeReturnPath("https://evil.example")).toBeUndefined(); expect(safeReturnPath("//evil.example")).toBeUndefined(); expect(safeReturnPath("/workspace")).toBe("/workspace"); });
  it("maps unexpected service errors to safe messages", () => expect(authErrorKey({ code: "internal_private_detail" })).toBe("generic"));
});