# Authentication
- [ ] Direct authenticated Login/Signup and landing account actions to Dashboard after session loading; preserve public browsing and recovery.
- [x] Connect all landing Get Started actions to signup when signed out and the app when signed in; reuse existing real Auth flows and preserve design.
- [x] Add bilingual authentication forms, session handling, and protected placeholders.
- [x] Verify validation rules and public navigation; report unavailable checks.
- [x] Verify existing Supabase connection, Auth settings, hosted tables/RLS and signed-out create_company RPC protection without database changes.
- [ ] Verify live sign-up, sign-in, session restoration, logout, recovery and successful company creation: blocked by no existing Auth users or managed test session for this external Supabase connection; confirmation/recovery redirect allowlists also require verification.