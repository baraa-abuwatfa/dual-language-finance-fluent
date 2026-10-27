import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { authHead } from "@/lib/auth/head";
export const Route = createFileRoute("/forgot-password")({ head: () => authHead("Password recovery", "Request a secure password reset link for your AI CFO account."), component: () => <AuthForm mode="forgot" /> });