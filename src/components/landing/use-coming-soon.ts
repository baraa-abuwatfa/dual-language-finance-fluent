import { useNavigate } from "@tanstack/react-router";

/**
 * Preserve existing CTA callers while routing to real authentication pages.
 */
export function useComingSoon() {
  const navigate = useNavigate();
  return {
    login: () => navigate({ to: "/auth" }),
    signup: () => navigate({ to: "/signup" }),
  };
}
