// Runtime Supabase client for Sociova.
// Re-exports the Lovable-managed browser client so the rest of the app can
// import from a stable, framework-agnostic path (`@/lib/supabase`).
// When migrating to Prisma + PostgreSQL later, only this file and
// `src/lib/auth.ts` need to be swapped.
export { supabase } from "@/integrations/supabase/client";
export type { Database } from "@/integrations/supabase/types";
