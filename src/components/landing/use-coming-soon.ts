import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Preserve existing CTA callers while routing to real authentication pages.
 */
export function useComingSoon() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return {
    login: () => navigate({ to: "/auth" }),
    signup: () => navigate({ to: user ? "/workspace" : "/signup" }),
  };
}
