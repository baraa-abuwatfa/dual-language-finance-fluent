import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { safeReturnPath } from "@/lib/auth/rules";
import { authConfigured } from "@/lib/auth/config";
export const Route = createFileRoute("/_authenticated")({ ssr: false, beforeLoad: async ({ location }) => {
  if (!authConfigured) throw redirect({ to: "/auth", search: { redirect: safeReturnPath(location.pathname) } });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: safeReturnPath(location.pathname) } });
  if (window.sessionStorage.getItem("aicfo.recovery") === "true") throw redirect({ to: "/reset-password" });
}, component: Outlet });