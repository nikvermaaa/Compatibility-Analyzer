import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Safe warning during build time before credentials are provided
  if (process.env.NODE_ENV !== "production") {
    console.warn("[Database] Running with placeholder Supabase credentials. Add keys to .env.local for full connectivity.");
  }
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
