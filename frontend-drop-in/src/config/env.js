export function getPublicSiteUrl() {
  const configured =
    process.env.REACT_APP_PUBLIC_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    "";

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getApiBaseUrl() {
  const configured =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "";

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:4000";
}

export function getSupabaseUrl() {
  return process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
}

export function getSupabaseAnonKey() {
  return (
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  );
}
