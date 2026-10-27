import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState } from "react";

/**
 * Preserve existing CTA callers while routing to real authentication pages.
 */
export function useComingSoon() {
  const navigate = useNavigate();
  const { user, ready, recovery } = useAuth();
  const [pending, setPending] = useState<"login" | "signup" | null>(null);
  const destination = recovery && user ? "/reset-password" : user ? "/dashboard" : pending === "signup" ? "/signup" : "/auth";
  useEffect(() => {
    if (!ready || !pending) return;
    setPending(null);
    void navigate({ to: destination });
  }, [ready, pending, destination, navigate]);
  return {
    login: () => setPending("login"),
    signup: () => setPending("signup"),
  };
}
