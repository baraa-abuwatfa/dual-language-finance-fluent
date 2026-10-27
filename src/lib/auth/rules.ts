import { z } from "zod";
export type AuthMode = "login" | "signup" | "forgot" | "reset";
const email = z.string().trim().min(1, "required").max(255, "tooLong").email("invalidEmail");
const password = z.string().min(1, "required").max(128, "tooLong");
const strongPassword = password.min(8, "weakPassword").regex(/[a-z]/, "weakPassword").regex(/[A-Z]/, "weakPassword").regex(/[0-9]/, "weakPassword");
export function formSchema(mode: AuthMode) {
  return z.object({
    email: mode === "reset" ? z.string() : email,
    name: mode === "signup" ? z.string().trim().min(1, "required").max(100, "tooLong") : z.string(),
    password: mode === "forgot" ? z.string() : mode === "login" ? password : strongPassword,
    confirm: mode === "signup" || mode === "reset" ? password : z.string(),
  }).superRefine((values, ctx) => {
    if ((mode === "signup" || mode === "reset") && values.password !== values.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "mismatch" });
  });
}
export function authErrorKey(error: { code?: string; status?: number }) {
  if (error.status === 429) return "rateLimit";
  switch (error.code) {
    case "invalid_credentials": return "invalidCredentials";
    case "email_not_confirmed": return "unconfirmed";
    case "user_already_exists": case "email_exists": return "duplicate";
    case "weak_password": return "weakPassword";
    case "otp_expired": case "session_not_found": return "invalidRecovery";
    default: return "generic";
  }
}
export function companyDestination(members: { status: string }[]) {
  const active = members.filter((member) => member.status === "active");
  return active.length === 0 ? "/company-setup" : active.length > 1 ? "/select-company" : "/workspace";
}
export function safeReturnPath(value: unknown): string | undefined {
  return typeof value === "string" && ["/workspace", "/company-setup", "/select-company"].includes(value) ? value : undefined;
}