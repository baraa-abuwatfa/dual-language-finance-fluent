import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { authHead } from "@/lib/auth/head";
export const Route = createFileRoute("/reset-password")({ head: () => authHead("Reset your password", "Set a new password using your AI CFO recovery link."), component: () => <AuthForm mode="reset" /> });