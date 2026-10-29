import { supabase } from "@/integrations/supabase/client";

// The generated client carries the project URL and publishable key itself, so auth is
// available whenever that client exists (env vars may be absent after a project transfer).
export const authConfigured = Boolean(supabase);
