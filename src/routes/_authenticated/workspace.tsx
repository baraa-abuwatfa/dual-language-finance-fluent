import { createFileRoute, redirect } from "@tanstack/react-router";
import { authHead } from "@/lib/auth/head";
export const Route = createFileRoute("/_authenticated/workspace")({ head: () => authHead("Your workspace", "Continue to your secure AI CFO dashboard."), beforeLoad: () => { throw redirect({ to: "/dashboard", replace: true }); } });