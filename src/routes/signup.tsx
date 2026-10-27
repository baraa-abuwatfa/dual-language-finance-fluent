import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { authHead } from "@/lib/auth/head";
export const Route = createFileRoute("/signup")({ head: () => authHead("Create an account", "Create your secure AI CFO account in Arabic or English."), component: () => <AuthForm mode="signup" /> });