import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { authHead } from "@/lib/auth/head";
import { safeReturnPath } from "@/lib/auth/rules";
export const Route = createFileRoute("/auth")({ validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined; reset?: boolean | undefined } => ({ redirect: safeReturnPath(search['redirect']), reset: search['reset'] === true || search['reset'] === "true" }), head: () => authHead("Sign in", "Securely sign in to your AI CFO account."), component: Login });
function Login() { const { reset } = Route.useSearch(); return <AuthForm mode="login" resetSuccess={Boolean(reset)} />; }