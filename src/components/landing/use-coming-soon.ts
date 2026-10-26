import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Phase 1 has no accounts yet. Login / Get Started explain that honestly
 * instead of pretending to sign the user in.
 */
export function useComingSoon() {
  const { t } = useI18n();
  return {
    login: () => toast(t.toasts.comingSoonTitle, { description: t.toasts.loginBody }),
    signup: () => toast(t.toasts.comingSoonTitle, { description: t.toasts.signupBody }),
  };
}
