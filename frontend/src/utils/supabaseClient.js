import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This is shown in the browser console during local setup if .env is missing.
  // The app UI also catches Supabase errors, but this makes setup mistakes clearer.
  // Do not put the Supabase service role key in React.
  console.warn(
    "Missing Supabase environment variables. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
