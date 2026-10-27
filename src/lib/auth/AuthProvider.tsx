import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { authConfigured } from "./config";

const AuthContext = createContext<{ user: User | null; ready: boolean; recovery: boolean; signOut: () => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!authConfigured) { setReady(true); return; }
    let live = true;
    let changed = false;
    setRecovery(window.sessionStorage.getItem("aicfo.recovery") === "true");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); window.sessionStorage.setItem("aicfo.recovery", "true"); }
      if (event === "SIGNED_OUT") { setRecovery(false); window.sessionStorage.removeItem("aicfo.recovery"); }
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      changed = true;
      setUser(session?.user ?? null);
      setReady(true);
      // Defer router work outside the auth callback to avoid lock re-entry.
      setTimeout(() => { if (!live) return; void router.invalidate(); if (event !== "SIGNED_OUT") void queryClient.invalidateQueries(); else { queryClient.clear(); if (router.state.matches.some((match) => match.routeId.startsWith("/_authenticated"))) void router.navigate({ to: "/auth", replace: true }); } }, 0);
    });
    void supabase.auth.getUser().then(({ data }) => { if (live && !changed) { setUser(data.user); setReady(true); } }).catch(() => { if (live && !changed) setReady(true); });
    return () => { live = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setRecovery(false);
    window.sessionStorage.removeItem("aicfo.recovery");
    await router.navigate({ to: "/auth", replace: true });
  }
  return <AuthContext.Provider value={{ user, ready, recovery, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const auth = useContext(AuthContext); if (!auth) throw new Error("AuthProvider is required"); return auth; }