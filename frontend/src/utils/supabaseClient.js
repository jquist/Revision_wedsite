import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this as a warning so the app can still render a helpful auth error in development.
  // Do not put your service role key in the frontend.
  // eslint-disable-next-line no-console
  console.warn("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
