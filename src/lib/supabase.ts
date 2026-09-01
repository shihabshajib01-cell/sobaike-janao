import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim();

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    client = null;
  }
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey && client);
};
